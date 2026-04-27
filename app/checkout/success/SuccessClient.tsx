'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'
import type { SuccessPayload } from './page'

function formatMoney(cents: number, currency: string): string {
  // Stripe always reports amounts in the smallest unit. Divide by 100 to
  // get baht/dollars. THB renders without decimals (whole baht); USD
  // renders with two.
  if (currency === 'THB') {
    return `฿${Math.round(cents / 100).toLocaleString()}`
  }
  if (currency === 'USD') {
    return `$${(cents / 100).toFixed(2)}`
  }
  return `${(cents / 100).toFixed(2)}`
}

export default function SuccessClient({ payload }: { payload: SuccessPayload }) {
  const { lang, t } = useLang()
  const { clearCart } = useCart()
  const [copied, setCopied] = useState(false)

  // Clear the local cart only after Stripe confirms payment. If the
  // webhook hasn't caught up yet (kind='processing') we leave the cart
  // alone — the customer's cart is the source of truth on the device,
  // and we don't want to wipe it on a stale URL revisit.
  useEffect(() => {
    if (payload.kind === 'paid') {
      clearCart()
    }
  }, [payload.kind]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // older browser / insecure context — silently no-op
    }
  }

  // Not found state — invalid or expired session_id.
  if (payload.kind === 'not_found') {
    return (
      <div className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h1 className="font-heading text-2xl font-normal text-sage mb-2">{t('successNotFoundHeading')}</h1>
          <p className="font-heading text-sm text-ink-muted mb-6">— ✦ —</p>
          <p className="text-sm text-ink-light leading-relaxed mb-8 max-w-sm mx-auto">
            {t('successNotFoundBody')}
          </p>
          <Link
            href="/shop"
            className="inline-block font-heading text-sm px-6 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors"
          >
            {t('continueBrowse')}
          </Link>
        </div>
      </div>
    )
  }

  // Processing state — webhook hasn't caught up yet.
  if (payload.kind === 'processing') {
    return (
      <div className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h1 className="font-heading text-2xl font-normal text-sage mb-2">{t('processingOrder')}</h1>
          <p className="font-heading text-sm text-ink-muted mb-6">— ✦ —</p>
          <p className="text-sm text-ink-light leading-relaxed mb-3 max-w-sm mx-auto">
            {payload.customerEmail
              ? t('processingBody').replace('{email}', payload.customerEmail)
              : t('processingBody').replace('{email}', '').replace(/\s+to\s+\./, '.')}
          </p>
          <p className="text-xs text-ink-muted italic mb-8">{t('closeSafely')}</p>
          <Link
            href="/track"
            className="inline-block font-heading text-sm px-6 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors"
          >
            {t('trackOrder')}
          </Link>
        </div>
      </div>
    )
  }

  // Paid state — full confirmation card.
  const firstName = payload.customerName.split(' ')[0] || (lang === 'th' ? 'ลูกค้า' : 'friend')

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-4">✿</p>
          <h1 className="font-heading text-2xl font-normal text-sage mb-2">
            {t('successHeading')} 🌿
          </h1>
          <p className="font-heading text-sm text-ink-muted mb-3">— ✦ —</p>
          <p className="font-heading text-base text-ink mb-1">
            {t('successThanks').replace('{name}', firstName)}
          </p>
          <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">
            {t('successBody')}
          </p>
        </div>

        {/* Order reference */}
        <div className="mb-6">
          <p className="font-heading text-xs uppercase tracking-wider text-ink-muted mb-2">
            {t('orderReference')}
          </p>
          <div className="flex items-center justify-between border border-line bg-cream px-4 py-3">
            <span className="font-heading text-lg text-bark">{payload.orderNumber}</span>
            <button
              onClick={() => handleCopy(payload.orderNumber)}
              className="font-jost text-xs text-sage hover:text-sage-light transition-colors"
              type="button"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted italic mt-1.5">
            {t('orderRefHint')}
          </p>
        </div>

        {/* Items + total */}
        <div className="mb-6 border border-line bg-cream p-4">
          <p className="font-heading text-sm mb-3 text-ink-muted uppercase tracking-wide">
            {t('yourOrder')}
          </p>
          <div className="space-y-3">
            {payload.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.imageUrl && (
                  <div className="w-12 h-12 flex-shrink-0 relative border border-sand overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.description}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-semibold leading-tight">
                    {item.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-heading text-sm font-semibold text-bark">
                    {formatMoney(item.amountCents, payload.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-heading text-base font-semibold pt-3 mt-3 border-t border-line">
            <span>{t('total')}</span>
            <span className="text-bark">
              {formatMoney(payload.totalCents, payload.currency)} {payload.currency}
            </span>
          </div>
        </div>

        {/* Confirmation email */}
        {payload.customerEmail && (
          <div className="mb-6 px-4 py-3 bg-sage/5 border border-sage/20">
            <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">
              ✉ {t('confirmationSentTo')}
            </p>
            <p className="font-heading text-sm text-ink break-all">
              {payload.customerEmail}
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="mb-8">
          <p className="font-heading text-sm mb-3 text-ink-muted uppercase tracking-wide">
            {t('whatsNext')}
          </p>
          <ul className="space-y-2.5 text-sm text-ink-light leading-relaxed">
            <li className="flex gap-3">
              <span aria-hidden="true">📦</span>
              <span>{t('nextStepPack')}</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">✈</span>
              <span>{t('nextStepShip')}</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/shop"
            className="font-heading text-sm px-6 py-2.5 border border-sage text-sage hover:bg-sage hover:text-offwhite transition-colors"
          >
            {t('continueBrowse')}
          </Link>
          <Link
            href="/track"
            className="font-heading text-sm px-6 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors"
          >
            {t('trackOrder')}
          </Link>
        </div>
      </div>
    </div>
  )
}
