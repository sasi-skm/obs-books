'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from './CartContext'
import { useLang } from '../layout/LanguageContext'

export default function CartDrawer() {
  const { items, removeItem, total, count, isOpen, setIsOpen } = useCart()
  const { t } = useLang()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-ink/50 z-[200]" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[400px] max-w-[90vw] bg-offwhite z-[201] flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-heading text-lg">
            🛒 {t('cart')} ({count})
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-xl text-ink-light hover:text-ink">
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {count === 0 ? (
            <div className="text-center py-10 text-ink-muted italic">
              <p className="text-3xl mb-2">🌿</p>
              <p>{t('cartEmpty')}</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 py-3 border-b border-line">
                <div className="w-14 h-14 flex-shrink-0 relative">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-sm font-semibold truncate">{item.title}</div>
                  <div className="text-xs text-ink-muted italic">{item.author}</div>
                  {item.condition && (
                    <div className="text-[0.65rem] text-sage tracking-wider uppercase">{item.condition}</div>
                  )}
                  <div className="font-heading text-sm font-semibold text-bark mt-0.5">
                    ฿{item.price.toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-ink-muted underline hover:text-rose mt-0.5"
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="px-5 py-4 border-t border-line">
            <div className="flex justify-between mb-3 font-heading">
              <span>{t('total')}</span>
              <span className="text-xl font-bold text-bark">฿{total.toLocaleString()}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 text-center bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors"
            >
              {t('checkout')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
