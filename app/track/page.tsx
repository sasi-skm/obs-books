'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/components/layout/LanguageContext'
import { COURIERS, getCourierName } from '@/lib/tracking'
import { getRecentOrders, removeRecentOrder, RecentOrder } from '@/lib/recent-orders'
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
  const [recent, setRecent] = useState<RecentOrder[]>([])
  const autoSearched = useRef(false)

  // Load recent orders from localStorage — client-only.
  useEffect(() => {
    setRecent(getRecentOrders())
  }, [])

  const handleSelectRecent = (orderNumber: string) => {
    setOrderNum(orderNumber)
    // Trigger the search directly instead of waiting for the form submit.
    setLoading(true)
    setError('')
    setOrder(null)
    fetch(`/api/orders?order_number=${encodeURIComponent(orderNumber)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setOrder(data))
      .catch(() => setError(t('orderNotFound')))
      .finally(() => setLoading(false))
  }

  const handleRemoveRecent = (orderNumber: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentOrder(orderNumber)
    setRecent(getRecentOrders())
  }

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

        <form onSubmit={handleTrack} className="flex gap-2 mb-4">
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

        {/* Your Recent Orders — pulled from localStorage. Works for guests
            and logged-in users alike so anyone who checked out on this
            device can find their order without remembering the number. */}
        {recent.length > 0 && (
          <div className="mb-8 border border-line bg-parchment p-4">
            <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-3">
              {lang === 'th' ? 'คำสั่งซื้อล่าสุดของคุณ' : 'Your Recent Orders'}
            </p>
            <div className="space-y-1.5">
              {recent.map(r => (
                <button
                  key={r.orderNumber}
                  type="button"
                  onClick={() => handleSelectRecent(r.orderNumber)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-offwhite border border-line hover:border-sage transition-colors text-left group"
                >
                  <span className="font-heading text-sm text-sage group-hover:text-sage-light">
                    {r.orderNumber}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {r.currency === 'USD' ? '$' : '฿'}{r.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-ink-muted ml-auto hidden sm:inline">
                    {new Date(r.placedAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Remove"
                    onClick={(e) => handleRemoveRecent(r.orderNumber, e)}
                    className="text-ink-muted hover:text-rose text-sm ml-2 cursor-pointer"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-ink-muted italic mt-3">
              {lang === 'th'
                ? 'บันทึกในเบราว์เซอร์นี้เท่านั้น ไม่ได้อยู่บนเซิร์ฟเวอร์ของเรา'
                : 'Saved only on this browser — not on our servers.'}
            </p>
          </div>
        )}

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

            {/* Payment required — show QR / bank details + upload-slip CTA
                for any order that has not yet been paid or confirmed. */}
            {(order.payment_status === 'pending' || order.payment_status === 'uploaded') && order.order_status !== 'cancelled' && (
              <div
                className="mb-4 p-4 border"
                style={{
                  background: order.payment_status === 'uploaded' ? '#eef3ec' : '#fdf8f2',
                  borderColor: order.payment_status === 'uploaded' ? '#b8ccad' : '#e8c4b0',
                }}
              >
                {order.payment_status === 'uploaded' ? (
                  <div className="text-center">
                    <p className="text-sm font-heading mb-1" style={{ color: '#4a6741' }}>
                      {lang === 'th' ? '✓ ได้รับสลิปแล้ว' : '✓ Payment slip received'}
                    </p>
                    <p className="text-xs italic" style={{ color: '#6b5e48' }}>
                      {lang === 'th'
                        ? 'เรากำลังตรวจสอบการชำระเงินของคุณ คุณจะได้รับการยืนยันโดยเร็ว'
                        : 'We are reviewing your payment. You will receive confirmation shortly.'}
                    </p>
                    <Link
                      href={`/slip-upload/${order.order_number}`}
                      className="inline-block mt-3 text-[11px] px-4 py-1.5 border border-sage text-sage hover:bg-sage hover:text-offwhite transition-colors font-heading"
                    >
                      {lang === 'th' ? 'อัปโหลดสลิปใหม่' : 'Re-upload slip'}
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-widest mb-3 font-heading" style={{ color: '#9b4a2a' }}>
                      ⚠ {lang === 'th' ? 'รอการชำระเงิน' : 'Payment Required'}
                    </p>
                    {order.payment_method === 'promptpay' ? (
                      <div className="text-center">
                        <p className="text-xs text-ink-muted mb-1">{t('promptpayTitle')}</p>
                        <p className="text-xs text-ink-muted mb-1">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</p>
                        <p className="font-heading text-base font-semibold text-bark mb-3">
                          {t('promptpayAmount')}:{' '}
                          {order.currency === 'USD' ? '$' : '฿'}
                          {order.total_amount.toLocaleString()}
                        </p>
                        <Image
                          src="/images/promptpay-qr.jpg"
                          alt="PromptPay QR"
                          width={220}
                          height={220}
                          className="mx-auto mb-2"
                        />
                        <p className="text-[11px] text-ink-muted italic">{t('promptpayInstructions')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-cream border border-line">
                          <p className="text-xs font-heading mb-1">KBank / กสิกรไทย</p>
                          <p className="text-xs text-ink-muted">
                            {t('bankAccount')}: <span className="font-mono text-ink">021-3-24417-5</span>
                          </p>
                          <p className="text-xs text-ink-muted">
                            {t('bankHolder')}: <span className="text-ink">ศศิวิมล แก้วกมล</span>
                          </p>
                        </div>
                        <div className="p-3 bg-cream border border-line">
                          <p className="text-xs font-heading mb-1">Krungsri / กรุงศรี</p>
                          <p className="text-xs text-ink-muted">
                            {t('bankAccount')}: <span className="font-mono text-ink">719-1-26847-2</span>
                          </p>
                          <p className="text-xs text-ink-muted">
                            {t('bankHolder')}: <span className="text-ink">ศศิวิมล แก้วกมล</span>
                          </p>
                        </div>
                        <div className="text-center py-1">
                          <span className="text-xs text-ink-muted">{t('promptpayAmount')}: </span>
                          <span className="font-heading text-base font-bold text-bark">
                            {order.currency === 'USD' ? '$' : '฿'}
                            {order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: '#e8c4b0' }}>
                      <Link
                        href={`/slip-upload/${order.order_number}`}
                        className="inline-block font-heading text-xs px-5 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors"
                      >
                        📎 {lang === 'th' ? 'อัปโหลดสลิปการชำระเงิน' : 'Upload Payment Slip'}
                      </Link>
                      <p className="text-[11px] text-ink-muted italic mt-2">
                        {lang === 'th'
                          ? 'หลังจากชำระเงินแล้ว อัปโหลดภาพสลิปเพื่อให้เรายืนยันคำสั่งซื้อของคุณ'
                          : 'After paying, upload your slip so we can confirm your order.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

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
