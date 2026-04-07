'use client'

import { useEffect, useState } from 'react'

interface Voucher {
  id: string
  code: string
  discount_percent: number
  minimum_order: number
  first_order_only: boolean
  active: boolean
  created_at: string
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    code: '',
    discount_percent: '5',
    minimum_order: '1500',
    first_order_only: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vouchers')
      if (res.ok) {
        const { vouchers: data } = await res.json()
        if (data) setVouchers(data as Voucher[])
      }
    } catch {}
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) { setError('Code is required'); return }
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          discount_percent: parseInt(form.discount_percent),
          minimum_order: parseInt(form.minimum_order),
          first_order_only: form.first_order_only,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.includes('unique') ? 'This code already exists' : data.error)
      } else {
        setSuccess('Voucher created')
        setForm({ code: '', discount_percent: '5', minimum_order: '1500', first_order_only: true })
        loadVouchers()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Failed to create voucher')
    }
    setSaving(false)
  }

  const handleToggle = async (voucher: Voucher) => {
    await fetch('/api/admin/vouchers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: voucher.id, active: !voucher.active }),
    })
    loadVouchers()
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-normal mb-6">Vouchers</h1>

      {/* Create form */}
      <div className="bg-offwhite border border-line p-5 mb-8 max-w-lg">
        <h2 className="font-heading text-base mb-4">Create New Voucher</h2>
        {error && <p className="text-sm text-rose mb-3">{error}</p>}
        {success && <p className="text-sm text-sage mb-3">{success}</p>}
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block font-heading text-xs mb-1">Voucher Code *</label>
            <input
              className="w-full px-3 py-2 border border-line bg-cream font-mono text-sm uppercase outline-none focus:border-sage"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. WELCOME10"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-xs mb-1">Discount %</label>
              <input
                type="number" min="1" max="100"
                className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1">Min. Order (฿)</label>
              <input
                type="number" min="0"
                className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.minimum_order}
                onChange={e => setForm({ ...form, minimum_order: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.first_order_only}
              onChange={e => setForm({ ...form, first_order_only: e.target.checked })}
              className="accent-sage w-4 h-4"
            />
            <span className="font-heading text-sm">First order only</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Voucher'}
          </button>
        </form>
      </div>

      {/* Vouchers list */}
      {loading ? (
        <p className="text-ink-muted text-sm">Loading...</p>
      ) : vouchers.length === 0 ? (
        <p className="text-ink-muted text-sm italic">No vouchers yet</p>
      ) : (
        <div className="bg-offwhite border border-line overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment">
                <th className="text-left p-3 font-heading font-medium">Code</th>
                <th className="text-left p-3 font-heading font-medium">Discount</th>
                <th className="text-left p-3 font-heading font-medium">Min Order</th>
                <th className="text-left p-3 font-heading font-medium">First Order</th>
                <th className="text-left p-3 font-heading font-medium">Status</th>
                <th className="text-left p-3 font-heading font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="border-b border-line hover:bg-parchment/50">
                  <td className="p-3 font-mono font-medium text-sage">{v.code}</td>
                  <td className="p-3">{v.discount_percent}%</td>
                  <td className="p-3">฿{v.minimum_order.toLocaleString()}</td>
                  <td className="p-3">{v.first_order_only ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 ${v.active ? 'bg-sage/10 text-sage' : 'bg-line/30 text-ink-muted'}`}>
                      {v.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggle(v)}
                      className={`text-xs px-2 py-1 border ${v.active ? 'border-rose text-rose hover:bg-rose hover:text-white' : 'border-sage text-sage hover:bg-sage hover:text-white'} transition-colors`}
                    >
                      {v.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
