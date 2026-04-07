'use client'

import { useEffect, useState } from 'react'

interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  points_balance: number
  date_of_birth: string | null
  created_at: string
  order_count?: number
  total_spent?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    const res = await fetch('/api/admin/customers')
    if (res.ok) {
      const data = await res.json()
      setCustomers(data)
    }
    setLoading(false)
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.email?.toLowerCase().includes(q) ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatBirthday = (d: string | null) => {
    if (!d) return '-'
    const [, month, day] = d.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${day} ${months[parseInt(month) - 1]}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-normal">Customers ({customers.length})</h1>
          <p className="text-xs text-ink-light mt-0.5">Registered accounts on the site</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage mb-6"
      />

      {loading ? (
        <p className="text-ink-light text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-light text-sm">No customers found.</p>
      ) : (
        <div className="overflow-x-auto border border-line rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-parchment border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left font-heading text-xs text-ink-light">Name</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-ink-light">Email</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-ink-light">Phone</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-ink-light">Birthday</th>
                <th className="px-4 py-3 text-right font-heading text-xs text-ink-light">Points</th>
                <th className="px-4 py-3 text-right font-heading text-xs text-ink-light">Orders</th>
                <th className="px-4 py-3 text-right font-heading text-xs text-ink-light">Total Spent</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-ink-light">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(c => (
                <tr key={c.id} className="bg-offwhite hover:bg-parchment transition-colors">
                  <td className="px-4 py-3 font-body text-ink">{c.full_name || <span className="text-ink-light">-</span>}</td>
                  <td className="px-4 py-3 font-body text-ink-light text-xs">{c.email}</td>
                  <td className="px-4 py-3 font-body text-ink-light text-xs">{c.phone || '-'}</td>
                  <td className="px-4 py-3 font-body text-ink-light text-xs">{formatBirthday(c.date_of_birth)}</td>
                  <td className="px-4 py-3 text-right font-body text-ink">{c.points_balance ?? 0}</td>
                  <td className="px-4 py-3 text-right font-body text-ink">{c.order_count}</td>
                  <td className="px-4 py-3 text-right font-body text-ink">
                    {c.total_spent ? `฿${c.total_spent.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 font-body text-ink-light text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
