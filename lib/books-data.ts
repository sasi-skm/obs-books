import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { Book } from '@/types'

const TIMEOUT = 3000 // 3s — fail fast for bulk queries when DB is slow/down
const timeout = (ms = TIMEOUT) => new Promise<null>((r) => setTimeout(() => r(null), ms))

const isSupabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

// Only select fields needed for listing pages (shop, home, category).
// Excludes: images (huge array), descriptions, video_url to keep payload small.
const LISTING_FIELDS = [
  'id', 'title', 'author', 'price', 'category', 'condition',
  'copies', 'status', 'image_url', 'featured', 'created_at', 'updated_at',
  'weight_grams', 'condition_prices', 'condition_copies',
  'product_type', 'dimensions_width', 'dimensions_length', 'material', 'technique', 'era',
].join(',')

// Fetches available books from Supabase with lightweight fields.
// unstable_cache persists this across requests for 60s (even on dynamic pages).
// React cache() deduplicates within a single render pass.
const fetchBooks = unstable_cache(
  async (): Promise<Book[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { supabase } = await import('./supabase')
        const result = await Promise.race([
          supabase
            .from('books')
            .select(LISTING_FIELDS)
            .eq('status', 'available')
            .order('created_at', { ascending: false }),
          timeout(),
        ])
        if (result && 'data' in result && !result.error && result.data) {
          return result.data as unknown as Book[]
        }
      } catch {}
    }
    return []
  },
  ['books-listing'],
  { revalidate: 60, tags: ['books'] }
)

export const getBooks = cache(async (): Promise<Book[]> => {
  return fetchBooks()
})

// Fetch a single book with ALL fields (descriptions, video, etc.)
// Also cached for 60s to avoid repeated Supabase hits on the same book.
const fetchBookById = unstable_cache(
  async (id: string): Promise<Book | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { supabase } = await import('./supabase')
        // Single-book query: allow 10s - one row is fine even with base64 images
        const result = await Promise.race([
          supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .eq('status', 'available')
            .single(),
          timeout(10000),
        ])
        if (result && 'data' in result && !result.error && result.data) {
          return result.data as Book
        }
      } catch {}
    }
    return null
  },
  ['book-detail'],
  { revalidate: 60, tags: ['books'] }
)

export async function getBookById(id: string): Promise<Book | null> {
  return fetchBookById(id)
}

export async function getBooksByCategory(category: string): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.category === category)
}

export async function getFeaturedBooks(): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.featured)
}
