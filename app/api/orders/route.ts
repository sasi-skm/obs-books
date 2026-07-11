import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import {
  getAuthedUser,
  buildServerLines,
  resolveVoucherDiscount,
  POINTS_COST,
  POINTS_DISCOUNT_THB,
  type IncomingItem,
} from '@/lib/order-pricing'

/**
 * Money is decided here, not in the browser.
 *
 * Everything a customer's browser sends about *price* is treated as a
 * hint at most: line prices, the order total, the discount, who the
 * customer is. All of it is recomputed from the database before we
 * write a row or send Sasi an email. The Stripe route
 * (app/api/checkout/stripe/route.ts) has always worked this way because
 * Stripe charges whatever amount we hand it; this route needs the same
 * boundary because the order row it writes is what Sasi ships against.
 *
 * The pricing helpers live in lib/order-pricing.ts, shared with
 * /api/orders/quote so the amount a PromptPay customer is told to
 * transfer comes from the same arithmetic that writes the order.
 */

// The customer picks a payment method here; card orders go through the
// Stripe route instead and must never be created by this endpoint.
const ALLOWED_PAYMENT_METHODS = new Set(['promptpay', 'transfer'])
const ALLOWED_CURRENCIES = new Set(['THB', 'USD'])

/**
 * Atomically spend POINTS_COST from the user's balance.
 *
 * PostgREST cannot express `balance = balance - 100`, and the only
 * RPCs that exist in production are decrement_book_copies/is_admin
 * (new SQL cannot ship with this change). So: optimistic
 * compare-and-swap - read the balance, write balance-100 guarded by
 * `eq(points_balance, <what we read>)`. If another request spent
 * points in between, zero rows match and we retry against the fresh
 * balance. The old read-then-write raced: two concurrent orders could
 * both read 100, both pass the check, and spend the same points twice.
 */
async function redeemPointsAtomically(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('points_balance')
      .eq('id', userId)
      .single()
    if (!profile || profile.points_balance < POINTS_COST) return false

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ points_balance: profile.points_balance - POINTS_COST })
      .eq('id', userId)
      .eq('points_balance', profile.points_balance)
      .select('id')
    if (!error && updated && updated.length === 1) return true
  }
  return false
}

/**
 * Give the points back after a failed order write. Same CAS loop.
 * If this fails too (DB down hard), the customer has lost 100 points
 * with no order - log it loud enough that it can be fixed by hand.
 */
