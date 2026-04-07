import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
