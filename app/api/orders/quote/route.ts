import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import {
  getAuthedUser,
  buildServerLines,
  resolveVoucherDiscount,
  pointsEligible,
  POINTS_DISCOUNT_THB,
  type IncomingItem,
} from '@/lib/order-pricing'

/**
 * Authoritative pre-payment quote for the manual payment methods.
 *
 * A PromptPay / bank-transfer customer transfers money BEFORE the
 * order exists: they read an amount off the payment step and type it
 * into their bank app. That amount used to be computed in the browser,
 * so a stale voucher or points state meant they transferred one number
 * and /api/orders recorded another - manual reconciliation for Sasi.
 *
 * This endpoint runs the exact pricing the order write will run
 * (shared lib/order-pricing.ts), with no side effects: nothing is
 * written, no stock moves, no points are spent. The checkout page
 * shows THIS number next to the QR code.
 *
 * The result is a quote, not a reservation - a voucher can still die
 * in the seconds between quote and order. /api/orders closes that
 * last gap by comparing the recorded total against expected_total and
 * flagging the mismatch to both the customer and Sasi.
 */
export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { id: 'orders-quote', limit: 20, windowMs: 60000 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await req.json()
    const { items, voucher_id, customer_email, redeem_points } = body as {
      items?: IncomingItem[]
      voucher_id?: string | null
      customer_email?: string
      redeem_points?: boolean
    }

    if (!items?.length) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    }

    const supabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
    if (!supabaseConfigured) {
      return NextResponse.json({ error: 'Pricing unavailable' }, { status: 503 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    const built = await buildServerLines(supabaseAdmin, items)
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }

    const subtotal = built.lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

    const authedUser = await getAuthedUser()
    const voucherEmail = customer_email || authedUser?.email || null
    const { discount: voucherDiscount } = await resolveVoucherDiscount(
      supabaseAdmin,
      voucher_id ?? null,
      voucherEmail,
      subtotal,
    )

    const pointsDiscount =
      redeem_points && (await pointsEligible(supabaseAdmin, authedUser?.id ?? null))
        ? POINTS_DISCOUNT_THB
        : 0

    const total = Math.max(0, subtotal - voucherDiscount - pointsDiscount)

    return NextResponse.json({
      subtotal,
      voucher_discount: voucherDiscount,
      points_discount: pointsDiscount,
      total,
      currency: 'THB',
    })
  } catch (err) {
    console.error('[api/orders/quote] failed:', err)
    return NextResponse.json({ error: 'Could not compute total' }, { status: 500 })
  }
}
