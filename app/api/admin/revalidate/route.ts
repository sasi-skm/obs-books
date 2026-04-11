import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { resetBooksCache } from '@/lib/books-data'

// Called after saving/deleting a book to instantly clear storefront cache
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { bookId, categories } = await req.json()

    // 1. Clear the in-memory module cache in this lambda instance so the
    //    next getBooks() call refetches from Supabase.
    resetBooksCache()

    // 2. Invalidate Next's ISR HTML caches for every route that renders books.
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat) revalidatePath(`/category/${cat}`)
      }
    }
    if (bookId) revalidatePath(`/book/${bookId}`)
    revalidatePath('/shop')
    revalidatePath('/')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[api/admin/revalidate] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
