import { NextRequest, NextResponse } from 'next/server'

/**
 * Minimal public order lookup for the /slip-upload/[orderNumber] page.
 *
 * Returns ONLY the fields needed to render the slip-upload confirmation
 * screen (order_number, total_amount, payment_method, payment_status).
 * Explicitly does NOT return customer name, phone, shipping address, or
 * items — order numbers are mildly predictable so we minimize what's
 * exposed to anyone who guesses one.
 */

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')
  if (!orderNumber) {
    return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // Pull the richer shape we need to lazy-expire if it's stale. We
    // still only return the safe public subset to the caller.
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, total_amount, payment_method, payment_status, currency, created_at, order_status, items:order_items(id, book_id, title, price, condition, quantity)')
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Lazy-expire: if the order is past the 24h unpaid window, cancel it
    // now so the customer sees the real state instead of a stale pending.
    let cancelled = false
    if (data.payment_status === 'pending' && data.order_status === 'new') {
      const { maybeExpireOrder } = await import('@/lib/expire-order')
      cancelled = await maybeExpireOrder(supabaseAdmin, data)
    }

    return NextResponse.json({
      order_number: data.order_number,
      total_amount: data.total_amount,
      payment_method: data.payment_method,
      payment_status: cancelled ? 'pending' : data.payment_status,
      currency: data.currency,
      created_at: data.created_at,
      order_status: cancelled ? 'cancelled' : data.order_status,
    })
  } catch (err) {
    console.error('[api/orders/lookup] failed:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
