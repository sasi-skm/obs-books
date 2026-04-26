'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Order } from '@/types'
import { supabase } from '@/lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  paid: 'bg-sage/10 text-sage',
  packing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  partially_cancelled: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  partially_cancelled: 'partially cancelled',
}

const CANCEL_REASONS = ['Out of stock', 'Book condition too poor to sell']

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  uploaded: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  promptpay: 'PromptPay',
  transfer: 'Bank Transfer',
  stripe: 'Card (Stripe)',
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  promptpay: 'bg-purple-100 text-purple-700',
  transfer: 'bg-amber-100 text-amber-700',
  stripe: 'bg-sage/20 text-sage',
}

const REFUND_REASONS: { value: string; label: string }[] = [
  { value: 'requested_by_customer', label: 'Requested by customer' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'fraudulent', label: 'Fraudulent' },
  { value: 'other', label: 'Other (no reason sent)' },
]

// Stripe orders store total_amount as USD cents; everything else is THB
// whole units. Detect by payment_method (not currency) since some legacy
// international PromptPay rows have currency='USD' but THB-based amounts.
function formatOrderTotal(order: Order): string {
  if (order.payment_method === 'stripe') {
    return `$${(order.total_amount / 100).toFixed(2)} USD`
  }
  return `฿${order.total_amount.toLocaleString()}`
}

// Build a Stripe dashboard URL for a payment intent. Mode is detected
// from the publishable key prefix (already exposed to the client) so
// test sandbox links go to /test/payments/... and live to /payments/...
function stripeDashboardUrl(piId: string): string {
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  const mode = pubKey.startsWith('pk_test_') ? 'test/' : ''
  return `https://dashboard.stripe.com/${mode}payments/${piId}`
}

