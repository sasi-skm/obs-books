'use client'

import { useEffect, useState } from 'react'
import { Order } from '@/types'
import { supabase } from '@/lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  paid: 'bg-sage/10 text-sage',
  packing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
}

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  uploaded: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

type Tab = 'all' | 'new' | 'paid' | 'shipped'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [shippingForm, setShippingForm] = useState<{ orderId: string; tracking: string; courier: string } | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setOrders(data as Order[])
      } catch {}
    }
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    if (tab === 'all') return true
    return o.order_status === tab
  })

  const handleConfirmPayment = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ payment_status: 'confirmed', order_status: 'paid' })
      .eq('id', orderId)
    loadOrders()
  }

  const handleConfirmShip = async () => {
    if (!shippingForm || !shippingForm.tracking.trim()) return
    await supabase
      .from('orders')
      .update({
        order_status: 'shipped',
        courier: shippingForm.courier,
        tracking_number: shippingForm.tracking.trim(),
      })
      .eq('id', shippingForm.orderId)
    setShippingForm(null)
    loadOrders()
  }

  const handleMarkDelivered = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ order_status: 'delivered' })
      .eq('id', orderId)
    loadOrders()
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'new', label: 'New', count: orders.filter(o => o.order_status === 'new').length },
    { key: 'paid', label: 'Paid', count: orders.filter(o => o.order_status === 'paid').length },
    { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.order_status === 'shipped').length },
  ]

  return (
    <div>
      <h1 className="font-heading text-2xl font-normal mb-6">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-heading text-sm transition-colors ${
              tab === t.key
                ? 'bg-sage text-offwhite'
                : 'bg-offwhite border border-line text-ink-light hover:border-sage'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-offwhite border border-line">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-ink-muted italic">No orders yet</p>
          <p className="text-xs text-ink-muted mt-1">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-0">
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="bg-offwhite border border-line p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-xs font-medium text-sage">{order.order_number}</p>
                    <p className="font-heading font-medium text-sm">{order.customer_name}</p>
                    <p className="text-xs text-ink-muted">{order.customer_phone}</p>
                  </div>
                  <p className="font-heading text-bark font-semibold">฿{order.total_amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                    {order.payment_status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.order_status] || ''}`}>
                    {order.order_status}
                  </span>
                  {order.destination_country && order.destination_country !== 'TH' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600">{order.destination_country}</span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.slip_url && (
                    <a href={order.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      View Slip
                    </a>
                  )}
                  {order.payment_status !== 'confirmed' && order.order_status === 'new' && (
                    <button onClick={() => handleConfirmPayment(order.id)} className="text-xs px-3 py-1.5 bg-sage text-white hover:bg-sage-light">
                      Confirm Payment
                    </button>
                  )}
                  {order.payment_status === 'confirmed' && order.order_status === 'paid' && (
                    shippingForm?.orderId === order.id ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        <input
                          type="text"
                          placeholder="Tracking number"
                          value={shippingForm.tracking}
                          onChange={e => setShippingForm({ ...shippingForm, tracking: e.target.value })}
                          className="text-xs px-2 py-1.5 border border-line bg-cream outline-none focus:border-sage w-full"
                        />
                        <select
                          value={shippingForm.courier}
                          onChange={e => setShippingForm({ ...shippingForm, courier: e.target.value })}
                          className="text-xs px-2 py-1.5 border border-line bg-cream outline-none focus:border-sage w-full"
                        >
                          <option value="thailand-post">Thailand Post</option>
                          <option value="kerry">Kerry Express</option>
                          <option value="flash">Flash Express</option>
                          <option value="jt">J&T Express</option>
                          <option value="dhl">DHL Express</option>
                        </select>
                        <div className="flex gap-2">
                          <button onClick={handleConfirmShip} disabled={!shippingForm.tracking.trim()} className="text-xs px-3 py-1.5 bg-sage text-white hover:bg-sage-light disabled:opacity-50 flex-1">
                            Confirm
                          </button>
                          <button onClick={() => setShippingForm(null)} className="text-xs px-3 py-1.5 border border-line text-ink-muted hover:border-sage flex-1">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShippingForm({ orderId: order.id, tracking: '', courier: 'thailand-post' })} className="text-xs px-3 py-1.5 bg-bark text-white hover:bg-bark/80">
                        Ship
                      </button>
                    )
                  )}
                  {order.order_status === 'shipped' && (
                    <button onClick={() => handleMarkDelivered(order.id)} className="text-xs px-3 py-1.5 bg-green-700 text-white hover:bg-green-800">
                      Delivered
                    </button>
                  )}
                  {order.tracking_number && (
                    <span className="text-xs text-ink-muted font-mono break-all">{order.tracking_number}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-offwhite border border-line overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment">
                  <th className="text-left p-3 font-heading font-medium">Order #</th>
                  <th className="text-left p-3 font-heading font-medium">Customer</th>
                  <th className="text-left p-3 font-heading font-medium">Total</th>
                  <th className="text-left p-3 font-heading font-medium">Payment</th>
                  <th className="text-left p-3 font-heading font-medium">Ship to</th>
                  <th className="text-left p-3 font-heading font-medium">Status</th>
                  <th className="text-left p-3 font-heading font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-line hover:bg-parchment/50">
                    <td className="p-3 font-mono text-xs font-medium text-sage">{order.order_number}</td>
                    <td className="p-3">
                      <div className="font-heading font-medium">{order.customer_name}</div>
                      <div className="text-xs text-ink-muted">{order.customer_phone}</div>
                    </td>
                    <td className="p-3 font-heading text-bark">฿{order.total_amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 inline-block ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-ink-muted">
                        {order.destination_country && order.destination_country !== 'TH' ? order.destination_country : 'TH'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 inline-block ${STATUS_COLORS[order.order_status] || ''}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {order.slip_url && (
                          <a href={order.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View Slip
                          </a>
                        )}
                        {order.payment_status !== 'confirmed' && order.order_status === 'new' && (
                          <button onClick={() => handleConfirmPayment(order.id)} className="text-xs px-2 py-1 bg-sage text-white hover:bg-sage-light">
                            Confirm
                          </button>
                        )}
                        {order.payment_status === 'confirmed' && order.order_status === 'paid' && (
                          shippingForm?.orderId === order.id ? (
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                              <input
                                type="text"
                                placeholder="Tracking number"
                                value={shippingForm.tracking}
                                onChange={e => setShippingForm({ ...shippingForm, tracking: e.target.value })}
                                className="text-xs px-2 py-1 border border-line bg-cream outline-none focus:border-sage w-full"
                              />
                              <select
                                value={shippingForm.courier}
                                onChange={e => setShippingForm({ ...shippingForm, courier: e.target.value })}
                                className="text-xs px-2 py-1 border border-line bg-cream outline-none focus:border-sage w-full"
                              >
                                <option value="thailand-post">Thailand Post</option>
                                <option value="kerry">Kerry Express</option>
                                <option value="flash">Flash Express</option>
                                <option value="jt">J&T Express</option>
                                <option value="dhl">DHL Express</option>
                              </select>
                              <div className="flex gap-1">
                                <button onClick={handleConfirmShip} disabled={!shippingForm.tracking.trim()} className="text-xs px-2 py-1 bg-sage text-white hover:bg-sage-light disabled:opacity-50">
                                  Confirm
                                </button>
                                <button onClick={() => setShippingForm(null)} className="text-xs px-2 py-1 border border-line text-ink-muted hover:border-sage">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setShippingForm({ orderId: order.id, tracking: '', courier: 'thailand-post' })} className="text-xs px-2 py-1 bg-bark text-white hover:bg-bark/80">
                              Ship
                            </button>
                          )
                        )}
                        {order.order_status === 'shipped' && (
                          <button onClick={() => handleMarkDelivered(order.id)} className="text-xs px-2 py-1 bg-green-700 text-white hover:bg-green-800">
                            Delivered
                          </button>
                        )}
                        {order.tracking_number && (
                          <span className="text-xs text-ink-muted font-mono">{order.tracking_number}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
