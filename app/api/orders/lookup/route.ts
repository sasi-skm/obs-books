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
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, total_amount, payment_method, payment_status, currency, created_at, order_status')
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/orders/lookup] failed:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
