'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Stats {
  newOrders: number
  awaitingShipment: number
  lowStock: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ newOrders: 0, awaitingShipment: 0, lowStock: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        // Head-only count queries scale with O(1) payload instead of pulling
        // every row. Revenue still needs the rows, but narrowed to the
        // confirmed ones only.
        const [
          newOrdersRes,
          awaitingShipmentRes,
          lowStockRes,
          revenueRes,
        ] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('order_status', 'new'),
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('payment_status', 'confirmed')
            .eq('order_status', 'paid'),
          supabase
            .from('books')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'available')
            .lte('copies', 1),
          supabase
            .from('orders')
            .select('total_amount, payment_method')
            .eq('payment_status', 'confirmed')
            // Refunded/cancelled orders are not realized revenue - exclude them.
            .not('order_status', 'in', '(refunded,cancelled)'),
        ])

        const revenueRows = (revenueRes.data || []) as { total_amount: number; payment_method: string | null }[]

        setStats({
          newOrders: newOrdersRes.count ?? 0,
          awaitingShipment: awaitingShipmentRes.count ?? 0,
          lowStock: lowStockRes.count ?? 0,
          // Stripe stores total_amount in the smallest unit (satang); divide
          // by 100 to baht. Non-Stripe (PromptPay/bank) is already in baht.
          totalRevenue: revenueRows.reduce(
            (s, o) =>
              s +
              (o.payment_method === 'stripe'
                ? Math.round((o.total_amount || 0) / 100)
                : o.total_amount || 0),
            0,
          ),
        })
      } catch (err) {
        console.error('[admin/page] loadStats failed:', err)
      }
    }
    setLoading(false)
  }

  const statCards = [
    { label: 'New Orders', value: stats.newOrders, icon: '🆕', color: 'text-rose', href: '/admin/orders' },
    { label: 'Awaiting Shipment', value: stats.awaitingShipment, icon: '📦', color: 'text-bark', href: '/admin/orders' },
    { label: 'Low Stock Books', value: stats.lowStock, icon: '⚠️', color: 'text-sage', href: '/admin/books' },
  ]

  return (
    <div>
      <h1 className="font-heading text-2xl font-normal mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-offwhite border border-line p-5 hover:shadow-card transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className={`font-heading text-3xl font-bold ${card.color}`}>
                {loading ? '-' : card.value}
              </span>
            </div>
            <p className="text-sm text-ink-light font-heading">{card.label}</p>
          </Link>
        ))}
      </div>

      {stats.totalRevenue > 0 && (
        <div className="bg-offwhite border border-line p-5 mb-8 inline-block">
          <p className="text-sm text-ink-light font-heading mb-1">Total Confirmed Revenue</p>
          <p className="font-heading text-2xl font-bold text-sage">
            ฿{stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/books/new"
          className="bg-sage text-offwhite p-5 font-heading text-center hover:bg-sage-light transition-colors"
        >
          + Add New Book
        </Link>
        <Link
          href="/admin/orders"
          className="bg-offwhite border border-line p-5 font-heading text-center text-ink-light hover:border-sage hover:text-sage transition-colors"
        >
          View All Orders
        </Link>
      </div>
    </div>
  )
}
