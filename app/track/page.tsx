'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/components/layout/LanguageContext'
import { COURIERS, getCourierName } from '@/lib/tracking'
import { Order } from '@/types'

interface TrackingEvent {
  datetime: string
  location: string
  status: string
  description: string
}

const STATUS_STEPS = [
  { key: 'new' },
  { key: 'paid' },
  { key: 'packing' },
  { key: 'shipped' },
  { key: 'delivered' },
]

export default function TrackPage() {
  return <Suspense><TrackPageInner /></Suspense>
}

function TrackPageInner() {
  const { lang, t } = useLang()
  const searchParams = useSearchParams()
  const [orderNum, setOrderNum] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trackEvents, setTrackEvents] = useState<TrackingEvent[]>([])
  const autoSearched = useRef(false)

  // Auto-fill and search if order number is in URL
  useEffect(() => {
    const param = searchParams.get('order')
    if (param && !autoSearched.current) {
      autoSearched.current = true
      setOrderNum(param)
      setLoading(true)
      setError('')
      fetch(`/api/orders?order_number=${encodeURIComponent(param)}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(data => setOrder(data))
        .catch(() => setError(t('orderNotFound')))
        .finally(() => setLoading(false))
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (order?.tracking_number && order?.courier === 'thailand-post') {
      fetch(`/api/tracking?tracking_number=${encodeURIComponent(order.tracking_number)}`)
        .then(r => r.json())
        .then(data => setTrackEvents(data.events || []))
        .catch(() => {})
    }
  }, [order?.tracking_number, order?.courier])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNum.trim()) return

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders?order_number=${encodeURIComponent(orderNum.trim())}`)
      if (!res.ok) {
        setError(t('orderNotFound'))
        return
      }
      const data = await res.json()
      setOrder(data)
    } catch {
      setError(t('orderNotFound'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status: string) => STATUS_STEPS.findIndex(s => s.key === status)

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="font-heading text-sm text-ink-muted hover:text-sage mb-6 inline-block">
          {t('backHome')}
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-normal">{t('trackTitle')}</h1>
          <div className="divider divider-cream" />
          <p className="text-sm text-ink-muted italic mt-2">{t('trackSub')}</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder={t('trackPlaceholder')}
            value={orderNum}
            onChange={e => setOrderNum(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('trackBtn')}
          </button>
        </form>

        {error && (
          <div className="text-center py-8">
            <p className="text-ink-muted italic">{error}</p>
          </div>
        )}

        {order && (
          <div className="border border-line bg-offwhite p-6">
            <div className="text-center mb-6">
              <p className="text-xs text-ink-muted">{t('orderRef')}</p>
              <p className="font-heading text-xl font-bold text-sage">{order.order_number}</p>
            </div>

            {/* Status timeline */}
            <div className="flex justify-between items-center mb-8 relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-line" />
              {STATUS_STEPS.map((step, i) => {
                const currentIdx = getStatusIndex(order.order_status)
                const isActive = i <= currentIdx
                return (
                  <div key={step.key} className="relative z-10 text-center flex-1">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                      isActive ? 'bg-sage text-white' : 'bg-parchment border-2 border-line text-ink-muted'
                    }`}>
                      {isActive ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <p className={`text-[0.65rem] mt-1 ${isActive ? 'text-sage font-medium' : 'text-ink-muted'}`}>
                      {t(`status${step.key.charAt(0).toUpperCase() + step.key.slice(1)}`)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Tracking info */}
            {order.tracking_number && order.courier && (
              <div className="border border-line p-4 bg-cream mb-4">
                <p className="text-sm font-heading mb-1">
                  {getCourierName(order.courier, lang)}
                </p>
                <p className="font-mono text-sm text-bark font-semibold mb-2">{order.tracking_number}</p>
                <a
                  href={COURIERS[order.courier]?.trackUrl(order.tracking_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sage hover:text-sage-light underline"
                >
                  {lang === 'th' ? 'ติดตามพัสดุ' : 'Track on carrier website'} →
                </a>
              </div>
            )}

            {/* Real-time tracking events */}
            {trackEvents.length > 0 && (
              <div className="border border-line p-4 bg-cream mb-4">
                <p className="text-sm font-heading mb-3">{t('realTimeTracking')}</p>
                <div className="space-y-3">
                  {trackEvents.map((event, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-sage' : 'bg-line'}`} />
                        {i < trackEvents.length - 1 && <div className="w-px flex-1 bg-line mt-1" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-ink-light font-medium">{event.description}</p>
                        {event.location && <p className="text-ink-muted">{event.location}</p>}
                        <p className="text-ink-muted">{event.datetime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <div className="border-t border-line pt-4">
                <p className="font-heading text-sm mb-2">{lang === 'th' ? 'รายการสินค้า' : 'Items'}</p>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-ink-light mb-1">
                    <span>{item.title}</span>
                    <span>฿{item.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-heading text-base font-semibold pt-2 mt-2 border-t border-line">
                  <span>{t('total')}</span>
                  <span>฿{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
