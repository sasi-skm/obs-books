import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code, email, order_total } = await req.json()

    if (!code || !email || !order_total) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // Find voucher
    const { data: voucher, error: vErr } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .single()

    if (vErr || !voucher) {
      return NextResponse.json({ error: 'Invalid or expired voucher code' }, { status: 400 })
    }

    // Check minimum order
    if (order_total < voucher.minimum_order) {
      return NextResponse.json({
        error: `Minimum order ฿${voucher.minimum_order.toLocaleString()} required`,
      }, { status: 400 })
    }

    // Check first order only
    if (voucher.first_order_only) {
      const { data: prevOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('customer_email', email)
        .neq('order_status', 'cancelled')
        .limit(1)

      if (prevOrders && prevOrders.length > 0) {
        return NextResponse.json({ error: 'This voucher is for first orders only' }, { status: 400 })
      }
    }

    // Check email already used this voucher
    const { data: used } = await supabaseAdmin
      .from('voucher_uses')
      .select('id')
      .eq('voucher_id', voucher.id)
      .eq('email', email)
      .limit(1)

    if (used && used.length > 0) {
      return NextResponse.json({ error: 'This voucher has already been used with this email' }, { status: 400 })
    }

    const discount = Math.floor(order_total * voucher.discount_percent / 100)

    return NextResponse.json({
      valid: true,
      voucher_id: voucher.id,
      discount_percent: voucher.discount_percent,
      discount_amount: discount,
      message: `${voucher.discount_percent}% off applied — save ฿${discount.toLocaleString()}`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to validate voucher' }, { status: 500 })
  }
}
