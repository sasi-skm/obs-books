import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { restoreStock } from '@/lib/restore-stock'

// Stripe webhook signature verification needs the raw request body, so
// we must NOT rely on Next's built-in JSON parsing. Reading req.text()
// in App Router gives us the raw payload exactly as Stripe sent it.
//
// runtime='nodejs' because the Stripe SDK uses Node crypto for the HMAC
// comparison; this is unavailable in the edge runtime.
export const runtime = 'nodejs'

// Disable static optimization — every webhook delivery must hit our
// handler fresh.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  if (!supabaseAdmin) {
    console.error('[stripe webhook] supabaseAdmin not available')
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe webhook] signature verification failed:', message)
    // 400 tells Stripe the request was malformed; it will not retry on 4xx.
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        // Acknowledge unknown event types so Stripe stops retrying.
        // We register only the three above in the dashboard, but Stripe
        // sometimes delivers related events on the same connection.
        console.log('[stripe webhook] ignoring event type:', event.type)
    }
  } catch (err) {
    // Returning 5xx here triggers Stripe to retry — only do that for
    // genuinely transient failures (DB outage, etc). Logical errors
    // (bad metadata, missing order) should swallow + 2xx so we don't
    // get stuck in a retry loop.
    console.error('[stripe webhook] handler threw for', event.type, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── checkout.session.completed ────────────────────────────────────────────
//
// Customer completed payment. Flip the order to paid, persist the
// PaymentIntent id (needed for refunds), and email the customer. The
// UPDATE is conditional on order_status='new' so a duplicate delivery
// (Stripe retries any non-2xx) or a race with the auto-cancel cron
// can't double-email or double-confirm.
async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) {
    console.error('[stripe webhook] session.completed missing metadata.order_id', session.id)
    return
  }

  // Stripe types `payment_intent` as string | PaymentIntent | null; for
  // a payment-mode session it's always a string id (the object form
  // only appears when the request expanded it).
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null

  // Atomic conditional update — only the first writer flips 'new' →
  // 'paid'. The .select() returns the row(s) actually updated so we
  // can detect zero-row no-ops cleanly.
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'confirmed',
      order_status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', orderId)
    .eq('order_status', 'new')
    .select('id, order_number, customer_name, customer_email, total_amount, currency')

  if (updateErr) {
    console.error('[stripe webhook] order update failed:', updateErr)
    throw updateErr // bubble up → Stripe retries
  }

  if (!updated || updated.length === 0) {
    // Already processed — duplicate delivery, or the cron / a manual
    // admin action got here first. Idempotent no-op.
    console.log('[stripe webhook] session.completed: order already finalised', orderId)
    return
  }

  const order = updated[0]

  // Send the customer their confirmation email. Stripe orders are
  // always international + USD, and total_amount is stored in USD cents
  // (per Phase 3 design), so divide by 100 for display.
  if (order.customer_email) {
    try {
      const { sendOrderStatusEmail } = await import('@/lib/email')
      const totalForEmail = order.currency === 'USD'
        ? Math.round(order.total_amount) / 100
        : order.total_amount
      await sendOrderStatusEmail({
        to: order.customer_email,
        customerName: order.customer_name || '',
        orderNumber: order.order_number,
        status: 'paid',
        totalAmount: totalForEmail,
        currency: (order.currency as 'THB' | 'USD') || 'USD',
      })
    } catch (emailErr) {
      // Don't fail the webhook over a transient email error — the order
      // is already paid and the admin email path will fire from the
      // dashboard view. Stripe shouldn't retry on email failure.
      console.error('[stripe webhook] confirmation email failed:', emailErr)
    }
  }

  // NOTE: Loyalty point award is intentionally NOT done here. The
  // existing PromptPay confirm_payment flow does not award points
  // either; we'd otherwise create asymmetric reward behaviour between
  // Thai and international customers. Treat point-on-purchase as a
  // future cross-cutting feature for both payment paths.
}

// ── checkout.session.expired ──────────────────────────────────────────────
//
// Customer abandoned the Stripe Checkout page. Mark the order as
// cancelled and put the books back on the shelf. Conditional update
// guards against a race with the auto-cancel cron, which has the same
// `order_status='new'` filter — only the first writer flips and only
// that writer restores stock.
async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) {
    console.error('[stripe webhook] session.expired missing metadata.order_id', session.id)
    return
  }

  // Pull items in the same query so we have what we need to restore
  // stock if (and only if) the conditional UPDATE matches a row.
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_status, items:order_items(book_id, condition, quantity, title, price)')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) {
    console.error('[stripe webhook] session.expired could not load order', orderId, fetchErr)
    return
  }

  if (order.order_status !== 'new') {
    console.log('[stripe webhook] session.expired: order already in terminal state', orderId, order.order_status)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.items || []) as any[]
  const cancelledItemsJson = items.map(it => ({
    book_id: it.book_id,
    title: it.title,
    price: (Number(it.price) || 0) * (Number(it.quantity) || 1),
    reason: 'auto-cancelled: Stripe checkout session expired',
  }))

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      order_status: 'cancelled',
      cancelled_items: cancelledItemsJson,
    })
    .eq('id', orderId)
    .eq('order_status', 'new')
    .select('id')

  if (updateErr) {
    console.error('[stripe webhook] session.expired update failed:', updateErr)
    throw updateErr
  }

  if (!updated || updated.length === 0) {
    // Cron or manual admin action already cancelled this. Don't restore
    // stock — they would have done it.
    console.log('[stripe webhook] session.expired: order already cancelled by another writer', orderId)
    return
  }

  // We won the race → we own the stock restore. Build the restore
  // payload up-front so that if `restoreStock` throws, we can log
  // exactly what was supposed to be restored — making manual recovery
  // possible without trawling order_items.
  const restorePayload = items.map(it => ({
    book_id: it.book_id,
    condition: it.condition,
    quantity: it.quantity,
  }))
  try {
    const result = await restoreStock(supabaseAdmin, restorePayload)
    if (result.failures.length > 0) {
      console.error('[stripe webhook] session.expired stock restore partial failures:', {
        orderId,
        failures: result.failures,
      })
    }
  } catch (restoreErr) {
    console.error('[stripe webhook] session.expired restoreStock threw — manual recovery required:', {
      orderId,
      restorePayload,
      error: restoreErr instanceof Error ? restoreErr.message : String(restoreErr),
    })
  }
}

