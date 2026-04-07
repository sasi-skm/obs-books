import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('orders').select('customer_email, total_amount').not('customer_email', 'is', null),
  ])

  const statsMap: Record<string, { count: number; total: number }> = {}
  for (const o of orders || []) {
    if (!o.customer_email) continue
    if (!statsMap[o.customer_email]) statsMap[o.customer_email] = { count: 0, total: 0 }
    statsMap[o.customer_email].count++
    statsMap[o.customer_email].total += o.total_amount || 0
  }

  const customers = (profiles || []).map(p => ({
    ...p,
    order_count: statsMap[p.email]?.count || 0,
    total_spent: statsMap[p.email]?.total || 0,
  }))

  return NextResponse.json(customers)
}
