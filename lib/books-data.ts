import { cache } from 'react'
import { Book } from '@/types'

/**
 * Storefront data layer — resilient to Supabase cold starts and outages.
 *
 * Design:
 * - Module-level memo caches the last successful fetch for CACHE_TTL_MS.
 * - Stale-while-error: if a fresh fetch fails, we serve the last good result.
 * - We NEVER cache empty or failed results (that was the bug causing
 *   "We'll be right back" outages to stick for 60s after Supabase recovered).
 * - Concurrent fetches are deduplicated by a module-level in-flight promise.
 * - React cache() wraps the public getters so one render pass = one call.
 * - Errors are console.error'd so Vercel logs show what's actually happening.
 *
 * Lives in memory per Vercel lambda instance. That's fine: a cold instance
 * does one real Supabase query (which we give ~8s, well within the Hobby
 * plan's 10s SSR function budget) and then serves every visitor for a minute.
 */

const CACHE_TTL_MS = 60_000
const SUPABASE_TIMEOUT_MS = 8_000

// ── Types & helpers ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  at: number
  value: T
}

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

/**
 * Race a promise against a timeout. Unlike the old implementation, this
 * REJECTS on timeout so failure flows through the try/catch properly instead
 * of silently returning null (which used to get cached as an empty success).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      value => { clearTimeout(timer); resolve(value) },
      err => { clearTimeout(timer); reject(err) },
    )
  })
}

// ── Listing fields ───────────────────────────────────────────────────────────
// Only pull what the listing pages actually need. Excludes `images` (potentially
// huge array), `description*`, and `video_url` to keep payloads small.
const LISTING_FIELDS = [
  'id', 'title', 'author', 'price', 'category', 'condition',
  'copies', 'status', 'image_url', 'featured', 'created_at', 'updated_at',
  'weight_grams', 'condition_prices', 'condition_copies',
  'product_type', 'dimensions_width', 'dimensions_length', 'material', 'technique', 'era',
].join(',')

// ── Books listing ────────────────────────────────────────────────────────────

let booksCache: CacheEntry<Book[]> | null = null
let booksInFlight: Promise<Book[]> | null = null

async function fetchBooksFromSupabase(): Promise<Book[]> {
  if (!isSupabaseConfigured()) return []

  const { supabase } = await import('./supabase')
  if (!supabase) return []

  const query = supabase
    .from('books')
    .select(LISTING_FIELDS)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  // Supabase query builders are thenable, so they can be awaited directly.
  const result = await withTimeout(
    query as unknown as Promise<{ data: unknown; error: unknown }>,
    SUPABASE_TIMEOUT_MS,
    'Supabase books listing',
  )

  if (result.error) {
    throw new Error(`Supabase returned error: ${JSON.stringify(result.error)}`)
  }
  const data = (result.data || []) as Book[]
  return data
}

async function getBooksResilient(): Promise<Book[]> {
  // 1. Fresh cache hit → serve immediately.
  if (booksCache && Date.now() - booksCache.at < CACHE_TTL_MS) {
    return booksCache.value
  }

  // 2. Dedupe concurrent fetches.
  if (booksInFlight) return booksInFlight

  booksInFlight = (async () => {
    try {
      const books = await fetchBooksFromSupabase()
      // Only cache non-empty successful results. An empty array is treated as
      // a soft-failure (maybe RLS or maybe the DB really is empty — either way,
      // don't poison the cache with it).
      if (books.length > 0) {
        booksCache = { at: Date.now(), value: books }
      }
      return books
    } catch (err) {
      console.error('[books-data] fetchBooksFromSupabase failed:', err)
      // Stale-while-error: serve last known good result if we have one.
      if (booksCache) {
        console.warn('[books-data] serving stale books cache from', new Date(booksCache.at).toISOString())
        return booksCache.value
      }
      return []
    } finally {
      booksInFlight = null
    }
  })()

  return booksInFlight
}

/**
 * Dedupes getBooks() calls within a single render pass across all components
 * that import it. Combined with the module-level memo above, that means
 * at most one Supabase hit per CACHE_TTL_MS per lambda instance.
 */
export const getBooks = cache(async (): Promise<Book[]> => {
  return getBooksResilient()
})

// ── Single book ──────────────────────────────────────────────────────────────

const bookByIdCache = new Map<string, CacheEntry<Book>>()
const bookByIdInFlight = new Map<string, Promise<Book | null>>()

async function fetchBookByIdFromSupabase(id: string): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null

  const { supabase } = await import('./supabase')
  if (!supabase) return null

  const query = supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('status', 'available')
    .single()

  const result = await withTimeout(
    query as unknown as Promise<{ data: unknown; error: unknown }>,
    SUPABASE_TIMEOUT_MS,
    `Supabase book ${id}`,
  )

  if (result.error) {
    // PGRST116 = no rows found, which is legitimate (product is sold / deleted)
    const err = result.error as { code?: string }
    if (err && err.code === 'PGRST116') return null
    throw new Error(`Supabase returned error: ${JSON.stringify(result.error)}`)
  }
  return (result.data || null) as Book | null
}

async function getBookByIdResilient(id: string): Promise<Book | null> {
  const cached = bookByIdCache.get(id)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value
  }

  const existing = bookByIdInFlight.get(id)
  if (existing) return existing

  const promise = (async () => {
    try {
      const book = await fetchBookByIdFromSupabase(id)
      if (book) {
        bookByIdCache.set(id, { at: Date.now(), value: book })
      }
      return book
    } catch (err) {
      console.error(`[books-data] fetchBookById(${id}) failed:`, err)
      if (cached) {
        console.warn(`[books-data] serving stale book ${id} from cache`)
        return cached.value
      }
      return null
    } finally {
      bookByIdInFlight.delete(id)
    }
  })()

  bookByIdInFlight.set(id, promise)
  return promise
}

export const getBookById = cache(async (id: string): Promise<Book | null> => {
  return getBookByIdResilient(id)
})

// ── Derived getters ──────────────────────────────────────────────────────────

export async function getBooksByCategory(category: string): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.category === category)
}

export async function getFeaturedBooks(): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.featured)
}

// ── Cache invalidation ───────────────────────────────────────────────────────
// Called from /api/admin/revalidate after the owner creates/edits/deletes a
// book or linen, so the module-level memo doesn't keep serving stale data.

export function resetBooksCache(): void {
  booksCache = null
  bookByIdCache.clear()
  booksInFlight = null
  bookByIdInFlight.clear()
}
