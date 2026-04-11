/**
 * Local order history — the safety net for guest checkouts.
 *
 * Every time an order is placed in a browser (guest or logged-in), we
 * stash the bare minimum needed to re-find it on the /track page:
 *   { orderNumber, totalAmount, currency, placedAt }
 *
 * This is per-device, per-browser. It's the answer for the guest who
 * checked out without an email and then closed the tab — they can return
 * on the same device, open /track, and see their order in the "Your
 * Recent Orders" list, one click to load status.
 *
 * Logged-in customers also benefit: on a device they use often, /track
 * shows their recent orders without them needing to dig through the
 * Account page.
 *
 * No PII is stored here — only the order reference and total so the UI
 * can render a useful label. Anyone with the order number can already
 * look it up publicly via /api/orders (which we're locking down to
 * non-PII fields in the same patch).
 */

export interface RecentOrder {
  orderNumber: string
  totalAmount: number
  currency?: 'THB' | 'USD'
  placedAt: number
}

const STORAGE_KEY = 'obs-recent-orders'
const MAX_ENTRIES = 10
const TTL_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

function readAll(): RecentOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    return parsed.filter(
      (o): o is RecentOrder =>
        typeof o === 'object' &&
        o !== null &&
        typeof o.orderNumber === 'string' &&
        typeof o.totalAmount === 'number' &&
        typeof o.placedAt === 'number' &&
        now - o.placedAt < TTL_MS,
    )
  } catch {
    return []
  }
}

function writeAll(orders: RecentOrder[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_ENTRIES)))
  } catch {
    // Quota exceeded or disabled — ignore
  }
}

/**
 * Remember a newly-placed order. Deduplicates by order number (last-write
 * wins, in case the customer somehow re-submits). Most recent first.
 */
export function addRecentOrder(order: RecentOrder): void {
  const all = readAll().filter(o => o.orderNumber !== order.orderNumber)
  all.unshift(order)
  writeAll(all)
}

/**
 * Return the caller's recent orders, most recent first, expired entries
 * already filtered out. Safe to call during SSR (returns []).
 */
export function getRecentOrders(): RecentOrder[] {
  return readAll().sort((a, b) => b.placedAt - a.placedAt)
}

/**
 * Forget a specific order (e.g. after the customer clicks "remove" on
 * the /track list). Does NOT touch the order on the server.
 */
export function removeRecentOrder(orderNumber: string): void {
  writeAll(readAll().filter(o => o.orderNumber !== orderNumber))
}

export function clearRecentOrders(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
