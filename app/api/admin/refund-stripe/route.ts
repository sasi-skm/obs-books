import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

// Issues a Stripe refund (full or partial) for a Stripe order. The
// route only kicks off the refund — the Phase 4 webhook
// (handleChargeRefunded) handles all consequences:
//   • FULL refund (charge.amount_refunded >= charge.amount):
//       order_status='refunded', restoreStock, refund email
//   • PARTIAL refund: log only, no DB changes
//
// Admin auth uses the existing requireAdmin helper. Refund metadata
// captures who issued it for audit trail.

const VALID_REASONS = ['duplicate', 'fraudulent', 'requested_by_customer'] as const
type StripeRefundReason = typeof VALID_REASONS[number]

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { order_id?: string; amount_cents?: number; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { order_id, amount_cents, reason } = body
  if (!order_id) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, payment_method, stripe_payment_intent_id, total_amount, order_status, currency')
    .eq('id', order_id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.payment_method !== 'stripe' || !order.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: 'Order is not a Stripe order or has no payment intent' },
      { status: 400 },
    )
  }
  if (order.order_status === 'refunded') {
    return NextResponse.json({ error: 'Order is already refunded' }, { status: 400 })
  }

  // Validate amount when provided. Omitting it defers to Stripe (full refund).
  if (typeof amount_cents === 'number') {
    if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
      return NextResponse.json(
        { error: 'amount_cents must be a positive integer' },
        { status: 400 },
      )
    }
    if (amount_cents > order.total_amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed the original charge' },
        { status: 400 },
      )
    }
  }

  const stripeReason: StripeRefundReason | undefined = (
    typeof reason === 'string' && (VALID_REASONS as readonly string[]).includes(reason)
  )
    ? (reason as StripeRefundReason)
    : undefined

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      ...(typeof amount_cents === 'number' ? { amount: amount_cents } : {}),
      ...(stripeReason ? { reason: stripeReason } : {}),
      metadata: {
        admin_email: admin.email || '',
        order_id: order.id,
        order_number: order.order_number,
      },
    })
    return NextResponse.json({
      ok: true,
      refund_id: refund.id,
      amount_refunded: refund.amount,
      status: refund.status,
    })
  } catch (err) {
    console.error('[refund-stripe] stripe.refunds.create failed:', err)
    const message = err instanceof Error ? err.message : 'Refund failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
