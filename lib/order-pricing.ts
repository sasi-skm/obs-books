import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'

/**
 * Server-side order pricing, shared by /api/orders (writes the order)
 * and /api/orders/quote (tells the customer how much to transfer
 * BEFORE they open their bank app). Both must price identically or a
 * PromptPay customer transfers one number and Sasi records another -
 * that mismatch is a manual reconciliation for her every time.
 */

// Redeeming loyalty points costs 100 points and takes ฿50 off. Mirrors
// `pointsDiscount` in app/checkout/page.tsx.
export const POINTS_COST = 100
export const POINTS_DISCOUNT_THB = 50

export type IncomingItem = {
  book_id: string
  condition?: string | null
  quantity?: number
}

export type ServerLine = {
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
export async function getAuthedUser(): Promise<{ id: string; email: string | null } | null> {
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
export async function buildServerLines(
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
    console.error('[order-pricing] book fetch failed:', error)
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
 * to *display*. The real decision happens against the server's own
 * subtotal, at the moment the order is written (and, via /api/orders/quote,
 * at the moment the customer is told what to transfer).
 */
export async function resolveVoucherDiscount(
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

/**
 * Read-only points eligibility: signed in AND balance covers the cost.
 * Used by the quote endpoint. The order route does NOT use this - it
 * deducts atomically (compare-and-swap) and only grants the discount
 * when the deduction actually landed.
 */
export async function pointsEligible(
  supabaseAdmin: SupabaseClient,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('points_balance')
    .eq('id', userId)
    .single()
  return Boolean(profile && profile.points_balance >= POINTS_COST)
}
