'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Order } from '@/types'
import { supabase } from '@/lib/supabase'
import { adminFetch } from '@/lib/admin-fetch'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  paid: 'bg-sage/10 text-sage',
  packing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  partially_cancelled: 'bg-orange-100 text-orange-700',
  refunded: 'bg-rose-100 text-rose-700',
}

const STATUS_LABELS: Record<string, string> = {
  partially_cancelled: 'partially cancelled',
  refunded: 'refunded',
}

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

function formatOrderTotal(order: Order): string {
  if (order.payment_method === 'stripe') {
    if (order.currency === 'THB') {
      return `฿${Math.round(order.total_amount / 100).toLocaleString()}`
    }
    return `$${(order.total_amount / 100).toFixed(2)} USD`
  }
  return `฿${order.total_amount.toLocaleString()}`
}

function stripeDashboardUrl(piId: string): string {
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  const mode = pubKey.startsWith('pk_test_') ? 'test/' : ''
  return `https://dashboard.stripe.com/${mode}payments/${piId}`
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type OrderItem = {
  id: string
  book_id?: string
  title: string
  author?: string
  price: number
  image_url?: string
  condition?: string
  quantity?: number
}

type CancelledItem = {
  book_id: string
  title: string
  price: number
  reason: string
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>()
  const orderNumber = params?.orderNumber || ''

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionError, setActionError] = useState('')

  // Refund modal state
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('requested_by_customer')
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')

  // Shipping modal state
  const [shippingOpen, setShippingOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState('thailand-post')
  const [shippingLoading, setShippingLoading] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderNumber) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('order_number', orderNumber)
        .single()
      if (data) {
        setOrder(data as Order)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    }
    setLoading(false)
  }, [orderNumber])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleConfirmPayment = async () => {
    if (!order) return
    setActionError('')
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_payment' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setActionError(j.error || 'Failed to confirm payment')
        return
      }
      loadOrder()
    } catch {
      setActionError('Network error')
    }
  }

  const handleConfirmShip = async () => {
    if (!order || !trackingNumber.trim()) return
    setShippingLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ship',
          tracking_number: trackingNumber.trim(),
          courier,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setActionError(j.error || 'Failed to ship')
        setShippingLoading(false)
        return
      }
      setShippingOpen(false)
      setTrackingNumber('')
      setShippingLoading(false)
      loadOrder()
    } catch {
      setActionError('Network error')
      setShippingLoading(false)
    }
  }

  const handleMarkDelivered = async () => {
    if (!order) return
    setActionError('')
    try {
      await supabase.from('orders').update({ order_status: 'delivered' }).eq('id', order.id)
      loadOrder()
    } catch {
      setActionError('Failed to mark delivered')
    }
  }

  const openRefund = () => {
    if (!order) return
    const isThbRefund = order.currency === 'THB'
    const fullAmount = isThbRefund
      ? Math.round(order.total_amount / 100).toString()
      : (order.total_amount / 100).toFixed(2)
    setRefundAmount(fullAmount)
    setRefundReason('requested_by_customer')
    setRefundError('')
    setRefundOpen(true)
  }

  const handleRefundSubmit = async () => {
    if (!order) return
    const value = parseFloat(refundAmount)
    if (!Number.isFinite(value) || value <= 0) {
      setRefundError('Enter a valid refund amount')
      return
    }
    const smallestUnit = Math.round(value * 100)
    if (smallestUnit > order.total_amount) {
      setRefundError('Refund amount cannot exceed the original charge')
      return
    }
    setRefundLoading(true)
    setRefundError('')
    try {
      const isFull = smallestUnit === order.total_amount
      const res = await adminFetch('/api/admin/refund-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          ...(isFull ? {} : { amount_cents: smallestUnit }),
          ...(refundReason !== 'other' ? { reason: refundReason } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRefundError(data.error || 'Refund failed')
        setRefundLoading(false)
        return
      }
      setRefundOpen(false)
      setRefundLoading(false)
      // Webhook updates order_status async; reload after a beat.
      setTimeout(loadOrder, 1500)
    } catch {
      setRefundError('Network error')
      setRefundLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <p className="text-ink-muted">Loading order...</p>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div>
        <Link href="/admin/orders" className="text-sm text-sage hover:underline">← All orders</Link>
        <div className="mt-6 text-center py-12 bg-offwhite border border-line">
          <p className="text-3xl mb-2">🌿</p>
          <p className="text-ink-muted italic">Order {orderNumber} not found</p>
        </div>
      </div>
    )
  }

  const items = (order.items || []) as OrderItem[]
  const cancelledItems = (order.cancelled_items || []) as CancelledItem[]
  const isStripe = order.payment_method === 'stripe'

  return (
    <div>
      {/* Back nav */}
      <Link href="/admin/orders" className="text-sm text-sage hover:underline">← All orders</Link>

      {/* Header */}
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-normal font-mono text-bark">{order.order_number}</h1>
        <span className={`text-xs px-2 py-0.5 ${PAYMENT_METHOD_COLORS[order.payment_method] || 'bg-gray-100 text-gray-700'}`}>
          {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
        </span>
        <span className={`text-xs px-2 py-0.5 ${PAYMENT_COLORS[order.payment_status] || ''}`}>
          {order.payment_status}
        </span>
        <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.order_status] || ''}`}>
          {STATUS_LABELS[order.order_status] || order.order_status}
        </span>
      </div>

      {actionError && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Top action bar */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {order.slip_url && (
          <a href={order.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
            View Slip
          </a>
        )}
        {isStripe && order.stripe_payment_intent_id && (
          <a
            href={stripeDashboardUrl(order.stripe_payment_intent_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 border border-sage/40 text-sage hover:bg-sage/5 transition-colors"
            title={order.stripe_payment_intent_id}
          >
            ↗ Open in Stripe
          </a>
        )}
        {order.payment_status !== 'confirmed' && order.order_status === 'new' && !isStripe && (
          <button onClick={handleConfirmPayment} className="text-xs px-3 py-1.5 bg-sage text-white hover:bg-sage-light">
            Confirm Payment
          </button>
        )}
        {order.payment_status === 'confirmed' && order.order_status === 'paid' && (
          <button onClick={() => setShippingOpen(true)} className="text-xs px-3 py-1.5 bg-bark text-white hover:bg-bark/80">
            Ship
          </button>
        )}
        {order.order_status === 'shipped' && (
          <button onClick={handleMarkDelivered} className="text-xs px-3 py-1.5 bg-green-700 text-white hover:bg-green-800">
            Mark Delivered
          </button>
        )}
        {isStripe && order.order_status !== 'cancelled' && order.order_status !== 'partially_cancelled' && order.order_status !== 'refunded' && (
          <button onClick={openRefund} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
            Refund via Stripe
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Customer */}
        <section className="border border-line bg-offwhite p-4">
          <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-2">Customer</h2>
          <p className="font-heading font-medium">{order.customer_name}</p>
          {order.customer_phone && <p className="text-sm text-ink-muted">{order.customer_phone}</p>}
          {order.customer_email && <p className="text-sm text-ink-muted">{order.customer_email}</p>}
          {!order.customer_email && (
            <p className="text-xs text-yellow-700 italic mt-1">No email on file</p>
          )}
        </section>

        {/* Shipping */}
        <section className="border border-line bg-offwhite p-4">
          <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-2">Shipping address</h2>
          {order.shipping_address ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">{order.shipping_address}</p>
          ) : (
            <p className="text-xs text-ink-muted italic">No shipping address</p>
          )}
          <p className="text-xs text-ink-muted mt-2">
            <strong>Country:</strong> {order.destination_country || 'TH'}
          </p>
          {(order.tracking_number || order.courier) && (
            <div className="mt-3 pt-3 border-t border-line">
              <p className="text-xs uppercase tracking-wider text-ink-muted mb-1">Tracking</p>
              {order.courier && <p className="text-sm">{order.courier}</p>}
              {order.tracking_number && (
                <p className="text-sm font-mono break-all">{order.tracking_number}</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Items */}
      <section className="border border-line bg-offwhite p-4 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-3">
          Items ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-line last:border-0 last:pb-0">
              {item.image_url ? (
                <div className="relative shrink-0 border border-line overflow-hidden" style={{ width: 56, height: 56 }}>
                  <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div className="shrink-0 border border-line bg-parchment flex items-center justify-center" style={{ width: 56, height: 56, fontSize: 22 }}>📖</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-medium text-ink">{item.title}</p>
                {item.author && (
                  <p className="text-xs text-ink-muted italic">by {item.author}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.condition && (
                    <span className="text-[11px] px-1.5 py-0.5 bg-sage/10 text-sage">{item.condition}</span>
                  )}
                  {item.quantity && item.quantity > 1 && (
                    <span className="text-[11px] px-1.5 py-0.5 bg-bark/10 text-bark">×{item.quantity}</span>
                  )}
                </div>
              </div>
              <p className="font-heading text-sm text-bark whitespace-nowrap">
                ฿{(item.price * (item.quantity || 1)).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-heading text-base font-semibold pt-3 mt-3 border-t border-line">
          <span>Total charged</span>
          <span className="text-bark">{formatOrderTotal(order)}</span>
        </div>
        {isStripe && order.currency === 'USD' && (
          <p className="text-[11px] text-ink-muted italic mt-1">
            Items shown in shop currency (THB). Total in USD as charged via Stripe (incl. DHL international shipping).
          </p>
        )}
        {isStripe && order.currency === 'THB' && (
          <p className="text-[11px] text-ink-muted italic mt-1">
            Charged via Stripe in THB. Free domestic shipping.
          </p>
        )}
      </section>

      {/* Stripe details */}
      {isStripe && (
        <section className="border border-line bg-offwhite p-4 mb-6">
          <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-3">Stripe</h2>
          <dl className="text-sm space-y-1.5">
            {order.stripe_payment_intent_id && (
              <div className="flex flex-wrap gap-2">
                <dt className="text-ink-muted w-32">Payment intent</dt>
                <dd className="font-mono text-xs break-all flex-1">
                  <a
                    href={stripeDashboardUrl(order.stripe_payment_intent_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage hover:underline"
                  >
                    {order.stripe_payment_intent_id}
                  </a>
                </dd>
              </div>
            )}
            {order.stripe_session_id && (
              <div className="flex flex-wrap gap-2">
                <dt className="text-ink-muted w-32">Session id</dt>
                <dd className="font-mono text-xs break-all flex-1">{order.stripe_session_id}</dd>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <dt className="text-ink-muted w-32">Currency</dt>
              <dd className="flex-1">{order.currency || 'USD'}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* Cancellation / refund history */}
      {cancelledItems.length > 0 && (
        <section className="border border-line bg-offwhite p-4 mb-6">
          <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-3">
            Cancellation history
          </h2>
          <div className="space-y-2">
            {cancelledItems.map((ci, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-line last:border-0 pb-2 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{ci.title}</p>
                  <p className="text-xs text-ink-muted italic">{ci.reason}</p>
                </div>
                <p className="font-heading text-bark whitespace-nowrap">
                  -฿{Number(ci.price || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline / metadata */}
      <section className="border border-line bg-offwhite p-4 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-3">Timeline</h2>
        <dl className="text-sm space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <dt className="text-ink-muted w-32">Created</dt>
            <dd className="flex-1">{formatDateTime(order.created_at)}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-ink-muted w-32">Last updated</dt>
            <dd className="flex-1">{formatDateTime(order.updated_at)}</dd>
          </div>
          {order.note && (
            <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-line">
              <dt className="text-ink-muted w-32">Customer note</dt>
              <dd className="flex-1 italic">{order.note}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Shipping form modal */}
      {shippingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !shippingLoading && setShippingOpen(false)}
        >
          <div
            className="bg-white border border-line max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-medium text-ink mb-4">
              Ship order {order.order_number}
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wide">Tracking number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage font-mono"
                disabled={shippingLoading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wide">Courier</label>
              <select
                value={courier}
                onChange={e => setCourier(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage"
                disabled={shippingLoading}
              >
                <option value="thailand-post">Thailand Post</option>
                <option value="kerry">Kerry Express</option>
                <option value="flash">Flash Express</option>
                <option value="jt">J&T Express</option>
                <option value="dhl">DHL Express</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmShip}
                disabled={shippingLoading || !trackingNumber.trim()}
                className="flex-1 py-2.5 bg-sage text-white text-sm font-heading hover:bg-sage-light disabled:opacity-50"
              >
                {shippingLoading ? 'Saving...' : 'Confirm shipping'}
              </button>
              <button
                onClick={() => setShippingOpen(false)}
                disabled={shippingLoading}
                className="px-4 py-2.5 border border-line text-ink-muted text-sm font-heading hover:border-sage disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !refundLoading && setRefundOpen(false)}
        >
          <div
            className="bg-white border border-line max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-medium text-ink mb-4">
              Refund order {order.order_number}
            </h2>
            <p className="text-sm text-ink-muted mb-4">
              Charged: <span className="font-heading text-bark">{formatOrderTotal(order)}</span>
            </p>

            <div className="mb-4">
              <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wide">Refund amount</label>
              <div className="flex">
                <span className="px-3 py-2 border border-line border-r-0 bg-parchment text-ink-muted font-heading">
                  {order.currency === 'THB' ? '฿' : '$'}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 border border-line bg-cream outline-none focus:border-sage font-mono"
                  placeholder={order.currency === 'THB' ? '0' : '0.00'}
                  disabled={refundLoading}
                />
              </div>
              <p className="text-[11px] text-ink-muted italic mt-1">Leave at full to refund the entire charge.</p>
            </div>

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
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-heading hover:bg-red-700 disabled:opacity-50"
              >
                {(() => {
                  if (refundLoading) return 'Refunding...'
                  const value = parseFloat(refundAmount) || 0
                  if (order.currency === 'THB') {
                    return `Confirm refund ฿${Math.round(value).toLocaleString()}`
                  }
                  return `Confirm refund $${value.toFixed(2)}`
                })()}
              </button>
              <button
                onClick={() => setRefundOpen(false)}
                disabled={refundLoading}
                className="px-4 py-2.5 border border-line text-ink-muted text-sm font-heading hover:border-sage disabled:opacity-50"
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
