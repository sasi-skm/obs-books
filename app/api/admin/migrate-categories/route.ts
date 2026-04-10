import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

// One-time migration: rename category IDs in the books table
// GET /api/admin/migrate-categories  — run once then this endpoint is harmless (updates 0 rows)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { error: e1, data: d1 } = await supabaseAdmin
      .from('books')
      .update({ category: 'country-life' })
      .eq('category', 'tea-country')
      .select('id')

    const { error: e2, data: d2 } = await supabaseAdmin
      .from('books')
      .update({ category: 'art-illustration' })
      .eq('category', 'art-nature')
      .select('id')

    if (e1 || e2) {
      return NextResponse.json({ error: (e1 || e2)?.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      updated: {
        'tea-country → country-life': d1?.length ?? 0,
        'art-nature → art-illustration': d2?.length ?? 0,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
