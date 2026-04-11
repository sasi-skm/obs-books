/**
 * Lazy-cancel helper — auto-expires a single order if it's past the
 * 24-hour unpaid window.
 *
 * Called from the order-lookup paths (/api/orders/lookup,
 * /api/orders GET) so that when a customer opens the /track or
 * /slip-upload page on a stale unpaid order, it gets cancelled and
 * stock restored immediately — without waiting for the nightly cron.
 *
 * This is the "on the dot" UX layer. The daily cron is the sweep that
 * catches orders no one ever checks again.
 *
 * Returns true if the order was cancelled, false otherwise.
 */

const WINDOW_MS = 24 * 60 * 60 * 1000

export interface ExpireCandidate {
  id: string
  order_number: string
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  total_amount?: number | null
  currency?: string | null
  created_at: string
  payment_status: string
  order_status: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items?: any[] | null
}

export async function maybeExpireOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  order: ExpireCandidate,
): Promise<boolean> {
  // Only expire orders still awaiting payment upload.
  if (order.payment_status !== 'pending') return false
  if (order.order_status !== 'new') return false

  const createdMs = new Date(order.created_at).getTime()
  if (!Number.isFinite(createdMs)) return false
  if (Date.now() - createdMs < WINDOW_MS) return false

  // Past the window — expire it.
  try {
    const items = Array.isArray(order.items) ? order.items : []
    const cancelledItemsJson = items.map(it => ({
      book_id: it.book_id,
      title: it.title,
      price: (Number(it.price) || 0) * (Number(it.quantity) || 1),
      reason: 'auto-cancelled: no payment received within 24 hours',
    }))

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ order_status: 'cancelled', cancelled_items: cancelledItemsJson })
      .eq('id', order.id)

    if (updateError) {
      console.error('[maybeExpireOrder] update failed:', updateError)
      return false
    }

    // Restore stock via the shared helper.
    try {
      const { restoreStock } = await import('./restore-stock')
      await restoreStock(
        supabaseAdmin,
        items.map(it => ({
          book_id: it.book_id,
          condition: it.condition,
          quantity: it.quantity,
        })),
      )
    } catch (restoreErr) {
      console.error('[maybeExpireOrder] restoreStock threw:', restoreErr)
    }

    // Email the customer if they gave an address. Non-blocking.
    if (order.customer_email) {
      try {
        const { sendAutoCancellationEmail } = await import('./email')
        await sendAutoCancellationEmail({
          to: order.customer_email,
          customerName: order.customer_name || '',
          orderNumber: order.order_number,
          totalAmount: Number(order.total_amount) || 0,
          currency: (order.currency as 'THB' | 'USD') || 'THB',
          items: items.map(it => ({
            title: it.title,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
          })),
        })
      } catch (emailErr) {
        console.error('[maybeExpireOrder] email failed:', emailErr)
      }
    }

    return true
  } catch (err) {
    console.error('[maybeExpireOrder] threw:', err)
    return false
  }
}