async function refundPoints(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('points_balance')
      .eq('id', userId)
      .single()
    if (!profile) continue
    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ points_balance: profile.points_balance + POINTS_COST })
      .eq('id', userId)
      .eq('points_balance', profile.points_balance)
      .select('id')
    if (!error && updated && updated.length === 1) return
  }
  console.error(
    `[api/orders] CRITICAL: failed to refund ${POINTS_COST} points to user ${userId} after a failed order write. Restore manually.`,
  )
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { id: 'orders-create', limit: 8, windowMs: 60000 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await req.json()
    const {
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      payment_method,
      note,
      items,
      destination_country,
      currency,
      redeem_points,
      voucher_id,
      expected_total,
    } = body as {
      customer_name?: string
      customer_phone?: string
      customer_email?: string
      shipping_address?: string
      payment_method?: string
      note?: string
      items?: IncomingItem[]
      destination_country?: string
      currency?: string
      redeem_points?: boolean
      voucher_id?: string | null
      expected_total?: number | null
    }

    if (!customer_name || !customer_phone || !shipping_address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!payment_method || !ALLOWED_PAYMENT_METHODS.has(payment_method)) {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 })
    }
    const paymentMethod = payment_method as 'promptpay' | 'transfer'
    const orderCurrency = ALLOWED_CURRENCIES.has(String(currency)) ? String(currency) : 'THB'

    const orderNumber = 'OBS-' + Date.now().toString(36).toUpperCase()

    const supabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!supabaseConfigured) {
      // Local-dev convenience only: no database, nothing persisted.
      // Production always has Supabase configured and never takes
      // this path, so a real customer can never receive an order
      // number that doesn't exist in the database.
      return NextResponse.json({ order_number: orderNumber })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    const built = await buildServerLines(supabaseAdmin, items)
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    const { lines } = built

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

    // The session - not the body - decides whose account this is.
    const authedUser = await getAuthedUser()
    const userId = authedUser?.id ?? null
    const voucherEmail = customer_email || authedUser?.email || null

    const { discount: voucherDiscount, voucherId: validVoucherId } =
      await resolveVoucherDiscount(supabaseAdmin, voucher_id ?? null, voucherEmail, subtotal)

    // Points are only spendable by the signed-in owner of the balance,
    // and the discount is only granted if the deduction actually
    // landed (atomic CAS). Deducting BEFORE the order is written means
    // a discounted order can never exist without its points having
    // been spent; if the order write fails below, the points are
    // refunded.
    let pointsDiscount = 0
    let pointsDeducted = false
    if (redeem_points && userId) {
      pointsDeducted = await redeemPointsAtomically(supabaseAdmin, userId)
      if (pointsDeducted) pointsDiscount = POINTS_DISCOUNT_THB
    }

    const totalAmount = Math.max(0, subtotal - voucherDiscount - pointsDiscount)

    // The checkout page quotes /api/orders/quote before the customer
    // transfers. If the authoritative total no longer matches what the
    // customer was shown (a voucher went stale mid-checkout), the money
    // they sent is wrong - tell the client AND Sasi instead of leaving
    // it for her to discover during slip verification.
    const totalMismatch =
      typeof expected_total === 'number' && expected_total !== totalAmount

    try {
      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name,
          customer_phone,
          customer_email: customer_email || null,
          shipping_address,
          payment_method: paymentMethod,
          note: note || null,
          total_amount: totalAmount,
          // The slip is attached later by /api/upload-slip, which
          // verifies the order first. A new order is always unpaid.
          slip_url: null,
          destination_country: destination_country || 'TH',
          currency: orderCurrency,
          payment_status: 'pending',
          order_status: 'new',
          user_id: userId,
          subscriber_discount_applied: false,
          subscriber_discount_amount: 0,
        })
        .select()
        .single()

      if (orderError || !order) throw orderError ?? new Error('Order insert returned no row')

      // Create order items from the server-priced lines. An order row
      // without its items is a shipment Sasi can't pack - treat a
      // failed items write as a failed order.
      const orderItems = lines.map(line => ({
        order_id: order.id,
        book_id: line.book_id,
        title: line.title,
        author: line.author,
        price: line.price,
        image_url: line.image_url,
        condition: line.condition,
        quantity: line.quantity,
      }))

      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems)
      if (itemsError) {
        // Best-effort: remove the empty order shell so /track and admin
        // never see a total with no books attached.
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      // Decrement book copies (per condition if available, repeat for quantity)
      for (const line of lines) {
        for (let q = 0; q < line.quantity; q++) {
          await supabaseAdmin.rpc('decrement_book_copies', {
            book_id_param: line.book_id,
            condition_param: line.condition,
          })
        }
      }

      // Record voucher use - only for a voucher that just passed validation
      if (validVoucherId && voucherEmail) {
        try {
          await supabaseAdmin.from('voucher_uses').insert({
            voucher_id: validVoucherId,
            email: voucherEmail,
            order_id: order.id,
          })
        } catch (vErr) {
          console.error('Voucher recording error:', vErr)
        }
      }

      // The points were already deducted atomically above; this is the
      // audit record linking the spend to the order.
      if (pointsDeducted && userId) {
        try {
          await supabaseAdmin.from('points_transactions').insert({
            user_id: userId,
            points: -POINTS_COST,
            type: 'redeemed',
            reference_id: order.id,
            book_title: null,
          })
        } catch (pointsErr) {
          console.error('Points transaction record error (points already deducted):', pointsErr)
        }
      }

      if (totalMismatch) {
        console.error('[api/orders] total mismatch: customer was shown a different amount', {
          orderNumber,
          expected_total,
          recorded_total: totalAmount,
        })
      }

      // Send emails (non-blocking). These quote the server's numbers,
      // so Sasi's admin email can't be spoofed with a fake total.
      const emailItems = lines.map(l => ({
        title: l.title,
        price: l.price,
        quantity: l.quantity,
        condition: l.condition ?? undefined,
      }))
      try {
        const { sendAdminNewOrderEmail, sendOrderConfirmationEmail } = await import('@/lib/email')
        await Promise.allSettled([
          sendAdminNewOrderEmail({
            orderNumber,
            customerName: customer_name,
            customerPhone: customer_phone,
            customerEmail: customer_email,
            totalAmount,
            paymentMethod,
            items: emailItems,
            reconcileNote: totalMismatch
              ? `Heads up: the customer was shown ฿${Number(expected_total).toLocaleString()} at checkout but the recorded total is ฿${totalAmount.toLocaleString()} (a discount changed between quote and order). Check the transferred amount against the slip.`
              : undefined,
          }),
          customer_email
            ? sendOrderConfirmationEmail({
                to: customer_email,
                customerName: customer_name,
                orderNumber,
                items: emailItems,
                totalAmount,
                paymentMethod,
                shippingAddress: shipping_address,
              })
            : Promise.resolve(),
        ])
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr)
      }

      return NextResponse.json({
        order_number: orderNumber,
        id: order.id,
        total_amount: totalAmount,
        total_mismatch: totalMismatch,
      })
    } catch (err) {
      // The old code fell through to a fabricated "success" here: a 200
      // with an order number that exists nowhere, shown to a customer
      // who had already transferred real money. Fail honestly instead -
      // the checkout page keeps them on the payment step with their
      // cart intact so they can retry or contact Sasi.
      console.error('Supabase order error:', err)
      if (pointsDeducted && userId) {
        await refundPoints(supabaseAdmin, userId)
      }
      return NextResponse.json(
        { error: 'We could not save your order. Please try again - your cart is untouched.' },
        { status: 500 },
      )
    }
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

