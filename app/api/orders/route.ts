import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, customer_email, shipping_address, payment_method, note, items, total_amount, slip_url, destination_country, currency, user_id, redeem_points, voucher_id, voucher_email, subscriber_discount_applied, subscriber_discount_amount } = body

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
            user_id: user_id || null,
            subscriber_discount_applied: subscriber_discount_applied || false,
            subscriber_discount_amount: subscriber_discount_amount || 0,
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map((item: { book_id: string; title: string; author: string; price: number; image_url?: string; condition?: string; quantity?: number }) => ({
          order_id: order.id,
          book_id: item.book_id,
          title: item.title,
          author: item.author,
          price: item.price,
          image_url: item.image_url,
          condition: item.condition || null,
          quantity: item.quantity || 1,
        }))

        await supabaseAdmin.from('order_items').insert(orderItems)

        // Decrement book copies (per condition if available, repeat for quantity)
        for (const item of items) {
          const qty = item.quantity || 1
          for (let q = 0; q < qty; q++) {
            await supabaseAdmin.rpc('decrement_book_copies', {
              book_id_param: item.book_id,
              condition_param: item.condition || null,
            })
          }
        }

        // Record voucher use
        if (voucher_id && voucher_email) {
          try {
            await supabaseAdmin.from('voucher_uses').insert({
              voucher_id,
              email: voucher_email,
              order_id: order.id,
            })
          } catch (vErr) {
            console.error('Voucher recording error:', vErr)
          }
        }

        // Handle points redemption
        if (redeem_points && user_id) {
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('points_balance')
              .eq('id', user_id)
              .single()

            if (profile && profile.points_balance >= 100) {
              await supabaseAdmin
                .from('profiles')
                .update({ points_balance: profile.points_balance - 100 })
                .eq('id', user_id)

              await supabaseAdmin.from('points_transactions').insert({
                user_id,
                points: -100,
                type: 'redeemed',
                reference_id: order.id,
                book_title: null,
              })
            }
          } catch (pointsErr) {
            console.error('Points redemption error:', pointsErr)
          }
        }

        // Send emails (non-blocking)
        try {
          const { sendAdminNewOrderEmail, sendOrderConfirmationEmail } = await import('@/lib/email')
          await Promise.allSettled([
            sendAdminNewOrderEmail({
              orderNumber,
              customerName: customer_name,
              customerPhone: customer_phone,
              customerEmail: customer_email,
              totalAmount: total_amount,
              paymentMethod: payment_method,
              items: items.map((i: { title: string; price: number; quantity?: number; condition?: string }) => ({
                title: i.title,
                price: i.price,
                quantity: i.quantity || 1,
                condition: i.condition,
              })),
            }),
            customer_email
              ? sendOrderConfirmationEmail({
                  to: customer_email,
                  customerName: customer_name,
                  orderNumber,
                  items: items.map((i: { title: string; price: number; quantity?: number; condition?: string }) => ({
                    title: i.title,
                    price: i.price,
                    quantity: i.quantity || 1,
                    condition: i.condition,
                  })),
                  totalAmount: total_amount,
                  paymentMethod: payment_method,
                  shippingAddress: shipping_address,
                })
              : Promise.resolve(),
          ])
        } catch (emailErr) {
          console.error('Email notification failed:', emailErr)
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

/**
 * Public order lookup for the /track page.
 *
 * Anyone with an order number can call this — no auth. That's by design
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
      // client — the response below is still the non-PII subset.
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

      // Explicit pick of safe fields — defense in depth. No PII ever
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
