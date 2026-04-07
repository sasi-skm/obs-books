import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json()

  if (body.action === 'upload_slip') {
    const { slip_url } = body
    if (!slip_url) return NextResponse.json({ error: 'Missing slip_url' }, { status: 400 })

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total_amount, payment_status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ slip_url, payment_status: 'uploaded' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify admin by email
    try {
      const { sendAdminSlipUploadedEmail } = await import('@/lib/email')
      await sendAdminSlipUploadedEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        totalAmount: order.total_amount,
        slipUrl: slip_url,
      })
    } catch {}

    return NextResponse.json({ success: true })
  }

  if (body.action === 'confirm_payment') {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total_amount')
      .eq('id', id)
      .single()

    if (fetchError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'confirmed', order_status: 'paid' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (order.customer_email) {
      try {
        const { sendOrderStatusEmail } = await import('@/lib/email')
        await sendOrderStatusEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          status: 'paid',
          totalAmount: order.total_amount,
        })
      } catch {}
    }

    return NextResponse.json({ success: true })
  }

  if (body.action === 'ship') {
    const { tracking_number, courier } = body
    if (!tracking_number) return NextResponse.json({ error: 'Missing tracking_number' }, { status: 400 })

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total_amount')
      .eq('id', id)
      .single()

    if (fetchError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: 'shipped', tracking_number, courier })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (order.customer_email) {
      try {
        const { sendOrderStatusEmail } = await import('@/lib/email')
        await sendOrderStatusEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          status: 'shipped',
          trackingNumber: tracking_number,
          courier,
          totalAmount: order.total_amount,
        })
      } catch {}
    }

    return NextResponse.json({ success: true })
  }

  if (body.action === 'cancel') {
    // Only allow cancelling orders that are new + pending payment
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_status, payment_status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.order_status !== 'new' || order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: 'cancelled' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
