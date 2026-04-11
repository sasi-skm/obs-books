'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PaymentCountdown from '@/components/storefront/PaymentCountdown'
import { useLang } from '@/components/layout/LanguageContext'

interface OrderSummary {
  order_number: string
  total_amount: number
  payment_method: 'promptpay' | 'transfer'
  payment_status: 'pending' | 'uploaded' | 'confirmed'
  currency?: 'THB' | 'USD'
  created_at?: string
  order_status?: string
}

export default function SlipUploadClient({ orderNumber }: { orderNumber: string }) {
  const { t } = useLang()
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [done, setDone] = useState(false)

  // Look up the order (minimal fields) so the customer can confirm they
  // have the right reference before uploading.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/lookup?order_number=${encodeURIComponent(orderNumber)}`)
        if (cancelled) return
        if (!res.ok) {
          setNotFound(true)
        } else {
          const data = await res.json()
          setOrder(data)
          if (data.payment_status === 'confirmed') {
            setDone(true) // already confirmed, nothing to do
          }
        }
      } catch {
        if (!cancelled) setNotFound(true)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [orderNumber])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadError('')
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5 MB.')
      return
    }
    if (!f.type.startsWith('image/')) {
      setUploadError('Please upload an image file.')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('order_number', orderNumber)
      const res = await fetch('/api/upload-slip', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed. Please try again.')
      } else {
        setDone(true)
        if (order) setOrder({ ...order, payment_status: 'uploaded' })
      }
    } catch (err) {
      console.error('[slip-upload] failed:', err)
      setUploadError('Network error. Please try again.')
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 px-6 min-h-screen bg-cream">
        <p className="text-center text-ink-muted italic">Loading...</p>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="pt-24 pb-16 px-6 min-h-screen bg-cream">
        <div className="max-w-md mx-auto text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h1 className="font-heading text-2xl text-ink mb-2">Order not found</h1>
          <p className="text-sm text-ink-muted italic mb-6">
            We couldn&apos;t find an order with reference <span className="font-mono">{orderNumber}</span>.
            Please double-check your order confirmation email.
          </p>
          <Link
            href="/"
            className="inline-block font-heading text-sm px-5 py-2.5 border border-moss text-moss hover:bg-moss hover:text-cream transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen bg-cream">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Upload Payment Slip</p>
          <h1 className="font-heading text-2xl text-ink">{order.order_number}</h1>
          <p className="font-heading text-sm text-bark mt-1">
            {order.currency === 'USD' ? '$' : '฿'}
            {order.total_amount.toLocaleString()}
          </p>
        </div>

        {done ? (
          <div className="border border-sand p-6 bg-offwhite text-center">
            <p className="text-3xl mb-3">🌿</p>
            <p className="font-heading text-lg text-ink mb-2">
              {order.payment_status === 'confirmed' ? 'Order already confirmed' : 'Slip received'}
            </p>
            <p className="text-sm text-ink-muted italic mb-6">
              {order.payment_status === 'confirmed'
                ? 'Your payment has been confirmed. We are preparing your books.'
                : 'Thank you! We will review your payment slip and confirm your order shortly. You will receive an email once it is confirmed.'}
            </p>
            <Link
              href="/"
              className="inline-block font-heading text-sm px-5 py-2.5 border border-moss text-moss hover:bg-moss hover:text-cream transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="border border-sand p-6 bg-offwhite">
            {order.created_at && order.payment_status === 'pending' && (
              <div className="mb-4">
                <PaymentCountdown createdAt={order.created_at} />
                <p className="text-[11px] text-ink-muted italic mt-2 leading-snug text-center">
                  {t('pay24hBody')}
                </p>
              </div>
            )}
            <p className="text-sm text-ink-muted mb-4">
              After paying via {order.payment_method === 'promptpay' ? 'PromptPay' : 'bank transfer'},
              upload a screenshot of your payment confirmation so we can confirm your order.
            </p>

            <label className="block border border-dashed border-line p-6 text-center cursor-pointer hover:border-moss transition-colors bg-cream mb-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {preview ? (
                <div className="max-w-[200px] mx-auto">
                  <Image src={preview} alt="Slip preview" width={200} height={280} className="w-full border border-sand" />
                  <p className="text-xs text-ink-muted mt-2">Tap to change</p>
                </div>
              ) : (
                <>
                  <p className="text-2xl mb-2">📎</p>
                  <p className="font-heading text-sm text-ink">Tap to select slip</p>
                  <p className="text-xs text-ink-muted mt-1">JPG, PNG, or WebP — max 5 MB</p>
                </>
              )}
            </label>

            {uploadError && (
              <p className="text-xs text-rose mb-3">{uploadError}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 bg-moss text-cream font-heading text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Submit Slip'}
            </button>

            <p className="text-[11px] text-ink-muted italic text-center mt-4">
              Having trouble? DM us on Instagram @obs_books with your order number.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
