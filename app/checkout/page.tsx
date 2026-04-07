'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'
import { useAuth } from '@/lib/AuthContext'
// promptpay-qr replaced with static QR image
import { getShippingRate, thbToUsd, SUPPORTED_COUNTRIES, DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'
import type { CartItem } from '@/types'

type Step = 'details' | 'payment' | 'done'

const THAI_PROVINCES = [
  'Bangkok', 'Amnat Charoen', 'Ang Thong', 'Bueng Kan', 'Buriram', 'Chachoengsao',
  'Chai Nat', 'Chaiyaphum', 'Chanthaburi', 'Chiang Mai', 'Chiang Rai', 'Chon Buri',
  'Chumphon', 'Kalasin', 'Kamphaeng Phet', 'Kanchanaburi', 'Khon Kaen', 'Krabi',
  'Lampang', 'Lamphun', 'Loei', 'Lopburi', 'Mae Hong Son', 'Maha Sarakham',
  'Mukdahan', 'Nakhon Nayok', 'Nakhon Pathom', 'Nakhon Phanom', 'Nakhon Ratchasima',
  'Nakhon Si Thammarat', 'Nakhon Sawan', 'Nan', 'Narathiwat', 'Nong Bua Lamphu',
  'Nong Khai', 'Nonthaburi', 'Pathum Thani', 'Pattani', 'Phang Nga', 'Phatthalung',
  'Phayao', 'Phetchabun', 'Phetchaburi', 'Phichit', 'Phitsanulok', 'Phuket', 'Phrae',
  'Prachinburi', 'Prachuap Khiri Khan', 'Ranong', 'Ratchaburi', 'Rayong', 'Roi Et',
  'Sa Kaeo', 'Sakon Nakhon', 'Samut Prakan', 'Samut Sakhon', 'Samut Songkhram',
  'Saraburi', 'Satun', 'Si Sa Ket', 'Sing Buri', 'Songkhla', 'Sukhothai',
  'Suphan Buri', 'Surat Thani', 'Surin', 'Tak', 'Trang', 'Trat', 'Ubon Ratchathani',
  'Udon Thani', 'Uthai Thani', 'Uttaradit', 'Yasothon', 'Yala',
  'Ayutthaya (Phra Nakhon Si Ayutthaya)',
]

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { lang, t } = useLang()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [guestDismissed, setGuestDismissed] = useState(false)
  const [pointsRedeemed, setPointsRedeemed] = useState(false)
  const [pointsDismissed, setPointsDismissed] = useState(false)
  const pointsDiscount = pointsRedeemed ? 50 : 0

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState<{ voucher_id: string; discount_amount: number; discount_percent: number; message: string } | null>(null)
  const [voucherError, setVoucherError] = useState('')
  const [applyingVoucher, setApplyingVoucher] = useState(false)

  // Subscriber discount
  const [hasActiveSub, setHasActiveSub] = useState(false)

  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    phone: '', email: '',
    addressLine1: '', addressLine2: '',
    city: '', province: '', postalCode: '',
    note: '', country: 'TH',
  })
  const [payMethod, setPayMethod] = useState<'promptpay' | 'transfer'>('promptpay')
  const [slipPreview, setSlipPreview] = useState<string>('')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [orderNumber, setOrderNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [snapshotItems, setSnapshotItems] = useState<CartItem[]>([])
  const [snapshotPayMethod, setSnapshotPayMethod] = useState<'promptpay' | 'transfer'>('promptpay')
  const [snapshotTotal, setSnapshotTotal] = useState(0)

  const isInternational = form.country !== 'TH'
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weight_grams || DEFAULT_BOOK_WEIGHT) * (i.quantity || 1), 0)
  const shippingUsd = isInternational ? getShippingRate(form.country, totalWeightGrams) : null
  const SUBSCRIBER_DISCOUNT_MIN = 1000
  const subscriberDiscountAmount = hasActiveSub && total >= SUBSCRIBER_DISCOUNT_MIN
    ? Math.floor(total * 0.05)
    : 0
  const voucherDiscount = voucherApplied?.discount_amount ?? 0
  // Use whichever is higher — subscriber or voucher, never both
  const bestDiscount = Math.max(voucherDiscount, subscriberDiscountAmount)
  const usingSubscriberDiscount = subscriberDiscountAmount > 0 && subscriberDiscountAmount >= voucherDiscount
  const effectiveTotal = Math.max(0, total - pointsDiscount - bestDiscount)
  const booksTotalUsd = isInternational ? thbToUsd(effectiveTotal) : null
  const grandTotalUsd = (booksTotalUsd !== null && shippingUsd !== null) ? booksTotalUsd + shippingUsd : null

  // Check active subscription
  useEffect(() => {
    if (!user) return
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .then(({ data }) => { if (data && data.length > 0) setHasActiveSub(true) })
    })
  }, [user])

  // Auto-fill from saved profile
  useEffect(() => {
    if (profile) {
      const nameParts = (profile.full_name || '').trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        phone: prev.phone || profile.phone || '',
        email: prev.email || user?.email || '',
        addressLine1: prev.addressLine1 || profile.shipping_address?.address || '',
        country: prev.country !== 'TH' ? prev.country : (profile.shipping_address?.country || 'TH'),
      }))
    } else if (user?.email) {
      setForm(prev => ({ ...prev, email: prev.email || user.email || '' }))
    }
  }, [profile, user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === 'payment' && payMethod === 'promptpay' && effectiveTotal > 0) {
      // static QR image used instead of generated QR
    }
  }, [step, payMethod, effectiveTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setApplyingVoucher(true)
    setVoucherError('')
    try {
      const email = form.email || user?.email || ''
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, email, order_total: total }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVoucherError(data.error || 'Invalid voucher')
        setVoucherApplied(null)
      } else {
        setVoucherApplied(data)
        setVoucherError('')
      }
    } catch {
      setVoucherError('Could not apply voucher')
    }
    setApplyingVoucher(false)
  }

  const buildShippingAddress = () => {
    const lines = [form.addressLine1]
    if (form.addressLine2) lines.push(form.addressLine2)
    const cityLine = [form.city, form.province, form.postalCode].filter(Boolean).join(', ')
    if (cityLine) lines.push(cityLine)
    return lines.join('\n')
  }

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.phone || !form.addressLine1 || !form.city) return
    setStep('payment')
  }

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSlipFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setSlipPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePlaceOrder = async () => {
    setSubmitting(true)
    try {
      // Upload payment slip if provided
      let slipUrl = ''
      if (slipFile) {
        const fd = new FormData()
        fd.append('file', slipFile)
        fd.append('bucket', 'payment-slips')
        try {
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            slipUrl = uploadData.url || ''
          }
        } catch {}
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: [form.firstName, form.lastName].filter(Boolean).join(' '),
          customer_phone: form.phone,
          customer_email: form.email,
          shipping_address: buildShippingAddress(),
          payment_method: payMethod,
          note: form.note,
          slip_url: slipUrl || null,
          destination_country: form.country,
          currency: isInternational ? 'USD' : 'THB',
          user_id: user?.id || null,
          redeem_points: pointsRedeemed,
          items: items.map(i => ({
            book_id: i.bookId || i.id.split('-')[0],
            title: i.title,
            author: i.author,
            price: i.price,
            image_url: i.image_url,
            condition: i.condition,
            quantity: i.quantity || 1,
          })),
          total_amount: effectiveTotal,
          voucher_id: (voucherApplied && !usingSubscriberDiscount) ? voucherApplied.voucher_id : null,
          voucher_email: (voucherApplied && !usingSubscriberDiscount) ? (form.email || user?.email || '') : null,
          subscriber_discount_applied: usingSubscriberDiscount,
          subscriber_discount_amount: usingSubscriberDiscount ? subscriberDiscountAmount : 0,
        }),
      })
      const data = await res.json()
      setOrderNumber(data.order_number || 'OBS-' + Date.now().toString(36).toUpperCase())
      setSnapshotItems([...items])
      setSnapshotPayMethod(payMethod)
      setSnapshotTotal(effectiveTotal)
      clearCart()
      setStep('done')
    } catch {
      setOrderNumber('OBS-' + Date.now().toString(36).toUpperCase())
      setSnapshotItems([...items])
      setSnapshotPayMethod(payMethod)
      setSnapshotTotal(effectiveTotal)
      clearCart()
      setStep('done')
    }
    setSubmitting(false)
  }

  if (items.length === 0 && step !== 'done') {
    return (
      <div className="pt-24 pb-16 px-6 text-center min-h-screen">
        <p className="text-3xl mb-4">🌿</p>
        <p className="text-ink-muted italic mb-6">{t('cartEmpty')}</p>
        <Link href="/shop" className="font-heading text-sm px-6 py-2.5 border border-sage text-sage hover:bg-sage hover:text-offwhite transition-colors">
          {t('browse')}
        </Link>
      </div>
    )
  }

  // Success state
  if (step === 'done') {
    return (
      <div className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-4xl mb-4">✿</p>
            <h1 className="font-heading text-2xl font-normal text-sage mb-2">{t('orderDone')}</h1>
            <p className="text-sm text-ink-light mb-1">{t('orderRef')}</p>
            <p className="font-heading text-2xl font-bold text-sage my-2">{orderNumber}</p>
            <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">{t('orderConfirmed')}</p>
          </div>

          {/* Items ordered */}
          {snapshotItems.length > 0 && (
            <div className="mb-6 border border-line bg-cream p-4">
              <p className="font-heading text-sm mb-3 text-ink-muted uppercase tracking-wide">Your Order</p>
              <div className="space-y-3">
                {snapshotItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 relative border border-sand overflow-hidden">
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-sm font-semibold truncate">{item.title}</p>
                      <p className="font-jost text-xs text-ink-muted italic">{item.author}</p>
                      {item.condition && (
                        <p className="font-jost text-[10px] text-sage uppercase tracking-wider">{item.condition}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading text-sm font-semibold text-bark">฿{(item.price * item.quantity).toLocaleString()}</p>
                      {item.quantity > 1 && (
                        <p className="font-jost text-[10px] text-ink-muted">x{item.quantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-heading text-base font-semibold pt-3 mt-3 border-t border-line">
                <span>{t('total')}</span>
                <span className="text-bark">฿{snapshotTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment instructions */}
          {snapshotPayMethod === 'promptpay' ? (
            <div className="mb-6 border border-line bg-offwhite p-5 text-center">
              <p className="font-heading text-base mb-1">{t('promptpayTitle')}</p>
              <p className="text-sm text-ink-muted mb-1">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</p>
              <p className="text-sm text-ink-muted mb-4">
                {t('promptpayAmount')}: <span className="font-bold text-bark">฿{snapshotTotal.toLocaleString()}</span>
              </p>
              <Image src="/images/promptpay-qr.jpg" alt="PromptPay QR" width={260} height={260} className="mx-auto mb-3" />
              <p className="text-xs text-ink-muted">{t('promptpayInstructions')}</p>
              <p className="text-xs text-ink-muted mt-2 italic">{t('paymentInstructions')}</p>
            </div>
          ) : (
            <div className="mb-6 space-y-3">
              <p className="font-heading text-sm text-ink-muted uppercase tracking-wide mb-1">Payment Details</p>
              <div className="p-4 border border-line bg-offwhite">
                <h3 className="font-heading text-sm mb-2">KBank / กสิกรไทย</h3>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">{t('bankAccount')}:</span>
                    <span className="font-medium font-mono">021-3-24417-5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">{t('bankHolder')}:</span>
                    <span className="font-medium">ศศิวิมล แก้วกมล</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-line bg-offwhite">
                <h3 className="font-heading text-sm mb-2">Krungsri / กรุงศรี</h3>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">{t('bankAccount')}:</span>
                    <span className="font-medium font-mono">719-1-26847-2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">{t('bankHolder')}:</span>
                    <span className="font-medium">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-sage/5 border border-sage/20 text-center">
                <span className="text-sm text-ink-light">{t('promptpayAmount')}: </span>
                <span className="font-heading text-xl font-bold text-bark">฿{snapshotTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-rose font-semibold text-center">Please send your payment slip to confirm your order.</p>
            </div>
          )}

          <div className="mt-4 mb-5 px-4 py-3 bg-parchment border border-sand text-xs text-ink-muted font-jost text-center leading-relaxed">
            📦 {t('shippingNote')}
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/shop" className="font-heading text-sm px-6 py-2.5 border border-sage text-sage hover:bg-sage hover:text-offwhite transition-colors">
              {t('continueBrowse')}
            </Link>
            <Link href="/track" className="font-heading text-sm px-6 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors">
              {t('trackOrder')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-2xl font-normal mb-1">{t('checkoutTitle')}</h1>
        <p className="text-sm text-ink-muted mb-6">{t('checkoutSub')}</p>

        {/* Order summary */}
        <div className="border border-line p-4 mb-6 bg-cream">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm mb-1 text-ink-light">
              <span className="truncate mr-4">
                {item.title}
                {item.condition && <span className="text-xs text-sage ml-1">({item.condition})</span>}
              </span>
              <span className="flex-shrink-0">
                {isInternational ? `$${thbToUsd(item.price).toFixed(2)}` : `฿${item.price.toLocaleString()}`}
              </span>
            </div>
          ))}
          {isInternational && shippingUsd !== null && (
            <div className="flex justify-between text-sm mb-1 text-ink-light pt-1 border-t border-line/50 mt-1">
              <span>{t('shippingEstimate')}</span>
              <span className="flex-shrink-0">${shippingUsd.toFixed(2)} USD</span>
            </div>
          )}
          {pointsRedeemed && (
            <div className="flex justify-between text-sm mb-1 pt-1 border-t border-line/50 mt-1" style={{ color: '#3a5832' }}>
              <span>Points discount (100 pts)</span>
              <span className="flex-shrink-0">-฿50</span>
            </div>
          )}
          {usingSubscriberDiscount && (
            <div className="flex justify-between text-sm mb-1 pt-1 border-t border-line/50 mt-1" style={{ color: '#3a5832' }}>
              <span>✦ Subscriber discount (5% off)</span>
              <span className="flex-shrink-0">-฿{subscriberDiscountAmount.toLocaleString()}</span>
            </div>
          )}
          {voucherApplied && !usingSubscriberDiscount && (
            <div className="flex justify-between text-sm mb-1 pt-1 border-t border-line/50 mt-1" style={{ color: '#3a5832' }}>
              <span>Voucher ({voucherApplied.discount_percent}% off)</span>
              <span className="flex-shrink-0">-฿{voucherApplied.discount_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-heading text-base font-semibold pt-2 mt-2 border-t border-line">
            <span>{t('total')}</span>
            <span>
              {isInternational && grandTotalUsd !== null
                ? `$${grandTotalUsd.toFixed(2)} USD`
                : `฿${effectiveTotal.toLocaleString()}`}
            </span>
          </div>
          {isInternational && (
            <p className="text-xs text-ink-muted mt-2 italic">{t('internationalNote')}</p>
          )}
        </div>

        {/* Guest sign-in / sign-up prompt */}
        {step === 'details' && !user && !guestDismissed && (
          <div className="mb-5 px-4 py-4 bg-parchment border border-sand rounded-sm">
            <p className="font-jost text-sm font-semibold text-ink mb-1">
              🌿 Create a free account and earn 50 points
            </p>
            <p className="font-jost text-xs text-bark mb-3">
              100 points = ฿50 off your next order. Plus save your order history and wishlist.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => router.push('/signup?redirect=checkout')}
                className="px-4 py-1.5 bg-moss text-cream font-jost text-xs rounded-sm hover:opacity-90"
              >
                Sign Up
              </button>
              <button
                onClick={() => setGuestDismissed(true)}
                className="px-4 py-1.5 border border-sand text-bark font-jost text-xs rounded-sm hover:border-moss hover:text-moss transition-colors"
              >
                Continue as Guest
              </button>
            </div>
            <p className="font-jost text-xs text-ink-muted">
              Already have an account?{' '}
              <button onClick={() => router.push('/login?redirect=checkout')} className="text-moss underline underline-offset-2">
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* Points redemption box */}
        {step === 'details' && user && (profile?.points_balance || 0) >= 100 && !pointsDismissed && !pointsRedeemed && (
          <div className="mb-5 px-4 py-3 bg-parchment border border-sand rounded-sm">
            <p className="font-jost text-sm text-bark mb-2">
              You have <span className="font-semibold text-moss">{profile?.points_balance} points</span> — redeem 100 points for a ฿50 discount?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPointsRedeemed(true)}
                className="px-3 py-1.5 bg-moss text-cream font-jost text-xs rounded-sm hover:opacity-90"
              >
                Yes, apply ฿50 discount
              </button>
              <button
                onClick={() => setPointsDismissed(true)}
                className="px-3 py-1.5 border border-sand text-bark font-jost text-xs rounded-sm hover:border-moss hover:text-moss transition-colors"
              >
                No thanks, save for later
              </button>
            </div>
          </div>
        )}
        {step === 'details' && pointsRedeemed && (
          <div className="mb-5 px-4 py-2 rounded-sm font-jost text-xs" style={{ background: '#eef3ec', color: '#3a5832' }}>
            ✓ ฿50 discount applied (100 points)
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails}>
            {/* Country */}
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('destinationCountry')} *</label>
              <select
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value, province: '' })}
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code === 'TH' && lang === 'th' ? c.nameLocal : c.name}
                    {c.code === 'TH' ? (lang === 'en' ? ' (Free shipping)' : '') : ''}
                  </option>
                ))}
              </select>
              {isInternational && shippingUsd !== null && (
                <p className="text-xs text-sage mt-1">
                  {t('shippingEstimate')}: ${shippingUsd.toFixed(2)} USD (DHL Express)
                </p>
              )}
            </div>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block font-heading text-sm mb-1">First Name *</label>
                <input
                  className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-heading text-sm mb-1">Last Name</label>
                <input
                  className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('address')} *</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                placeholder="House no., street, soi"
                value={form.addressLine1}
                onChange={e => setForm({ ...form, addressLine1: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                placeholder="Apartment, suite, building (optional)"
                value={form.addressLine2}
                onChange={e => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>

            {/* City / Province / Postal code */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block font-heading text-sm mb-1">City *</label>
                <input
                  className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  placeholder="City"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-heading text-sm mb-1">Province</label>
                {!isInternational ? (
                  <select
                    className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                    value={form.province}
                    onChange={e => setForm({ ...form, province: e.target.value })}
                  >
                    <option value="">Province</option>
                    {THAI_PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                    placeholder="State / Region"
                    value={form.province}
                    onChange={e => setForm({ ...form, province: e.target.value })}
                  />
                )}
              </div>
              <div>
                <label className="block font-heading text-sm mb-1">Postal Code</label>
                <input
                  className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  placeholder="10xxx"
                  value={form.postalCode}
                  onChange={e => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('phone')} *</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                placeholder="08x-xxx-xxxx"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('email')}</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('note')}</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>
            {/* Voucher code */}
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Voucher Code</label>
              {voucherApplied ? (
                <div className="flex items-center justify-between px-3 py-2.5 border border-line rounded-sm" style={{ background: '#eef3ec' }}>
                  <span className="font-jost text-sm" style={{ color: '#3a5832' }}>
                    ✓ {voucherApplied.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setVoucherApplied(null); setVoucherCode('') }}
                    className="font-jost text-xs text-ink-muted underline underline-offset-2 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2.5 border border-line bg-cream font-mono text-sm uppercase outline-none focus:border-sage"
                    placeholder="Enter code"
                    value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher || !voucherCode.trim()}
                    className="px-4 py-2.5 border border-sage text-sage font-heading text-sm hover:bg-sage hover:text-offwhite transition-colors disabled:opacity-50"
                  >
                    {applyingVoucher ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {voucherError && <p className="font-jost text-xs mt-1" style={{ color: '#9b4a2a' }}>{voucherError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors"
            >
              {t('checkout')}
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div>
            {/* Payment method selector */}
            <div className="mb-6">
              <label className="block font-heading text-sm mb-2">{t('payMethod')}</label>
              <div className="flex flex-col gap-2">
                {(['promptpay', 'transfer'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPayMethod(method)}
                    className={`flex items-center gap-3 px-4 py-3 border transition-all ${
                      payMethod === method ? 'border-sage bg-sage-muted' : 'border-line bg-cream'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      payMethod === method ? 'border-sage' : 'border-ink-muted'
                    }`}>
                      {payMethod === method && <div className="w-[7px] h-[7px] rounded-full bg-sage" />}
                    </div>
                    <span className="font-heading text-sm">{t(method === 'promptpay' ? 'promptpay' : 'bankTransfer')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PromptPay QR */}
            {payMethod === 'promptpay' && (
              <div className="text-center mb-6 p-6 border border-line bg-offwhite">
                <h3 className="font-heading text-base mb-1">{t('promptpayTitle')}</h3>
                <p className="text-sm text-ink-muted mb-1">
                  ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)
                </p>
                <p className="text-sm text-ink-muted mb-4">
                  {t('promptpayAmount')}: <span className="font-bold text-bark">฿{effectiveTotal.toLocaleString()}</span>
                </p>
                <Image src="/images/promptpay-qr.jpg" alt="PromptPay QR" width={280} height={280} className="mx-auto mb-3" />
                <p className="text-xs text-ink-muted">{t('promptpayInstructions')}</p>
              </div>
            )}

            {/* Bank Transfer */}
            {payMethod === 'transfer' && (
              <div className="mb-6 space-y-4">
                {/* KBank */}
                <div className="p-5 border border-line bg-offwhite">
                  <h3 className="font-heading text-base mb-3">
                    {t('bankTitle')} - KBank / กสิกรไทย
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t('bankAccount')}:</span>
                      <span className="font-medium font-mono">021-3-24417-5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t('bankHolder')}:</span>
                      <span className="font-medium">ศศิวิมล แก้วกมล</span>
                    </div>
                  </div>
                </div>

                {/* Krungsri */}
                <div className="p-5 border border-line bg-offwhite">
                  <h3 className="font-heading text-base mb-3">
                    {t('bankTitle')} - Krungsri / กรุงศรี
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t('bankAccount')}:</span>
                      <span className="font-medium font-mono">719-1-26847-2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t('bankHolder')}:</span>
                      <span className="font-medium">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="p-4 bg-sage/5 border border-sage/20 text-center">
                  <span className="text-sm text-ink-light">{t('promptpayAmount')}: </span>
                  <span className="font-heading text-xl font-bold text-bark">฿{effectiveTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Slip Upload */}
            <div className="mb-6">
              <label className="block font-heading text-sm mb-2">{t('slip')}</label>
              <label className="block border-2 border-dashed border-line p-6 text-center cursor-pointer hover:border-sage transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSlipUpload}
                />
                {slipPreview ? (
                  <div className="max-w-[200px] mx-auto">
                    <Image src={slipPreview} alt="Payment slip" width={200} height={300} className="w-full border border-line" />
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">📎 {t('slipClick')}</p>
                )}
              </label>
              <p className="text-xs text-ink-muted mt-1">{t('slipLater')}</p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t('placeOrder')}
            </button>
            <p className="text-xs text-ink-muted text-center mt-3">
              📦 {t('shippedMonday')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
