import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-cancel unpaid orders after 24 hours.
 *
 * Runs hourly via vercel.json cron. Finds any order that:
 *   - payment_status = 'pending'  (customer hasn't uploaded a slip yet;
 *                                   'uploaded' orders are still awaiting
 *                                   admin confirmation, don't touch those)
 *   - order_status   = 'new'      (not already paid, packed, shipped, etc)
 *   - created_at    <  NOW() - 24h
 *
 * For each:
 *   1. Mark order 'cancelled' with a machine-readable note + cancelled_items
 *      list so the admin dashboard still shows what was lost.
 *   2. Restore inventory via the shared restoreStock() helper so the same
 *      books become available to other customers immediately.
 *   3. Email the customer if they gave an email address (apologetic, explains
 *      the 24h window, invites them to re-order).
 *
 * Idempotent: re-running the cron on already-cancelled orders is a no-op
 * because the WHERE clause filters them out.
 *
 * Auth: same Bearer $CRON_SECRET pattern as /api/cron/birthday-check and
 * /api/cron/renewal-reminders.
 */

export const runtime = 'nodejs'
export const maxDuration = 60

const WINDOW_HOURS = 24

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderRow = any

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase-server')
  const { restoreStock } = await import('@/lib/restore-stock')

  const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  try {
    // 1. Find candidates
    const { data: candidates, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, total_amount, currency, created_at, items:order_items(id, book_id, title, price, condition, quantity)')
      .eq('payment_status', 'pending')
      .eq('order_status', 'new')
      .lt('created_at', cutoff)
      .limit(100) // safety cap per run

    if (fetchError) {
      console.error('[cron/cancel-unpaid-orders] fetch failed:', fetchError)
      return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
    }

    const orders = (candidates || []) as OrderRow[]
    if (orders.length === 0) {
      return NextResponse.json({ processed: 0, restored: 0 })
    }

    let processed = 0
    let totalRestored = 0
    const failures: Array<{ orderNumber: string; reason: string }> = []

    for (const order of orders) {
      try {
        const items = order.items || []
        const cancelledItemsJson = items.map((it: OrderRow) => ({
          book_id: it.book_id,
          title: it.title,
          price: it.price * (Number(it.quantity) || 1),
          reason: 'auto-cancelled: no payment received within 24 hours',
        }))

        // a. Mark the order cancelled
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            order_status: 'cancelled',
            cancelled_items: cancelledItemsJson,
          })
          .eq('id', order.id)

        if (updateError) {
          failures.push({ orderNumber: order.order_number, reason: updateError.message })
          continue
        }

        // b. Restore stock
        try {
          const result = await restoreStock(
            supabaseAdmin,
            items.map((it: OrderRow) => ({
              book_id: it.book_id,
              condition: it.condition,
              quantity: it.quantity,
            })),
          )
          totalRestored += result.restoredCount
          if (result.failures.length > 0) {
            console.error('[cron/cancel-unpaid-orders] partial stock restore for', order.order_number, result.failures)
          }
        } catch (restoreErr) {
          console.error('[cron/cancel-unpaid-orders] restoreStock threw for', order.order_number, restoreErr)
          // Don't fail the whole order on stock restore issues — the row
          // is already marked cancelled, which is the important part.
        }

        // c. Email the customer if we have an address
        if (order.customer_email) {
          try {
            const { sendAutoCancellationEmail } = await import('@/lib/email')
            await sendAutoCancellationEmail({
              to: order.customer_email,
              customerName: order.customer_name,
              orderNumber: order.order_number,
              totalAmount: Number(order.total_amount) || 0,
              currency: (order.currency as 'THB' | 'USD') || 'THB',
              items: items.map((it: OrderRow) => ({
                title: it.title,
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
              })),
            })
          } catch (emailErr) {
            console.error('[cron/cancel-unpaid-orders] email failed for', order.order_number, emailErr)
          }
        }

        processed++
      } catch (orderErr) {
        const message = orderErr instanceof Error ? orderErr.message : String(orderErr)
        failures.push({ orderNumber: order.order_number, reason: message })
      }
    }

    return NextResponse.json({
      processed,
      restored: totalRestored,
      candidates: orders.length,
      failures,
      cutoff,
    })
  } catch (err) {
    console.error('[cron/cancel-unpaid-orders] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
