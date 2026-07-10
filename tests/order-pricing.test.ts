import { describe, it, expect } from 'vitest'
import {
  buildServerLines,
  resolveVoucherDiscount,
  pointsEligible,
  POINTS_COST,
} from '@/lib/order-pricing'
import { fakeSupabase } from './fake-supabase'

// The first tests in this repo, aimed where the money is: the pricing
// that /api/orders writes and /api/orders/quote shows a PromptPay
// customer before they transfer. An unauthenticated order-forgery
// endpoint reached production because none of this was tested.

const BOOK = {
  id: 'b1',
  title: 'The Illustrated Herbal',
  author: 'Philippa Back',
  price: 650,
  condition_prices: { 'very good': 700, good: 550 },
  condition_copies: { 'very good': 1, good: 2 },
  copies: 3,
  status: 'available',
  weight_grams: 420,
  image_url: 'https://x/y.jpg',
}

describe('buildServerLines', () => {
  it('prices from the database, never the client', async () => {
    const db = fakeSupabase({ books: [BOOK] })
    const res = await buildServerLines(db, [
      // a hostile client claiming a 1 baht price sends only ids anyway
      { book_id: 'b1', condition: null, quantity: 2 },
    ])
    expect('lines' in res && res.lines[0].price).toBe(650)
    expect('lines' in res && res.lines[0].weight_grams).toBe(420)
  })

  it('applies per-condition price overrides', async () => {
    const db = fakeSupabase({ books: [BOOK] })
    const res = await buildServerLines(db, [
      { book_id: 'b1', condition: 'very good', quantity: 1 },
    ])
    expect('lines' in res && res.lines[0].price).toBe(700)
  })

  it('rejects unknown books', async () => {
    const db = fakeSupabase({ books: [BOOK] })
    const res = await buildServerLines(db, [{ book_id: 'nope', quantity: 1 }])
    expect('error' in res && res.status).toBe(400)
  })

  it('rejects unavailable books with 409', async () => {
    const db = fakeSupabase({ books: [{ ...BOOK, status: 'sold' }] })
    const res = await buildServerLines(db, [{ book_id: 'b1', quantity: 1 }])
    expect('error' in res && res.status).toBe(409)
  })

  it('rejects orders beyond per-condition stock', async () => {
    const db = fakeSupabase({ books: [BOOK] })
    const res = await buildServerLines(db, [
      { book_id: 'b1', condition: 'very good', quantity: 2 }, // only 1 copy
    ])
    expect('error' in res && res.status).toBe(409)
  })

  it('floors and clamps hostile quantities', async () => {
    const db = fakeSupabase({ books: [BOOK] })
    const res = await buildServerLines(db, [
      { book_id: 'b1', condition: null, quantity: -5 },
    ])
    expect('lines' in res && res.lines[0].quantity).toBe(1)
  })
})

const VOUCHER = {
  id: 'v1',
  discount_percent: 10,
  minimum_order: 500,
  first_order_only: false,
  active: true,
}

describe('resolveVoucherDiscount', () => {
  it('grants floor(subtotal * percent / 100) for a valid voucher', async () => {
    const db = fakeSupabase({ vouchers: [VOUCHER], orders: [], voucher_uses: [] })
    const res = await resolveVoucherDiscount(db, 'v1', 'a@b.c', 655)
    expect(res).toEqual({ discount: 65, voucherId: 'v1' }) // floor(65.5)
  })

  it('grants nothing without a voucher id or email', async () => {
    const db = fakeSupabase({ vouchers: [VOUCHER] })
    expect(await resolveVoucherDiscount(db, null, 'a@b.c', 1000)).toEqual({ discount: 0, voucherId: null })
    expect(await resolveVoucherDiscount(db, 'v1', null, 1000)).toEqual({ discount: 0, voucherId: null })
  })

  it('rejects inactive vouchers', async () => {
    const db = fakeSupabase({ vouchers: [{ ...VOUCHER, active: false }], orders: [], voucher_uses: [] })
    expect((await resolveVoucherDiscount(db, 'v1', 'a@b.c', 1000)).discount).toBe(0)
  })

  it('rejects below the minimum order', async () => {
    const db = fakeSupabase({ vouchers: [VOUCHER], orders: [], voucher_uses: [] })
    expect((await resolveVoucherDiscount(db, 'v1', 'a@b.c', 499)).discount).toBe(0)
  })

  it('rejects first-order-only vouchers for returning customers', async () => {
    const db = fakeSupabase({
      vouchers: [{ ...VOUCHER, first_order_only: true }],
      orders: [{ id: 'o1', customer_email: 'a@b.c', order_status: 'new' }],
      voucher_uses: [],
    })
    expect((await resolveVoucherDiscount(db, 'v1', 'a@b.c', 1000)).discount).toBe(0)
  })

  it('ignores cancelled orders for the first-order check', async () => {
    const db = fakeSupabase({
      vouchers: [{ ...VOUCHER, first_order_only: true }],
      orders: [{ id: 'o1', customer_email: 'a@b.c', order_status: 'cancelled' }],
      voucher_uses: [],
    })
    expect((await resolveVoucherDiscount(db, 'v1', 'a@b.c', 1000)).discount).toBe(100)
  })

  it('rejects a voucher the email already used', async () => {
    const db = fakeSupabase({
      vouchers: [VOUCHER],
      orders: [],
      voucher_uses: [{ id: 'u1', voucher_id: 'v1', email: 'a@b.c' }],
    })
    expect((await resolveVoucherDiscount(db, 'v1', 'a@b.c', 1000)).discount).toBe(0)
  })
})

describe('pointsEligible', () => {
  it('requires a signed-in user', async () => {
    const db = fakeSupabase({ profiles: [{ id: 'u1', points_balance: 500 }] })
    expect(await pointsEligible(db, null)).toBe(false)
  })

  it('requires the balance to cover the cost', async () => {
    const db = fakeSupabase({
      profiles: [
        { id: 'rich', points_balance: POINTS_COST },
        { id: 'poor', points_balance: POINTS_COST - 1 },
      ],
    })
    expect(await pointsEligible(db, 'rich')).toBe(true)
    expect(await pointsEligible(db, 'poor')).toBe(false)
  })
})
