import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { restoreStock } from '@/lib/restore-stock'
import {
  COUNTRY_ZONES,
  SUPPORTED_COUNTRIES,
  DEFAULT_BOOK_WEIGHT,
  getShippingRate,
  thbToUsd,
} from '@/lib/shipping'

type IncomingItem = {
  book_id: string
  quantity?: number
  condition?: string | null
}

type Body = {
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  shipping_address?: string
  destination_country?: string
  user_id?: string | null
  note?: string | null
  items?: IncomingItem[]
}

// Hold stock for at most 2h on an abandoned Stripe checkout. OBS sells
// 1-of-1 vintage books, so reserving inventory for the full 24h Stripe
// allows is too costly — 2h is enough for a customer to genuinely
// finish payment, and Stripe will fire `checkout.session.expired`
// well before our 24h auto-cancel cron sees the order.
const SESSION_TTL_SECONDS = 2 * 60 * 60

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const {
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      destination_country,
      user_id,
      note,
      items,
    } = body

    if (!customer_name || !customer_phone || !shipping_address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const country = (destination_country || '').toUpperCase()
    if (!country) {
      return NextResponse.json({ error: 'Missing destination country' }, { status: 400 })
    }
    // TH is allowed (domestic Stripe in THB). Other countries must be in
    // the DHL zone map; everything else is rejected before we hit Stripe.
    if (country !== 'TH' && COUNTRY_ZONES[country] === undefined) {
      return NextResponse.json({ error: `Unsupported destination country: ${country}` }, { status: 400 })
    }
    const isThbOrder = country === 'TH'

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Re-fetch every book from the DB. We do NOT trust client-supplied
    // prices here — Stripe will charge the customer the amount we hand
    // it, so the price calculation is a security boundary.
    const bookIds = Array.from(new Set(items.map(i => i.book_id).filter(Boolean)))
    if (bookIds.length === 0) {
      return NextResponse.json({ error: 'No valid book ids in cart' }, { status: 400 })
    }

    const { data: books, error: booksErr } = await supabaseAdmin
      .from('books')
      .select('id, title, author, price, condition_prices, condition_copies, copies, status, weight_grams, image_url')
      .in('id', bookIds)

    if (booksErr || !books) {
      console.error('[stripe checkout] book fetch failed:', booksErr)
      return NextResponse.json({ error: 'Could not load cart books' }, { status: 500 })
    }

    const booksById = new Map(books.map(b => [b.id, b]))

    // Validate each line, build a server-trusted line item list with
    // canonical per-condition prices and weights.
    const linesThb: Array<{
      book_id: string
      title: string
      author: string
      image_url?: string | null
      condition?: string | null
      quantity: number
      unit_price_thb: number
      weight_grams: number
    }> = []

    for (const item of items) {
      const book = booksById.get(item.book_id)
      if (!book) {
        return NextResponse.json({ error: `Book not found: ${item.book_id}` }, { status: 400 })
      }
      // No "draft / unpublished" flag exists on books — the equivalent
      // guard is status='available' (vs 'sold'). Block sold books from
      // getting into Stripe checkout.
      // No "draft / unpublished" flag exists on books — schema sweep
      // confirms the only visibility gate is status='available' (vs
      // 'sold'). See seed.sql + migrations 002–004 for the full books
      // column list. Block sold books from getting into Stripe checkout.
      if (book.status !== 'available') {
        return NextResponse.json(
          { error: `"${book.title}" is no longer available` },
          { status: 409 },
        )
      }

      const qty = Math.max(1, Math.floor(item.quantity || 1))

      // Per-condition pricing (matches the existing cart/storefront
      // behaviour: condition_prices overrides the base price when the
      // customer picked a specific copy).
      const condition = item.condition || null
      let unitThb = Number(book.price) || 0
      if (condition && book.condition_prices && typeof book.condition_prices === 'object') {
        const cp = (book.condition_prices as Record<string, number>)[condition]
        if (typeof cp === 'number' && cp > 0) unitThb = cp
      }
      if (unitThb <= 0) {
        return NextResponse.json({ error: `Invalid price for "${book.title}"` }, { status: 500 })
      }

      // Per-condition stock check when applicable.
      let availableForLine = Number(book.copies) || 0
      if (condition && book.condition_copies && typeof book.condition_copies === 'object') {
        const cc = (book.condition_copies as Record<string, number>)[condition]
        if (typeof cc === 'number') availableForLine = cc
      }
      if (availableForLine < qty) {
        return NextResponse.json(
          { error: `Only ${availableForLine} copy/copies of "${book.title}" left` },
          { status: 409 },
        )
      }

      linesThb.push({
        book_id: book.id,
        title: book.title,
        author: book.author,
        image_url: book.image_url,
        condition,
        quantity: qty,
        unit_price_thb: unitThb,
        weight_grams: Number(book.weight_grams) || DEFAULT_BOOK_WEIGHT,
      })
    }

    // Server-side totals.
    const subtotalThb = linesThb.reduce((s, l) => s + l.unit_price_thb * l.quantity, 0)
    const totalGrams = linesThb.reduce((s, l) => s + l.weight_grams * l.quantity, 0)

    // Branch on country. TH stays in THB (no DHL line, free domestic
    // shipping); everything else converts to USD and adds DHL.
    let totalAmountSmallestUnit: number
    let orderCurrency: 'THB' | 'USD'

    type StripeLineItem = NonNullable<Stripe.Checkout.SessionCreateParams['line_items']>[number]
    let stripeLineItems: StripeLineItem[]

    if (isThbOrder) {
      // THB satang. Stripe minimum is 1000 satang (฿10) — guarded by the
      // positivity check below since OBS books are well above that.
      if (subtotalThb <= 0) {
        return NextResponse.json({ error: 'Order total must be positive' }, { status: 400 })
      }
      totalAmountSmallestUnit = subtotalThb * 100
      orderCurrency = 'THB'

      stripeLineItems = linesThb.map(l => ({
        price_data: {
          currency: 'thb',
          unit_amount: l.unit_price_thb * 100, // baht → satang
          product_data: {
            name: l.condition ? `${l.title} (${l.condition})` : l.title,
            description: l.author ? `by ${l.author}` : undefined,
            images: l.image_url ? [l.image_url] : undefined,
            metadata: {
              book_id: l.book_id,
              condition: l.condition || '',
            },
          },
        },
        quantity: l.quantity,
      }))
      // No shipping line for TH — domestic free shipping convention.
    } else {
      // USD with DHL international shipping line.
      const shippingUsd = getShippingRate(country, totalGrams)
      if (shippingUsd === null) {
        return NextResponse.json({ error: 'No shipping rate for destination' }, { status: 400 })
      }
      const subtotalUsd = thbToUsd(subtotalThb)
      const grandTotalUsd = subtotalUsd + shippingUsd
      if (grandTotalUsd <= 0) {
        return NextResponse.json({ error: 'Order total must be positive' }, { status: 400 })
      }
      totalAmountSmallestUnit = Math.round(grandTotalUsd * 100)
      orderCurrency = 'USD'

      stripeLineItems = linesThb.map(l => {
        const unitUsdCents = Math.round(thbToUsd(l.unit_price_thb) * 100)
        return {
          price_data: {
            currency: 'usd',
            unit_amount: unitUsdCents,
            product_data: {
              name: l.condition ? `${l.title} (${l.condition})` : l.title,
              description: l.author ? `by ${l.author}` : undefined,
              images: l.image_url ? [l.image_url] : undefined,
              metadata: {
                book_id: l.book_id,
                condition: l.condition || '',
              },
            },
          },
          quantity: l.quantity,
        }
      })

      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(shippingUsd * 100),
          product_data: {
            name: 'International shipping (DHL Express)',
          },
        },
        quantity: 1,
      })
    }

    const orderNumber = 'OBS-' + Date.now().toString(36).toUpperCase()

    // 1. Insert the order. payment_status='pending' + order_status='new'
    //    matches existing PromptPay semantics; the payment_method='stripe'
    //    flag is what disambiguates downstream. The webhook (Phase 4)
    //    flips both to confirmed/paid on checkout.session.completed.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        shipping_address,
        payment_method: 'stripe',
        payment_status: 'pending',
        order_status: 'new',
        note: note || null,
        total_amount: totalAmountSmallestUnit,
        currency: orderCurrency,
        destination_country: country,
        user_id: user_id || null,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('[stripe checkout] order insert failed:', orderErr)
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    // 2. Order items, mirroring the existing /api/orders contract so the
    //    admin order view + email templates stay generic.
    const orderItemRows = linesThb.map(l => ({
      order_id: order.id,
      book_id: l.book_id,
      title: l.title,
      author: l.author,
      price: l.unit_price_thb, // store THB unit price for parity with existing items
      image_url: l.image_url ?? undefined,
      condition: l.condition,
      quantity: l.quantity,
    }))
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItemRows)
    if (itemsErr) {
      console.error('[stripe checkout] order_items insert failed:', itemsErr)
    }

    // 3. Decrement stock, mirroring /api/orders. Stock is reserved while
    //    the customer is in Stripe checkout; if they abandon, the
    //    Phase 4 `checkout.session.expired` webhook + the existing 24h
    //    cron will restore it.
    for (const l of linesThb) {
      for (let q = 0; q < l.quantity; q++) {
        await supabaseAdmin.rpc('decrement_book_copies', {
          book_id_param: l.book_id,
          condition_param: l.condition || null,
        })
      }
    }

    // 4. Build success/cancel URLs from the request origin. Falling back
    //    to NEXT_PUBLIC_SITE_URL keeps things working in environments
    //    where the origin header isn't reliable (e.g. some proxy setups).
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://www.obsbooks.com'

    // 5. allowed_countries for Stripe Address Element. TH orders restrict
    //    to Thailand only (matches our domestic shipping flow); everything
    //    else gets the non-TH supported list. Foreign-card-on-Thai-address
    //    is fine; Thai-card-with-international-shipping uses the
    //    international branch.
    type AllowedCountry = NonNullable<
      NonNullable<Stripe.Checkout.SessionCreateParams['shipping_address_collection']>['allowed_countries']
    >[number]
    const allowedCountries: AllowedCountry[] = isThbOrder
      ? (['TH'] as AllowedCountry[])
      : (SUPPORTED_COUNTRIES.map(c => c.code).filter(c => c !== 'TH') as AllowedCountry[])

    // 5. Create the Stripe session. If this throws we are left with an
    //    orphan order row + decremented stock that no customer will
    //    ever pay for — roll both back before surfacing the error so
    //    the next customer can buy the book.
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: stripeLineItems,
        shipping_address_collection: {
          allowed_countries: allowedCountries,
        },
        customer_email: customer_email || undefined,
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancelled?order_id=${order.id}`,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
        payment_intent_data: {
          metadata: {
            order_id: order.id,
            order_number: orderNumber,
          },
        },
        locale: 'auto',
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      })
    } catch (stripeErr) {
      console.error('[stripe checkout] session create failed — rolling back:', stripeErr)

      // Restore inventory using the same helper the auto-cancel cron
      // uses, so the unique vintage book becomes purchasable again.
      try {
        await restoreStock(
          supabaseAdmin,
          linesThb.map(l => ({
            book_id: l.book_id,
            condition: l.condition,
            quantity: l.quantity,
          })),
        )
      } catch (restoreErr) {
        console.error('[stripe checkout] rollback restoreStock threw:', restoreErr)
      }

      // Delete the order row. order_items is ON DELETE CASCADE
      // (seed.sql:46), so the line items disappear with it.
      try {
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
      } catch (deleteErr) {
        console.error('[stripe checkout] rollback order delete threw:', deleteErr)
      }

      return NextResponse.json(
        { error: 'Payment provider unavailable. Please try again in a moment.' },
        { status: 503 },
      )
    }

    // 6. Persist the session id immediately so the webhook lookup by
    //    metadata.order_id can be cross-checked, and so the admin can
    //    see the link to Stripe even before payment completes.
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({
      url: session.url,
      order_id: order.id,
      order_number: orderNumber,
    })
  } catch (err) {
    console.error('[stripe checkout] unexpected error:', err)
    return NextResponse.json({ error: 'Failed to create Stripe checkout session' }, { status: 500 })
  }
}
