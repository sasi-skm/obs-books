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
import {
  getSavedAddress,
  saveAddress,
  shippingJsonToSaved,
  savedToShippingJson,
} from '@/lib/saved-address'
import { addRecentOrder } from '@/lib/recent-orders'
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

  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    phone: '', email: '',
    addressLine1: '', addressLine2: '',
    city: '', province: '', postalCode: '',
    note: '', country: 'TH',
  })
  const [payMethod, setPayMethod] = useState<'promptpay' | 'transfer' | 'stripe'>('promptpay')
  const [slipPreview, setSlipPreview] = useState<string>('')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [orderNumber, setOrderNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Stripe redirect state — card-payment path (international or TH-domestic)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const [placeOrderError, setPlaceOrderError] = useState('')
  const [snapshotItems, setSnapshotItems] = useState<CartItem[]>([])
  const [snapshotPayMethod, setSnapshotPayMethod] = useState<'promptpay' | 'transfer' | 'stripe'>('promptpay')
  const [snapshotTotal, setSnapshotTotal] = useState(0)
  const [slipUploadWarning, setSlipUploadWarning] = useState<string>('')
  const [copied, setCopied] = useState(false)
  // Server-quoted transfer amount for PromptPay / bank transfer. The
  // customer types this number into their bank app BEFORE the order
  // exists, so it must come from the server's pricing (voucher validity,
  // points eligibility, current book prices), never from client math.
  const [serverQuote, setServerQuote] = useState<{ total: number; voucher_discount: number; points_discount: number } | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(false)
  const [mismatchNotice, setMismatchNotice] = useState(false)

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (old browser / insecure context)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const isInternational = form.country !== 'TH'
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weight_grams || DEFAULT_BOOK_WEIGHT) * (i.quantity || 1), 0)
  const shippingUsd = isInternational ? getShippingRate(form.country, totalWeightGrams) : null
  const voucherDiscount = voucherApplied?.discount_amount ?? 0
  const bestDiscount = voucherDiscount
  const effectiveTotal = Math.max(0, total - pointsDiscount - bestDiscount)
  const booksTotalUsd = isInternational ? thbToUsd(effectiveTotal) : null
  const grandTotalUsd = (booksTotalUsd !== null && shippingUsd !== null) ? booksTotalUsd + shippingUsd : null
  // TH customers who pick Card go through Stripe, but discounts (voucher,
  // points) currently don't apply to Stripe orders. When they're on the
  // payment step with Card selected, show full prices in the summary so
  // the displayed total matches what Stripe will charge.
  const showDiscountsInSummary = !(step === 'payment' && payMethod === 'stripe' && !isInternational)
  const hasActiveDiscount = voucherApplied !== null || pointsRedeemed

  // Auto-fill from whatever source we have. Priority:
  //   1. What the user has already typed in this session (never overwrite)
  //   2. The logged-in profile (if authenticated) — full shipping address
  //   3. localStorage (works for guests and as a device-local cache for
  //      logged-in users on a new device before profile loads)
  // We ONLY fill empty fields, never overwrite the user's current input.
  useEffect(() => {
    const guestSaved = getSavedAddress() || {}
    const profileSaved = profile ? shippingJsonToSaved(profile.shipping_address) : {}

    // For name/phone/email on logged-in users, pull from profile row + auth user
    const nameParts = (profile?.full_name || '').trim().split(' ')
    const profileFirstName = nameParts[0] || ''
    const profileLastName = nameParts.slice(1).join(' ') || ''

    setForm(prev => ({
      ...prev,
      firstName: prev.firstName || profileFirstName || guestSaved.firstName || '',
      lastName: prev.lastName || profileLastName || guestSaved.lastName || '',
      phone: prev.phone || profile?.phone || guestSaved.phone || '',
      email: prev.email || user?.email || guestSaved.email || '',
      addressLine1: prev.addressLine1 || profileSaved.addressLine1 || guestSaved.addressLine1 || '',
      addressLine2: prev.addressLine2 || profileSaved.addressLine2 || guestSaved.addressLine2 || '',
      city: prev.city || profileSaved.city || guestSaved.city || '',
      province: prev.province || profileSaved.province || guestSaved.province || '',
      postalCode: prev.postalCode || profileSaved.postalCode || guestSaved.postalCode || '',
      // Country: respect a non-default user choice, otherwise use saved.
      country: prev.country !== 'TH'
        ? prev.country
        : (profileSaved.country || guestSaved.country || 'TH'),
    }))
  }, [profile, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuote = async () => {
    setQuoteLoading(true)
    setQuoteError(false)
    try {
      const res = await fetch('/api/orders/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            book_id: i.bookId || i.id.split('-')[0],
            condition: i.condition,
            quantity: i.quantity || 1,
          })),
          voucher_id: voucherApplied ? voucherApplied.voucher_id : null,
          customer_email: form.email || user?.email || '',
          redeem_points: pointsRedeemed,
        }),
      })
      const data = await res.json()
      if (!res.ok || typeof data.total !== 'number') {
        throw new Error(data.error || 'quote failed')
      }
      setServerQuote({
        total: data.total,
        voucher_discount: data.voucher_discount ?? 0,
        points_discount: data.points_discount ?? 0,
      })
    } catch (err) {
      console.error('[checkout] quote failed:', err)
      setServerQuote(null)
      setQuoteError(true)
    }
    setQuoteLoading(false)
  }

  // Quote the authoritative total the moment the payment step opens
  // (and re-quote when discounts toggle) so the amount next to the QR
  // is the amount /api/orders will record.
  useEffect(() => {
    if (step !== 'payment' || isInternational) return
    fetchQuote()
  }, [step, isInternational, pointsRedeemed, voucherApplied, items]) // eslint-disable-line react-hooks/exhaustive-deps

  // What the manual-payment panels display as the amount to transfer.
  const transferAmountDisplay = () => {
    if (serverQuote && !quoteLoading) {
      return <span className="font-bold text-bark">฿{serverQuote.total.toLocaleString()}</span>
    }
    if (quoteError) {
      return (
        <button type="button" onClick={fetchQuote} className="text-rose underline">
          {t('quoteRetry')}
        </button>
      )
    }
    return <span className="italic text-ink-muted">{t('quoteChecking')}</span>
  }

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

  // International card payment via Stripe Checkout. Mirrors the data
  // shape of /api/orders so server-side validation can reuse the same
  // canonical fields. On success, save the address (parity with
  // handlePlaceOrder), record the order locally for /track, and redirect
  // the browser to the Stripe-hosted page. We deliberately do not flip
  // setStripeLoading off on success — the page is unloading.
  const handleStripeCheckout = async () => {
    setStripeError('')
    setStripeLoading(true)
    try {
      const addressPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
        country: form.country,
      }
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: [form.firstName, form.lastName].filter(Boolean).join(' '),
          customer_phone: form.phone,
          customer_email: form.email,
          shipping_address: buildShippingAddress(),
          destination_country: form.country,
          user_id: user?.id || null,
          note: form.note,
          items: items.map(i => ({
            book_id: i.bookId || i.id.split('-')[0],
            condition: i.condition,
            quantity: i.quantity || 1,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        // Show server's verbatim message if present — already
        // human-friendly for cart-state errors like "Only N copies left".
        setStripeError(data.error || t('stripeError'))
        setStripeLoading(false)
        return
      }
      saveAddress(addressPayload)
      if (user) {
        try {
          const { supabase } = await import('@/lib/supabase')
          await supabase.from('profiles').update({
            shipping_address: savedToShippingJson(addressPayload),
          }).eq('id', user.id)
        } catch (profileErr) {
          console.error('[checkout] profile shipping_address update failed:', profileErr)
        }
      }
      addRecentOrder({
        orderNumber: data.order_number,
        // Discounts don't apply to Stripe yet (Phase 9 deferred them).
        // For TH the customer pays full subtotal in baht; for international
        // they pay grandTotalUsd which already includes DHL shipping.
        totalAmount: isInternational ? (grandTotalUsd ?? 0) : total,
        currency: isInternational ? 'USD' : 'THB',
        placedAt: Date.now(),
      })
      window.location.href = data.url
    } catch (err) {
      console.error('[checkout] handleStripeCheckout failed:', err)
      setStripeError(t('stripeError'))
      setStripeLoading(false)
    }
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
    setPlaceOrderError('')
    try {
      // 1. Create the order first. The slip (if any) is uploaded AFTER we
      //    have a confirmed order_id, so an upload failure can't orphan
      //    a file in storage, and a guest customer can still place the
      //    order even if the slip upload step fails.
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
          slip_url: null,
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
          // The server-quoted amount the customer was told to transfer.
          // /api/orders compares its authoritative total against this and
          // flags a mismatch for both us and Sasi's admin email.
          expected_total: serverQuote?.total ?? null,
          voucher_id: voucherApplied ? voucherApplied.voucher_id : null,
          voucher_email: voucherApplied ? (form.email || user?.email || '') : null,
        }),
      })
      const data = await res.json()

      // NEVER invent an order number. By the time a PromptPay customer clicks
      // Place Order they have already transferred real baht from their bank
      // app. If the server rejected the order (sold out, rate limited, bad
      // request) and we fabricated a number and cleared the cart, the money
      // is gone with no order, no slip, and nothing for Sasi to reconcile.
      // Keep them on the page with the server's own message so they can
      // retry or contact us. handleStripeCheckout has always done this.
      if (!res.ok || !data.order_number) {
        // Server messages here are already human-friendly cart-state errors
        // ("Only 1 copy left"), same as the Stripe path shows verbatim.
        setPlaceOrderError(data.error || t('orderFailed'))
        setSubmitting(false)
        return
      }

      const createdOrderNumber = data.order_number as string
      const createdOrderId = data.id as string | undefined

      // 2. Upload the slip to the public /api/upload-slip route if the
      //    customer attached one. Works for guests and logged-in users
      //    alike because the endpoint is intentionally unauthenticated
      //    (it verifies the order_id before accepting the file).
      if (slipFile && createdOrderId) {
        try {
          const fd = new FormData()
          fd.append('file', slipFile)
          fd.append('order_id', createdOrderId)
          const uploadRes = await fetch('/api/upload-slip', { method: 'POST', body: fd })
          if (!uploadRes.ok) {
            const errJson = await uploadRes.json().catch(() => ({}))
            console.error('[checkout] slip upload failed:', errJson)
            // We don't block the "done" screen — the customer can always
            // re-upload via /slip-upload/<orderNumber>. But we surface a
            // soft warning so they know to try again if it's important.
            setSlipUploadWarning(
              errJson.error
                ? `We couldn't save your slip: ${errJson.error}. You can re-upload it from the confirmation screen.`
                : 'We could not save your slip. You can re-upload it from the confirmation screen.',
            )
          }
        } catch (err) {
          console.error('[checkout] slip upload threw:', err)
          setSlipUploadWarning('We could not save your slip. You can re-upload it from the confirmation screen.')
        }
      }

      // 3. Save shipping/contact details so next checkout on this device
      //    (logged-in or guest) is one click away.
      const addressPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
        country: form.country,
      }
      saveAddress(addressPayload)
      // For logged-in customers, also push the address to their profile
      // so it persists across devices. Non-blocking.
      if (user) {
        try {
          const { supabase } = await import('@/lib/supabase')
          await supabase.from('profiles').update({
            shipping_address: savedToShippingJson(addressPayload),
          }).eq('id', user.id)
        } catch (profileErr) {
          console.error('[checkout] profile shipping_address update failed:', profileErr)
        }
      }

      // The server recalculates the total from the database and ignores
      // whatever we sent, so its number is the one on the order Sasi
      // ships against. They agree in the normal case; they can differ if
      // a voucher went stale between validation and submit. Show what was
      // actually recorded, not what we guessed.
      const confirmedTotal =
        typeof data.total_amount === 'number' ? data.total_amount : effectiveTotal

      // The customer transferred the quoted amount; if the server
      // recorded something else (a discount died between quote and
      // order), say so on the confirmation screen instead of leaving
      // them to find out when Sasi checks the slip.
      setMismatchNotice(Boolean(data.total_mismatch))

      // 4. Remember the order locally so the customer can find it again
      //    via /track even if they didn't give an email.
      addRecentOrder({
        orderNumber: createdOrderNumber,
        totalAmount: confirmedTotal,
        currency: isInternational ? 'USD' : 'THB',
        placedAt: Date.now(),
      })

      setOrderNumber(createdOrderNumber)
      setSnapshotItems([...items])
      setSnapshotPayMethod(payMethod)
      setSnapshotTotal(confirmedTotal)
      clearCart()
      setStep('done')
    } catch (err) {
      // Network/parse failure. Same rule as above: do not show a success
      // screen for an order that may not exist. Keep the cart so they can
      // retry without rebuilding it.
      console.error('[checkout] handlePlaceOrder failed:', err)
      setPlaceOrderError(t('orderFailed'))
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
            <div className="flex items-center justify-center gap-2 mb-2 no-print">
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="text-[11px] px-3 py-1 border border-sage/40 text-sage hover:bg-sage/10 transition-colors font-heading"
              >
                {copied ? '✓ Copied' : (lang === 'th' ? 'คัดลอกหมายเลข' : 'Copy order number')}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="text-[11px] px-3 py-1 border border-sage/40 text-sage hover:bg-sage/10 transition-colors font-heading"
              >
                {lang === 'th' ? '🖨 พิมพ์' : '🖨 Print'}
              </button>
            </div>
            <p className="text-[11px] text-ink-muted italic mb-2 max-w-sm mx-auto">
              {lang === 'th'
                ? 'บันทึกหมายเลขคำสั่งซื้อไว้ คุณจะต้องใช้เพื่อตรวจสอบสถานะหรืออัปโหลดสลิปในภายหลัง'
                : 'Save this reference — you will need it to check status or upload your slip later.'}
            </p>
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

          {mismatchNotice && (
            <p className="mb-4 text-xs text-rose text-center border border-rose/40 bg-rose/5 py-2 px-3">
              ⚠ {t('totalMismatchNotice')}
            </p>
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
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted shrink-0">{t('bankAccount')}:</span>
                    <span className="font-medium font-mono whitespace-nowrap">021-3-24417-5</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted shrink-0">{t('bankHolder')}:</span>
                    <span className="font-medium text-right min-w-0 break-words">ศศิวิมล แก้วกมล</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-line bg-offwhite">
                <h3 className="font-heading text-sm mb-2">Krungsri / กรุงศรี</h3>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted shrink-0">{t('bankAccount')}:</span>
                    <span className="font-medium font-mono whitespace-nowrap">719-1-26847-2</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted shrink-0">{t('bankHolder')}:</span>
                    <span className="font-medium text-right min-w-0 break-words">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</span>
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

          {/* 24-hour payment window warning — always shown on the done
              screen so the customer knows the clock is ticking. */}
          <div className="mt-4 px-4 py-3 border-l-4 border-rose bg-rose/5">
            <p className="font-heading text-sm text-rose mb-1">⏰ {t('pay24hHeading')}</p>
            <p className="text-xs text-ink-light leading-relaxed">{t('pay24hBody')}</p>
          </div>

          {/* If the slip upload failed mid-checkout (or if the customer skipped it),
              always show a clear link to the public slip upload page so they can
              send it at any time without needing an account. */}
          {slipUploadWarning && (
            <div className="mt-4 px-4 py-3 bg-rose/10 border border-rose/20 text-xs text-rose font-jost text-center leading-relaxed">
              ⚠ {slipUploadWarning}
            </div>
          )}

          <div className="mt-4 mb-3 px-4 py-4 bg-sage/5 border border-sage/20 text-center">
            <p className="font-heading text-sm text-ink mb-1">
              {slipFile && !slipUploadWarning ? 'Slip received ✓' : 'Send your payment slip'}
            </p>
            <p className="text-xs text-ink-muted italic mb-3">
              {slipFile && !slipUploadWarning
                ? 'We have your slip. You can also re-upload it anytime from the link below.'
                : 'After paying, upload a screenshot so we can confirm your order.'}
            </p>
            <Link
              href={`/slip-upload/${orderNumber}`}
              className="inline-block font-heading text-xs px-5 py-2 bg-sage text-offwhite hover:bg-sage-light transition-colors"
            >
              {slipFile && !slipUploadWarning ? 'Re-upload slip' : 'Upload slip'}
            </Link>
          </div>

          <div className="mt-3 mb-5 px-4 py-3 bg-parchment border border-sand text-xs text-ink-muted font-jost text-center leading-relaxed">
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
          {pointsRedeemed && showDiscountsInSummary && (
            <div className="flex justify-between text-sm mb-1 pt-1 border-t border-line/50 mt-1" style={{ color: '#3a5832' }}>
              <span>Points discount (100 pts)</span>
              <span className="flex-shrink-0">-฿50</span>
            </div>
          )}
          {voucherApplied && showDiscountsInSummary && (
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
                : `฿${(showDiscountsInSummary ? effectiveTotal : total).toLocaleString()}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
              <label className="block font-heading text-sm mb-1">
                {t('email')}{' '}
                <span className="text-[11px] text-sage font-normal normal-case">
                  ({lang === 'th' ? 'แนะนำ' : 'recommended'})
                </span>
              </label>
              <input
                type="email"
                className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-[11px] text-ink-muted italic mt-1 leading-snug">
                {form.email
                  ? (lang === 'th'
                      ? 'เราจะส่งอีเมลยืนยันคำสั่งซื้อและลิงก์สำหรับอัปโหลดสลิปให้คุณ'
                      : 'We will email you a confirmation and a direct link to upload your payment slip.')
                  : (lang === 'th'
                      ? '⚠ หากไม่มีอีเมล คุณจะต้องจดจำหมายเลขคำสั่งซื้อของคุณเพื่อตรวจสอบสถานะในภายหลัง'
                      : '⚠ Without an email, you will need to remember your order number to check status later.')}
              </p>
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
            {/* Thai customers: PromptPay + bank transfer flow (existing).
                International customers: skip everything in this branch
                and render the Stripe redirect card below. */}
            {!isInternational && (
              <>
            {/* 24-hour payment window warning — hidden when Card is selected
                since Stripe payments are real-time, not slip-upload-based. */}
            {payMethod !== 'stripe' && (
              <div className="mb-4 px-4 py-3 border-l-4 border-rose bg-rose/5">
                <p className="font-heading text-sm text-rose mb-1">⏰ {t('pay24hHeading')}</p>
                <p className="text-xs text-ink-light leading-relaxed">{t('pay24hBody')}</p>
              </div>
            )}

            {/* Payment method selector — 3 options for TH customers. */}
            <div className="mb-6">
              <label className="block font-heading text-sm mb-2">{t('payMethod')}</label>
              <div className="flex flex-col gap-2">
                {(['promptpay', 'transfer', 'stripe'] as const).map(method => (
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
                    <span className="font-heading text-sm">
                      {t(method === 'promptpay' ? 'promptpay' : method === 'transfer' ? 'bankTransfer' : 'card')}
                    </span>
                  </button>
                ))}
              </div>
              {/* Discounts (voucher / points) currently only apply to
                  PromptPay + Bank Transfer. Surface this when a discount
                  is active so TH customers don't pick Card and silently
                  lose their discount. */}
              {hasActiveDiscount && (
                <p className="text-xs text-bark/70 italic mt-2">
                  {t('cardNoDiscountNote')}
                </p>
              )}
            </div>

            {/* PromptPay QR */}
            {payMethod === 'promptpay' && (
              <div className="text-center mb-6 p-6 border border-line bg-offwhite">
                <h3 className="font-heading text-base mb-1">{t('promptpayTitle')}</h3>
                <p className="text-sm text-ink-muted mb-1">
                  ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)
                </p>
                <p className="text-sm text-ink-muted mb-4">
                  {t('promptpayAmount')}: {transferAmountDisplay()}
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
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-muted shrink-0">{t('bankAccount')}:</span>
                      <span className="font-medium font-mono whitespace-nowrap">021-3-24417-5</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-muted shrink-0">{t('bankHolder')}:</span>
                      <span className="font-medium text-right min-w-0 break-words">ศศิวิมล แก้วกมล</span>
                    </div>
                  </div>
                </div>

                {/* Krungsri */}
                <div className="p-5 border border-line bg-offwhite">
                  <h3 className="font-heading text-base mb-3">
                    {t('bankTitle')} - Krungsri / กรุงศรี
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-muted shrink-0">{t('bankAccount')}:</span>
                      <span className="font-medium font-mono whitespace-nowrap">719-1-26847-2</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-muted shrink-0">{t('bankHolder')}:</span>
                      <span className="font-medium text-right min-w-0 break-words">ศศิวิมล แก้วกมล (Sasiwimol Kaewkamol)</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="p-4 bg-sage/5 border border-sage/20 text-center">
                  <span className="text-sm text-ink-light">{t('promptpayAmount')}: </span>
                  <span className="font-heading text-xl">{transferAmountDisplay()}</span>
                </div>
              </div>
            )}

            {/* Slip Upload — hidden when Card is selected (irrelevant for
                Stripe payments). */}
            {payMethod !== 'stripe' && (
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
            )}

            {/* Place Order button — only for PromptPay/Bank Transfer. The
                Stripe card below has its own redirect button. */}
            {payMethod !== 'stripe' && (
              <>
                {placeOrderError && (
                  <p className="mb-3 text-xs text-rose text-center border border-rose/40 bg-rose/5 py-2 px-3">
                    ⚠ {placeOrderError}
                  </p>
                )}
                {quoteError && (
                  <p className="mb-3 text-xs text-rose text-center border border-rose/40 bg-rose/5 py-2 px-3">
                    ⚠ {t('quoteError')}
                  </p>
                )}
                {/* No confirmed amount = nothing safe to transfer, so no
                    order either. Prevents placing an order against an
                    unverified client-side total. */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || !serverQuote}
                  className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '...' : t('placeOrder')}
                </button>
                <p className="text-xs text-ink-muted text-center mt-3">
                  📦 {t('shippedMonday')}
                </p>
              </>
            )}
              </>
            )}

            {/* Stripe redirect card — shown for international customers
                (always) and TH customers who picked Card. Same handler,
                amount/disabled state varies by currency. */}
            {(isInternational || payMethod === 'stripe') && (() => {
              const stripeAmountLabel = isInternational
                ? (grandTotalUsd !== null ? `$${grandTotalUsd.toFixed(2)}` : '')
                : `฿${total.toLocaleString()}`
              const stripeAmountReady = isInternational
                ? grandTotalUsd !== null
                : total > 0
              return (
                <div className="mb-6 p-6 border border-line bg-offwhite">
                  <h3 className="font-heading text-base mb-2">🔒 {t('stripeRedirectHeading')}</h3>
                  <p className="text-sm text-ink-light leading-relaxed mb-5">
                    {t('stripeRedirectBody')}
                  </p>

                  {stripeError && (
                    <div className="mb-4 px-4 py-3 bg-rose/5 border border-rose/30 text-sm text-rose">
                      ⚠ {stripeError}
                    </div>
                  )}

                  <button
                    onClick={handleStripeCheckout}
                    disabled={stripeLoading || !stripeAmountReady}
                    className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {stripeLoading
                      ? `⟳ ${t('stripeRedirecting')}`
                      : stripeAmountReady
                        ? `${t('payWithCard').replace('{amount}', stripeAmountLabel)} →`
                        : t('payWithCard').replace('{amount}', '').trim()}
                  </button>

                  <p className="text-[11px] text-ink-muted text-center mt-3 italic">
                    {t('poweredByStripe')}
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
