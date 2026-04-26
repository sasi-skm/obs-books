'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'

// Pure client landing page for the Stripe `cancel_url`. No server
// fetch and no DB writes — the order row is left untouched so the
// auto-cancel cron / `checkout.session.expired` webhook can release
// stock when the 2h Stripe session lapses (see app/api/webhooks/stripe/
// route.ts handleSessionExpired). Cart is preserved in localStorage.
//
// "Try Again" opens the cart drawer (this site has no /cart route —
// the drawer is the review surface) so the customer can sanity-check
// items + shipping before retrying checkout.
export default function CancelledPage() {
  const { t } = useLang()
  const { setIsOpen } = useCart()

  return (
    <div className="pt-24 pb-16 px-6 min-h-screen">
      <div className="max-w-lg mx-auto text-center">
        <p className="text-4xl mb-4">🌿</p>
        <h1 className="font-heading text-2xl font-normal text-sage mb-2">
          {t('cancelledHeading')}
        </h1>
        <p className="font-heading text-sm text-ink-muted mb-6">— ✦ —</p>
        <p className="text-sm text-ink-light leading-relaxed mb-10 max-w-sm mx-auto">
          {t('cancelledBody')}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="font-heading text-sm px-6 py-2.5 bg-sage text-offwhite hover:bg-sage-light transition-colors"
          >
            {t('tryAgain')}
          </button>
          <Link
            href="/shop"
            className="font-heading text-sm px-6 py-2.5 border border-sage text-sage hover:bg-sage hover:text-offwhite transition-colors"
          >
            {t('continueBrowse')}
          </Link>
        </div>
      </div>
    </div>
  )
}
