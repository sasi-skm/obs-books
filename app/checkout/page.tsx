'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'
import { generatePromptPayQR } from '@/lib/promptpay'
import { getShippingRate, thbToUsd, SUPPORTED_COUNTRIES, DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'

type Step = 'details' | 'payment' | 'done'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { lang, t } = useLang()

  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', note: '', country: 'TH' })
  const [payMethod, setPayMethod] = useState<'promptpay' | 'transfer'>('promptpay')
  const [qrCode, setQrCode] = useState<string>('')
  const [slipPreview, setSlipPreview] = useState<string>('')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [orderNumber, setOrderNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isInternational = form.country !== 'TH'
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weight_grams || DEFAULT_BOOK_WEIGHT), 0)
  const shippingUsd = isInternational ? getShippingRate(form.country, totalWeightGrams) : null
  const booksTotalUsd = isInternational ? thbToUsd(total) : null
  const grandTotalUsd = (booksTotalUsd !== null && shippingUsd !== null) ? booksTotalUsd + shippingUsd : null

  useEffect(() => {
    if (step === 'payment' && payMethod === 'promptpay' && total > 0) {
      generatePromptPayQR(total).then(setQrCode).catch(() => {})
    }
  }, [step, payMethod, total])

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address) return
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
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          shipping_address: form.address,
          payment_method: payMethod,
          note: form.note,
          slip_url: slipUrl || null,
          destination_country: form.country,
          currency: isInternational ? 'USD' : 'THB',
          items: items.map(i => ({
            book_id: i.bookId || i.id.split('-')[0],
            title: i.title,
            author: i.author,
            price: i.price,
            image_url: i.image_url,
            condition: i.condition,
          })),
          total_amount: total,
        }),
      })
      const data = await res.json()
      setOrderNumber(data.order_number || 'OBS-' + Date.now().toString(36).toUpperCase())
      clearCart()
      setStep('done')
    } catch {
      setOrderNumber('OBS-' + Date.now().toString(36).toUpperCase())
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
      <div className="pt-24 pb-16 px-6 text-center min-h-screen">
        <div className="max-w-md mx-auto">
          <p className="text-4xl mb-4">✿</p>
          <h1 className="font-heading text-2xl font-normal text-sage mb-2">{t('orderDone')}</h1>
          <p className="text-sm text-ink-light mb-1">{t('orderRef')}</p>
          <p className="font-heading text-2xl font-bold text-sage my-3">{orderNumber}</p>
          <p className="text-sm text-ink-light mb-2">{t('orderSave')}</p>
          {!slipPreview && (
            <p className="text-sm text-rose mt-3">{t('orderPay')}</p>
          )}
          <div className="flex gap-3 justify-center mt-6">
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
          <div className="flex justify-between font-heading text-base font-semibold pt-2 mt-2 border-t border-line">
            <span>{t('total')}</span>
            <span>
              {isInternational && grandTotalUsd !== null
                ? `$${grandTotalUsd.toFixed(2)} USD`
                : `฿${total.toLocaleString()}`}
            </span>
          </div>
          {isInternational && (
            <p className="text-xs text-ink-muted mt-2 italic">{t('internationalNote')}</p>
          )}
        </div>

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails}>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('name')} *</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
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
              <label className="block font-heading text-sm mb-1">{t('address')} *</label>
              <textarea
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[80px] resize-y"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('destinationCountry')} *</label>
              <select
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
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
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">{t('note')}</label>
              <input
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
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
                  {t('promptpayAmount')}: <span className="font-bold text-bark">฿{total.toLocaleString()}</span>
                </p>
                {qrCode ? (
                  <Image src={qrCode} alt="PromptPay QR" width={280} height={280} className="mx-auto mb-3" />
                ) : (
                  <div className="w-[280px] h-[280px] mx-auto mb-3 bg-parchment flex items-center justify-center text-ink-muted text-sm italic">
                    {lang === 'th' ? 'กำลังสร้าง QR...' : 'Generating QR...'}
                  </div>
                )}
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
                  <span className="font-heading text-xl font-bold text-bark">฿{total.toLocaleString()}</span>
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
