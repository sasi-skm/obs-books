import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, category } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing book id' }, { status: 400 })

    // Delete order_items first (bypass RLS with service role key)
    await supabaseAdmin.from('order_items').delete().eq('book_id', id)

    // Now delete the book
    const { error } = await supabaseAdmin.from('books').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Revalidate storefront cache so deleted book disappears immediately
    revalidatePath('/')
    revalidatePath('/shop')
    revalidatePath(`/book/${id}`)
    if (category) revalidatePath(`/category/${category}`)
    revalidateTag('books')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