// ── charge.refunded ───────────────────────────────────────────────────────
//
// Admin (or Stripe Radar / dispute) issued a refund. Behaviour depends
// on whether the refund is full or partial:
//
//   • FULL refund (charge.amount_refunded >= charge.amount, equivalently
//     Stripe's charge.refunded === true): mark order_status='refunded',
//     restore stock — matches the existing manual `admin_cancel` flow
//     in /api/orders/[id]/route.ts which also restores on full cancel.
//     Send the customer an English-only refund-processed email.
//
//   • PARTIAL refund (charge.amount_refunded > 0 but < charge.amount):
//     do NOT mark the order as refunded (it's still partially fulfilled
//     financially) and do NOT restore stock automatically — partial
//     refunds happen for many reasons (price adjustment, courier
//     dispute, partial damage) and the inventory implication is
//     case-by-case. TODO: surface a flag in the admin view so Sasi can
//     decide per-order whether to also issue an admin_cancel.
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id || null

  if (!paymentIntentId) {
    console.error('[stripe webhook] charge.refunded missing payment_intent', charge.id)
    return
  }

  const isFullRefund = charge.amount_refunded >= charge.amount
  const refundedAmountCents = charge.amount_refunded
  const currencyCode = (charge.currency || 'usd').toUpperCase()

  if (!isFullRefund) {
    // Partial refund — log for admin awareness and move on. Do NOT
    // touch order_status (still partially paid, partially fulfilled)
    // and do NOT restore stock.
    console.log('[stripe webhook] charge.refunded: partial refund — not restoring stock or flipping status', {
      paymentIntentId,
      refundedCents: refundedAmountCents,
      totalCents: charge.amount,
      currency: currencyCode,
    })
    // TODO(admin): surface partial-refund state in the admin view so
    // a follow-up `admin_cancel` (with stock restore) can be done
    // manually if the partial refund corresponded to a returned book.
    return
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_status, order_number, customer_name, customer_email, items:order_items(book_id, condition, quantity, title, price)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (fetchErr || !order) {
    // Refund for an order we don't recognise — could be a manual Stripe
    // dashboard refund issued before stripe_payment_intent_id was
    // persisted, or a legacy test charge. Acknowledge and move on.
    console.error('[stripe webhook] charge.refunded: no order found for PI', paymentIntentId, fetchErr)
    return
  }

  if (order.order_status === 'refunded') {
    // Idempotent — duplicate delivery.
    return
  }

  // Build the restore payload up-front (parallel pattern to expired
  // handler) so a restoreStock failure can be diagnosed from the log.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.items || []) as any[]
  const restorePayload = items.map(it => ({
    book_id: it.book_id,
    condition: it.condition,
    quantity: it.quantity,
  }))

  // Conditional UPDATE — same idempotency pattern as the other
  // handlers. If another writer already flipped the row to 'refunded',
  // skip the email + stock restore.
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ order_status: 'refunded' })
    .eq('id', order.id)
    .neq('order_status', 'refunded')
    .select('id')

  if (updateErr) {
    console.error('[stripe webhook] charge.refunded update failed:', updateErr)
    throw updateErr
  }

  if (!updated || updated.length === 0) {
    return
  }

  // Restore stock for full refunds — matches existing admin_cancel flow.
  try {
    const result = await restoreStock(supabaseAdmin, restorePayload)
    if (result.failures.length > 0) {
      console.error('[stripe webhook] charge.refunded stock restore partial failures:', {
        orderId: order.id,
        failures: result.failures,
      })
    }
  } catch (restoreErr) {
    console.error('[stripe webhook] charge.refunded restoreStock threw — manual recovery required:', {
      orderId: order.id,
      restorePayload,
      error: restoreErr instanceof Error ? restoreErr.message : String(restoreErr),
    })
  }

  // Email the customer. Stripe charges are in the smallest currency
  // unit (cents for USD), so divide by 100 for display.
  if (order.customer_email) {
    try {
      const { sendOrderStatusEmail } = await import('@/lib/email')
      await sendOrderStatusEmail({
        to: order.customer_email,
        customerName: order.customer_name || '',
        orderNumber: order.order_number,
        status: 'refunded',
        totalAmount: Math.round(refundedAmountCents) / 100,
        currency: currencyCode === 'USD' ? 'USD' : 'THB',
      })
    } catch (emailErr) {
      console.error('[stripe webhook] refund email failed:', emailErr)
    }
  }
}
