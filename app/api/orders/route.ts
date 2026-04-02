import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, customer_email, shipping_address, payment_method, note, items, total_amount, slip_url, destination_country, currency } = body

    if (!customer_name || !customer_phone || !shipping_address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const orderNumber = 'OBS-' + Date.now().toString(36).toUpperCase()

    // Try Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase-server')

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_name,
            customer_phone,
            customer_email: customer_email || null,
            shipping_address,
            payment_method,
            note: note || null,
            total_amount,
            slip_url: slip_url || null,
            destination_country: destination_country || 'TH',
            currency: currency || 'THB',
            payment_status: slip_url ? 'uploaded' : 'pending',
            order_status: 'new',
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map((item: { book_id: string; title: string; author: string; price: number; image_url?: string }) => ({
          order_id: order.id,
          book_id: item.book_id,
          title: item.title,
          author: item.author,
          price: item.price,
          image_url: item.image_url,
        }))

        await supabaseAdmin.from('order_items').insert(orderItems)

        // Decrement book copies
        for (const item of items) {
          await supabaseAdmin.rpc('decrement_book_copies', { book_id_param: item.book_id })
        }

        // Send Telegram notification (non-blocking)
        try {
          const { sendTelegramOrderNotification } = await import('@/lib/telegram')
          await sendTelegramOrderNotification({
            order_number: orderNumber,
            customer_name,
            customer_phone,
            shipping_address,
            total_amount,
            items: items.map((i: { title: string; price: number; condition?: string }) => ({
              title: i.title,
              price: i.price,
              condition: i.condition,
            })),
          })
        } catch (telegramErr) {
          console.error('Telegram notification failed:', telegramErr)
        }

        return NextResponse.json({ order_number: orderNumber, id: order.id })
      } catch (err) {
        console.error('Supabase order error:', err)
      }
    }

    // Fallback: return order number without persistence
    return NextResponse.json({ order_number: orderNumber })
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')
  if (!orderNumber) {
    return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('order_number', orderNumber)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json(order)
    } catch {}
  }

  return NextResponse.json({ error: 'Order not found' }, { status: 404 })
}