type Tab = 'all' | 'new' | 'paid' | 'shipped'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [shippingForm, setShippingForm] = useState<{ orderId: string; tracking: string; courier: string } | null>(null)
  const [cancelModal, setCancelModal] = useState<Order | null>(null)
  const [cancelSelectedBooks, setCancelSelectedBooks] = useState<Record<string, boolean>>({})
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({})
  const [cancelNote, setCancelNote] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  // Stripe refund modal state
  const [refundModal, setRefundModal] = useState<Order | null>(null)
  const [refundAmount, setRefundAmount] = useState('') // dollars as string
  const [refundReason, setRefundReason] = useState<string>('requested_by_customer')
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
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
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_payment' }),
    })
    loadOrders()
  }

  const handleConfirmShip = async () => {
    if (!shippingForm || !shippingForm.tracking.trim()) return
    await fetch(`/api/orders/${shippingForm.orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ship',
        tracking_number: shippingForm.tracking.trim(),
        courier: shippingForm.courier,
      }),
    })
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

  const openCancelModal = (order: Order) => {
    const items = order.items || []
    const sel: Record<string, boolean> = {}
    const reasons: Record<string, string> = {}
    // For single-book orders, auto-select the only book
    if (items.length === 1) {
      sel[items[0].id] = true
      reasons[items[0].id] = CANCEL_REASONS[0]
    }
    setCancelSelectedBooks(sel)
    setCancelReasons(reasons)
    setCancelNote('')
    setCancelModal(order)
  }

  const openRefundModal = (order: Order) => {
    const fullDollars = (order.total_amount / 100).toFixed(2)
    setRefundAmount(fullDollars)
    setRefundReason('requested_by_customer')
    setRefundError('')
    setRefundModal(order)
  }

  const handleRefundSubmit = async () => {
    if (!refundModal) return
    const dollars = parseFloat(refundAmount)
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setRefundError('Enter a valid refund amount')
      return
    }
    const cents = Math.round(dollars * 100)
    if (cents > refundModal.total_amount) {
      setRefundError('Refund amount cannot exceed the original charge')
      return
    }
    setRefundLoading(true)
    setRefundError('')
    try {
      const isFull = cents === refundModal.total_amount
      const res = await fetch('/api/admin/refund-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: refundModal.id,
          // Omit amount_cents on full refunds so Stripe defers to its
          // own "full" semantics (and the webhook treats it as full).
          ...(isFull ? {} : { amount_cents: cents }),
          ...(refundReason !== 'other' ? { reason: refundReason } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRefundError(data.error || 'Refund failed')
        setRefundLoading(false)
        return
      }
      setRefundModal(null)
      setRefundLoading(false)
      // Webhook (charge.refunded) updates order_status async; reload to
      // pick up the new state once it lands. May take a second or two.
      setTimeout(loadOrders, 1500)
    } catch {
      setRefundError('Network error')
      setRefundLoading(false)
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelModal) return
    const items = cancelModal.items || []
    const selectedItems = items.filter(item => cancelSelectedBooks[item.id])
    if (selectedItems.length === 0) return

    setCancelLoading(true)
    try {
      const cancelled_items = selectedItems.map(item => ({
        book_id: item.book_id,
        title: item.title,
        price: item.price * ((item as { quantity?: number }).quantity || 1),
        reason: cancelReasons[item.id] || CANCEL_REASONS[0],
      }))

      const res = await fetch(`/api/orders/${cancelModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_cancel',
          cancelled_items,
          admin_note: cancelNote.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert('Error: ' + (err.error || 'Failed to cancel'))
      } else {
        setCancelModal(null)
        loadOrders()
      }
    } catch {
      alert('Network error')
    }
    setCancelLoading(false)
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
                    {order.customer_email && (
                      <p className="text-xs text-ink-muted">{order.customer_email}</p>
                    )}
                    {order.shipping_address && (
                      <p className="text-xs text-ink-muted mt-1 max-w-[220px] leading-relaxed">📍 {order.shipping_address}</p>
                    )}
                  </div>
                  <p className="font-heading text-bark font-semibold whitespace-nowrap">{formatOrderTotal(order)}</p>
                </div>

                {/* Book list */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-line">
                    <p className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5">Order items</p>
                    <div className="space-y-1.5">
                      {order.items.map((item: { id: string; image_url?: string; title: string; author: string; price: number; condition?: string; quantity?: number }) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {item.image_url ? (
                            <div className="relative shrink-0 border border-line overflow-hidden" style={{ width: 32, height: 32 }}>
                              <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="32px" />
                            </div>
                          ) : (
                            <div className="shrink-0 border border-line bg-parchment flex items-center justify-center" style={{ width: 32, height: 32, fontSize: 14 }}>📖</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-heading text-xs font-medium text-ink truncate">{item.title}</p>
                            <p className="text-[10px] text-ink-muted">
                              {item.author}
                              {item.condition && <span className="ml-1 text-sage font-medium">· {item.condition}</span>}
                              {item.quantity && item.quantity > 1 && <span className="ml-1 text-bark">× {item.quantity}</span>}
                            </p>
                          </div>
                          <span className="text-xs text-bark shrink-0">฿{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 ${PAYMENT_METHOD_COLORS[order.payment_method] || 'bg-gray-100 text-gray-700'}`}>
                    {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                    {order.payment_status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.order_status] || ''}`}>
                    {STATUS_LABELS[order.order_status] || order.order_status}
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
                  {order.payment_method === 'stripe' && order.stripe_payment_intent_id && (
                    <a
                      href={stripeDashboardUrl(order.stripe_payment_intent_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1.5 border border-sage/40 text-sage hover:bg-sage/5 transition-colors"
                      title={order.stripe_payment_intent_id}
                    >
                      ↗ Stripe
                    </a>
                  )}
                  {order.payment_status !== 'confirmed' && order.order_status === 'new' && order.payment_method !== 'stripe' && (
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
                  {order.payment_method === 'stripe'
                    ? order.order_status !== 'cancelled' && order.order_status !== 'partially_cancelled' && order.order_status !== 'refunded' && order.stripe_payment_intent_id && (
                        <button onClick={() => openRefundModal(order)} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                          Refund via Stripe
                        </button>
                      )
                    : order.order_status !== 'cancelled' && order.order_status !== 'partially_cancelled' && (
                        <button onClick={() => openCancelModal(order)} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                          Cancel
                        </button>
                      )
                  }
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
                      {order.customer_email && <div className="text-xs text-ink-muted">{order.customer_email}</div>}
                      {order.shipping_address && (
                        <div className="text-[10px] text-ink-muted mt-0.5 max-w-[200px] leading-relaxed">📍 {order.shipping_address}</div>
                      )}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {order.items.map((item: { id: string; title: string; condition?: string; quantity?: number }) => (
                            <div key={item.id} className="text-[10px] text-ink-muted truncate max-w-[180px]">
                              · {item.title}
                              {item.condition && <span className="text-sage font-medium ml-1">({item.condition})</span>}
                              {item.quantity && item.quantity > 1 && <span className="text-bark ml-1">×{item.quantity}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-heading text-bark whitespace-nowrap">{formatOrderTotal(order)}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 inline-block ${PAYMENT_METHOD_COLORS[order.payment_method] || 'bg-gray-100 text-gray-700'}`}>
                          {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                        </span>
                        <span className={`text-xs px-2 py-0.5 inline-block ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-ink-muted">
                        {order.destination_country && order.destination_country !== 'TH' ? order.destination_country : 'TH'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 inline-block ${STATUS_COLORS[order.order_status] || ''}`}>
                        {STATUS_LABELS[order.order_status] || order.order_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {order.slip_url && (
                          <a href={order.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View Slip
                          </a>
                        )}
                        {order.payment_method === 'stripe' && order.stripe_payment_intent_id && (
                          <a
                            href={stripeDashboardUrl(order.stripe_payment_intent_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 border border-sage/40 text-sage hover:bg-sage/5 transition-colors"
                            title={order.stripe_payment_intent_id}
                          >
                            ↗ Stripe
                          </a>
                        )}
                        {order.payment_status !== 'confirmed' && order.order_status === 'new' && order.payment_method !== 'stripe' && (
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
                        {order.payment_method === 'stripe'
                          ? order.order_status !== 'cancelled' && order.order_status !== 'partially_cancelled' && order.order_status !== 'refunded' && order.stripe_payment_intent_id && (
                              <button onClick={() => openRefundModal(order)} className="text-xs px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                                Refund via Stripe
                              </button>
                            )
                          : order.order_status !== 'cancelled' && order.order_status !== 'partially_cancelled' && (
                              <button onClick={() => openCancelModal(order)} className="text-xs px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                                Cancel
                              </button>
                            )
                        }
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
      {/* Cancel Order Modal */}
      {cancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !cancelLoading && setCancelModal(null)}
        >
          <div
            className="bg-white border border-line max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-medium text-ink">
                Cancel Order {cancelModal.order_number}
              </h2>
              <button
                onClick={() => !cancelLoading && setCancelModal(null)}
                className="text-ink-muted hover:text-ink text-xl leading-none"
              >
                x
              </button>
            </div>

            {/* Multi-book: show book selection */}
            {(cancelModal.items || []).length > 1 && (
              <div className="mb-4">
                <p className="text-xs text-ink-muted mb-2 uppercase tracking-wide">Select books to cancel:</p>
                <div className="space-y-2">
                  {(cancelModal.items || []).map((item: { id: string; title: string; author: string; price: number; image_url?: string; quantity?: number }) => (
                    <div key={item.id} className="border border-line p-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!cancelSelectedBooks[item.id]}
                          onChange={e => {
                            const checked = e.target.checked
                            setCancelSelectedBooks(prev => ({ ...prev, [item.id]: checked }))
                            if (checked && !cancelReasons[item.id]) {
                              setCancelReasons(prev => ({ ...prev, [item.id]: CANCEL_REASONS[0] }))
                            }
                          }}
                          className="mt-0.5 accent-red-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm font-medium text-ink">{item.title}</p>
                          <p className="text-xs text-ink-muted">{item.author}</p>
                          <p className="text-xs text-bark mt-0.5">฿{(item.price * ((item as { quantity?: number }).quantity || 1)).toLocaleString()}</p>
                        </div>
                      </label>
                      {cancelSelectedBooks[item.id] && (
                        <div className="mt-2 ml-7">
                          <select
                            value={cancelReasons[item.id] || CANCEL_REASONS[0]}
                            onChange={e => setCancelReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="text-xs px-2 py-1.5 border border-line bg-cream outline-none focus:border-sage w-full"
                          >
                            {CANCEL_REASONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single-book: show reason only */}
            {(cancelModal.items || []).length === 1 && (
              <div className="mb-4">
                <p className="text-xs text-ink-muted mb-1 uppercase tracking-wide">Reason:</p>
                <select
                  value={cancelReasons[(cancelModal.items || [])[0]?.id] || CANCEL_REASONS[0]}
                  onChange={e => {
                    const itemId = (cancelModal.items || [])[0]?.id
                    if (itemId) setCancelReasons(prev => ({ ...prev, [itemId]: e.target.value }))
                  }}
                  className="text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage w-full"
                >
                  {CANCEL_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin note */}
            <div className="mb-4">
              <p className="text-xs text-ink-muted mb-1 uppercase tracking-wide">Note to customer (optional):</p>
              <textarea
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
                className="text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage w-full resize-none"
              />
            </div>

            {/* Info box */}
            {cancelModal.customer_email && (
              <div className="mb-4 px-3 py-2.5 bg-blue-50 border border-blue-200 text-xs text-blue-700">
                A cancellation email will be sent to <strong>{cancelModal.customer_email}</strong>
              </div>
            )}
            {!cancelModal.customer_email && (
              <div className="mb-4 px-3 py-2.5 bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
                No email on file - the customer will not receive an email notification
              </div>
            )}

            {/* Summary */}
            {(() => {
              const items = cancelModal.items || []
              const selectedCount = Object.values(cancelSelectedBooks).filter(Boolean).length
              const isFullCancel = selectedCount >= items.length
              return selectedCount > 0 && (
                <div className="mb-4 px-3 py-2 bg-parchment border border-sand text-xs text-ink">
                  {isFullCancel
                    ? `Full cancellation - order status will change to "cancelled"`
                    : `Partial cancellation (${selectedCount} of ${items.length} books) - order status will change to "partially cancelled"`
                  }
                </div>
              )
            })()}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelSubmit}
                disabled={cancelLoading || Object.values(cancelSelectedBooks).filter(Boolean).length === 0}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-heading hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelLoading}
                className="px-4 py-2.5 border border-line text-ink-muted text-sm font-heading hover:border-sage transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Refund Modal */}
      {refundModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !refundLoading && setRefundModal(null)}
        >
          <div
            className="bg-white border border-line max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-medium text-ink">
                Refund order {refundModal.order_number}
              </h2>
              <button
                onClick={() => !refundLoading && setRefundModal(null)}
                className="text-ink-muted hover:text-ink text-xl leading-none"
              >
                x
              </button>
            </div>

            <p className="text-sm text-ink-muted mb-4">
              Charged: <span className="font-heading text-bark">{formatOrderTotal(refundModal)}</span>
            </p>

            {/* Refund amount */}
            <div className="mb-4">
              <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wide">Refund amount</label>
              <div className="flex">
                <span className="px-3 py-2 border border-line border-r-0 bg-parchment text-ink-muted font-heading">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage font-mono"
                  placeholder="0.00"
                  disabled={refundLoading}
                />
              </div>
              <p className="text-[11px] text-ink-muted italic mt-1">
                Leave at full to refund the entire charge.
              </p>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wide">Reason</label>
              <select
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                disabled={refundLoading}
                className="w-full text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage"
              >
                {REFUND_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Info box: full vs partial semantics */}
            <div className="mb-4 px-4 py-3 bg-parchment border border-sand text-xs text-ink leading-relaxed">
              <p className="font-heading mb-1.5">Full refund:</p>
              <ul className="list-disc list-inside space-y-0.5 mb-2 text-ink-muted">
                <li>Issue refund via Stripe</li>
                <li>Mark order as refunded</li>
                <li>Restore books to shop</li>
                <li>Email customer</li>
              </ul>
              <p className="font-heading mb-1.5">Partial refund:</p>
              <ul className="list-disc list-inside space-y-0.5 text-ink-muted">
                <li>Issue partial refund via Stripe</li>
                <li>Order status unchanged</li>
                <li>Stock NOT restored (handle manually if needed)</li>
              </ul>
            </div>

            {refundError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">
                {refundError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRefundSubmit}
                disabled={refundLoading}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-heading hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refundLoading
                  ? 'Refunding...'
                  : `Confirm refund $${(parseFloat(refundAmount) || 0).toFixed(2)}`}
              </button>
              <button
                onClick={() => setRefundModal(null)}
                disabled={refundLoading}
                className="px-4 py-2.5 border border-line text-ink-muted text-sm font-heading hover:border-sage transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
