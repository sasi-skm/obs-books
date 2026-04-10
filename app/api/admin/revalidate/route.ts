import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'

// Called after saving/deleting a book to instantly clear storefront cache
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { bookId, categories } = await req.json()

    // Revalidate all category pages that may have changed
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat) revalidatePath(`/category/${cat}`)
      }
    }

    // Revalidate the book's own page
    if (bookId) revalidatePath(`/book/${bookId}`)

    // Revalidate shop and homepage
    revalidatePath('/shop')
    revalidatePath('/')

    // Also clear the unstable_cache data cache so next request gets fresh data
    revalidateTag('books')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