/**
 * Public order lookup for the /track page.
 *
 * Anyone with an order number can call this - no auth. That's by design
 * so guest customers can check status without an account. BUT we must
 * NOT leak customer PII (name, phone, email, address) because order
 * numbers are mildly predictable (OBS- + base36 timestamp) and someone
 * could enumerate them. We return ONLY the fields /track renders.
 *
 * If you need the full order (for admin or for the authenticated
 * customer viewing their own order), use a different, auth-gated path.
 */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')
  if (!orderNumber) {
    return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      // Pull extra fields (id, customer_name/email) ONLY so the lazy-
      // expire helper has what it needs. They are NOT returned to the
      // client - the response below is still the non-PII subset.
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          order_number,
          order_status,
          payment_status,
          payment_method,
          total_amount,
          currency,
          destination_country,
          tracking_number,
          courier,
          created_at,
          cancelled_items,
          customer_name,
          customer_email,
          customer_phone,
          items:order_items(id, book_id, title, price, image_url, condition, quantity)
        `)
        .eq('order_number', orderNumber)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Lazy-expire before returning so the customer sees the real
      // status if this order is past its 24h payment window.
      let effectiveStatus = order.order_status
      let effectiveCancelled = order.cancelled_items
      if (order.payment_status === 'pending' && order.order_status === 'new') {
        const { maybeExpireOrder } = await import('@/lib/expire-order')
        const cancelled = await maybeExpireOrder(supabaseAdmin, order)
        if (cancelled) {
          effectiveStatus = 'cancelled'
          effectiveCancelled = (order.items || []).map((it: { book_id: string; title: string; price: number; quantity?: number }) => ({
            book_id: it.book_id,
            title: it.title,
            price: (Number(it.price) || 0) * (Number(it.quantity) || 1),
            reason: 'auto-cancelled: no payment received within 24 hours',
          }))
        }
      }

      // Explicit pick of safe fields - defense in depth. No PII ever
      // leaves this endpoint even though we selected it internally
      // for the expire check.
      return NextResponse.json({
        order_number: order.order_number,
        order_status: effectiveStatus,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        currency: order.currency,
        destination_country: order.destination_country,
        tracking_number: order.tracking_number,
        courier: order.courier,
        created_at: order.created_at,
        cancelled_items: effectiveCancelled,
        items: (order.items || []).map((it: { id: string; title: string; price: number; image_url?: string; condition?: string; quantity?: number }) => ({
          id: it.id,
          title: it.title,
          price: it.price,
          image_url: it.image_url,
          condition: it.condition,
          quantity: it.quantity,
        })),
      })
    } catch (err) {
      console.error('[api/orders GET] failed:', err)
    }
  }

  return NextResponse.json({ error: 'Order not found' }, { status: 404 })
}
