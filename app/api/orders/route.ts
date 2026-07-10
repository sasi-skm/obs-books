import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'

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
 */

// The customer picks a payment method here; card orders go through the
// Stripe route instead and must never be created by this endpoint.
const ALLOWED_PAYMENT_METHODS = new Set(['promptpay', 'transfer'])
const ALLOWED_CURRENCIES = new Set(['THB', 'USD'])

// Redeeming loyalty points costs 100 points and takes ฿50 off. Mirrors
// `pointsDiscount` in app/checkout/page.tsx.
const POINTS_COST = 100
const POINTS_DISCOUNT_THB = 50

type IncomingItem = {
  book_id: string
  condition?: string | null
  quantity?: number
}

type ServerLine = {
  book_id: string
  title: string
  author: string
  image_url: string | null
  condition: string | null
  quantity: number
  price: number
  weight_grams: number
}

/**
 * Who is actually making this request? Read the Supabase session from
 * the request cookies rather than believing `user_id` in the body -
 * otherwise anyone can spend anyone else's loyalty points.
 * Returns null for guests, which is a supported checkout path.
 */
async function getAuthedUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          // Route handler: we only read the session, never refresh it.
          setAll: () => {},
        },
      },
    )
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email ?? null }
  } catch {
    return null
  }
}

/**
 * Rebuild the cart from the DB. Client sends only book_id, condition
 * and quantity; price/title/author/image come from the books table.
 * Also enforces availability so a sold-out book can't be ordered (and
 * its stock driven negative) by a hand-crafted request.
 */
async function buildServerLines(
  supabaseAdmin: SupabaseClient,
  items: IncomingItem[],
): Promise<{ lines: ServerLine[] } | { error: string; status: number }> {
  const bookIds = Array.from(new Set(items.map(i => i.book_id).filter(Boolean)))
  if (bookIds.length === 0) return { error: 'No valid book ids in cart', status: 400 }

  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, title, author, price, condition_prices, condition_copies, copies, status, weight_grams, image_url')
    .in('id', bookIds)

  if (error || !books) {
    console.error('[api/orders] book fetch failed:', error)
    return { error: 'Could not load cart books', status: 500 }
  }

  const booksById = new Map(books.map(b => [b.id, b]))
  const lines: ServerLine[] = []

  for (const item of items) {
    const book = booksById.get(item.book_id)
    if (!book) return { error: `Book not found: ${item.book_id}`, status: 400 }
    if (book.status !== 'available') {
      return { error: `"${book.title}" is no longer available`, status: 409 }
    }

    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
    const condition = item.condition || null

    // Per-condition pricing overrides the base price, same as the
    // storefront and the Stripe route.
    let price = Number(book.price) || 0
    if (condition && book.condition_prices && typeof book.condition_prices === 'object') {
      const cp = (book.condition_prices as Record<string, number>)[condition]
      if (typeof cp === 'number' && cp > 0) price = cp
    }
    if (price <= 0) return { error: `Invalid price for "${book.title}"`, status: 500 }

    let available = Number(book.copies) || 0
    if (condition && book.condition_copies && typeof book.condition_copies === 'object') {
      const cc = (book.condition_copies as Record<string, number>)[condition]
      if (typeof cc === 'number') available = cc
    }
    if (available < qty) {
      return { error: `Only ${available} copy/copies of "${book.title}" left`, status: 409 }
    }

    lines.push({
      book_id: book.id,
      title: book.title,
      author: book.author,
      image_url: book.image_url ?? null,
      condition,
      quantity: qty,
      price,
      weight_grams: Number(book.weight_grams) || DEFAULT_BOOK_WEIGHT,
    })
  }

  return { lines }
}

/**
 * Re-run the same checks /api/vouchers ran when the customer applied the
 * code. That endpoint is advisory - it tells the browser what discount
 * to *display*. The real decision happens here, against the server's own
 * subtotal, at the moment the order is written.
 */
async function resolveVoucherDiscount(
  supabaseAdmin: SupabaseClient,
  voucherId: string | null,
  email: string | null,
  subtotal: number,
): Promise<{ discount: number; voucherId: string | null }> {
  if (!voucherId || !email) return { discount: 0, voucherId: null }

  const { data: voucher } = await supabaseAdmin
    .from('vouchers')
    .select('id, discount_percent, minimum_order, first_order_only, active')
    .eq('id', voucherId)
    .eq('active', true)
    .single()

  if (!voucher) return { discount: 0, voucherId: null }
  if (subtotal < Number(voucher.minimum_order || 0)) return { discount: 0, voucherId: null }

  if (voucher.first_order_only) {
    const { data: prev } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('customer_email', email)
      .neq('order_status', 'cancelled')
      .limit(1)
    if (prev && prev.length > 0) return { discount: 0, voucherId: null }
  }

  const { data: used } = await supabaseAdmin
    .from('voucher_uses')
    .select('id')
    .eq('voucher_id', voucher.id)
    .eq('email', email)
    .limit(1)
  if (used && used.length > 0) return { discount: 0, voucherId: null }

  const discount = Math.floor((subtotal * Number(voucher.discount_percent)) / 100)
  return { discount, voucherId: voucher.id }
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

    // Try Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
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

        // Points are only spendable by the signed-in owner of the balance.
        let pointsDiscount = 0
        let pointsToRedeem = false
        if (redeem_points && userId) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('points_balance')
            .eq('id', userId)
            .single()
          if (profile && profile.points_balance >= POINTS_COST) {
            pointsDiscount = POINTS_DISCOUNT_THB
            pointsToRedeem = true
          }
        }

        const totalAmount = Math.max(0, subtotal - voucherDiscount - pointsDiscount)

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

        if (orderError) throw orderError

        // Create order items from the server-priced lines
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

        await supabaseAdmin.from('order_items').insert(orderItems)

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

        // Handle points redemption
        if (pointsToRedeem && userId) {
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('points_balance')
              .eq('id', userId)
              .single()

            if (profile && profile.points_balance >= POINTS_COST) {
              await supabaseAdmin
                .from('profiles')
                .update({ points_balance: profile.points_balance - POINTS_COST })
                .eq('id', userId)

              await supabaseAdmin.from('points_transactions').insert({
                user_id: userId,
                points: -POINTS_COST,
                type: 'redeemed',
                reference_id: order.id,
                book_title: null,
              })
            }
          } catch (pointsErr) {
            console.error('Points redemption error:', pointsErr)
          }
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

        return NextResponse.json({ order_number: orderNumber, id: order.id, total_amount: totalAmount })
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
