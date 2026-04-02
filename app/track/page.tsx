'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/components/layout/LanguageContext'
import { COURIERS, getCourierName } from '@/lib/tracking'
import { Order } from '@/types'

const STATUS_STEPS = [
  { key: 'new', icon: '📋' },
  { key: 'paid', icon: '💰' },
  { key: 'packing', icon: '📦' },
  { key: 'shipped', icon: '🚚' },
  { key: 'delivered', icon: '✅' },
]

export default function TrackPage() {
  const { lang, t } = useLang()
  const [orderNum, setOrderNum] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm ${
                      isActive ? 'bg-sage text-white' : 'bg-parchment text-ink-muted'
                    }`}>
                      {step.icon}
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
