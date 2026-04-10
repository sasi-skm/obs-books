import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

// One-time migration to add cancelled_items column
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Check if column already exists by trying to query it
  const { error: checkError } = await supabaseAdmin
    .from('orders')
    .select('cancelled_items')
    .limit(1)

  if (checkError && checkError.message.includes('cancelled_items')) {
    return NextResponse.json({
      success: false,
      needs_migration: true,
      message: 'Please run this SQL in the Supabase dashboard SQL editor:',
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_items jsonb DEFAULT NULL;',
    })
  }

  return NextResponse.json({ success: true, message: 'Column already exists' })
}
