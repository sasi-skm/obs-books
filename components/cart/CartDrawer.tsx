'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCart } from './CartContext'
import { useLang } from '../layout/LanguageContext'
import { supabase } from '@/lib/supabase'

export default function CartDrawer() {
  const pathname = usePathname()
  const { items, removeItem, updateQuantity, total, count, isOpen, setIsOpen } = useCart()
  const { t } = useLang()
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({})

  // Fetch real-time stock whenever cart opens
  useEffect(() => {
    if (!isOpen || items.length === 0) return
    const bookIds = items.map(i => i.bookId).filter((id, idx, arr) => arr.indexOf(id) === idx)
    supabase
      .from('books')
      .select('id, copies, condition_copies')
      .in('id', bookIds)
      .then(({ data }) => {
        if (!data) return
        const limits: Record<string, number> = {}
        for (const item of items) {
          const book = data.find(b => b.id === item.bookId)
          if (!book) continue
          const condCopies = book.condition_copies as Record<string, number> | null
          limits[item.id] = (item.condition && condCopies?.[item.condition] !== undefined)
            ? condCopies[item.condition]
            : (book.copies ?? 99)
        }
        setStockLimits(limits)
      })
  }, [isOpen, items])

  if (pathname.startsWith('/admin')) return null

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
            🛒 {t('cartTitle')} ({count})
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
            items.map(item => {
              const stock = item.maxQuantity ?? stockLimits[item.id]
              const atMax = stock !== undefined && item.quantity >= stock
              return (
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
                    <Link
                      href={`/book/${item.bookId}`}
                      onClick={() => setIsOpen(false)}
                      className="font-heading text-sm font-semibold truncate block hover:text-moss transition-colors"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-ink-muted italic">{item.author}</div>
                    {item.condition && (
                      <div className="text-[0.65rem] text-sage tracking-wider uppercase">{item.condition}</div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-sand rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-bark hover:text-moss transition-colors text-sm"
                        >
                          −
                        </button>
                        <span className="w-7 text-center font-jost text-sm text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={atMax}
                          className="w-7 h-7 flex items-center justify-center text-bark hover:text-moss transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-heading text-sm font-semibold text-bark">
                        ฿{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-ink-muted underline hover:text-rose mt-0.5"
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
              )
            })
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
