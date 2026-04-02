'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { CATEGORIES, getCategoryName } from '@/lib/translations'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'

const CONDITIONS_ORDER = ['Like New', 'Very Good', 'Good', 'Well Read']

export default function BookDetailClient({ book }: { book: Book }) {
  const { addItem, removeItem, items } = useCart()
  const { lang, t } = useLang()
  const category = CATEGORIES.find(c => c.id === book.category)

  const galleryImages = (book.images && book.images.length > 0) ? book.images : [book.image_url]
  const [activeImage, setActiveImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  const hasConditionPrices = book.condition_prices && Object.keys(book.condition_prices).length > 0
  const availableConditions = hasConditionPrices
    ? CONDITIONS_ORDER.filter(c => book.condition_prices![c] !== undefined)
    : [book.condition]
  const [selectedCondition, setSelectedCondition] = useState(availableConditions[0] || book.condition)

  const currentPrice = hasConditionPrices
    ? (book.condition_prices![selectedCondition] ?? book.price)
    : book.price

  const cartItemId = book.id + '-' + selectedCondition
  const isSold = book.status === 'sold' || book.copies <= 0
  const inCart = items.some(i => i.id === cartItemId)

  const handleCart = () => {
    if (isSold) return
    if (inCart) {
      removeItem(cartItemId)
    } else {
      addItem({
        id: cartItemId,
        title: book.title,
        author: book.author,
        price: currentPrice,
        image_url: galleryImages[0],
        category: book.category,
        condition: selectedCondition,
      })
    }
  }


  return (
    <div className="pt-20 pb-16 px-6 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        <Link href="/shop" className="font-heading text-sm text-ink-muted hover:text-sage mb-6 inline-block">
          {t('backHome')}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden border border-line mb-2">
              {showVideo && book.video_url ? (
                <video
                  src={book.video_url}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                />
              ) : (
                <Image
                  src={galleryImages[activeImage] || galleryImages[0]}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              )}
              {isSold && !showVideo && (
                <div className="absolute top-4 right-4 bg-rose text-white text-sm px-4 py-1 font-heading">
                  {t('sold')}
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {(galleryImages.length > 1 || book.video_url) && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setShowVideo(false) }}
                    className={'relative w-16 h-16 shrink-0 border-2 overflow-hidden transition-all ' +
                      (activeImage === i && !showVideo ? 'border-sage' : 'border-line hover:border-sage/50')}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
                {book.video_url && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={'w-16 h-16 shrink-0 border-2 flex items-center justify-center bg-ink/80 text-white text-xl transition-all ' +
                      (showVideo ? 'border-sage' : 'border-line hover:border-sage/50')}
                  >
                    ▶
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-heading text-2xl font-semibold mb-1">{book.title}</h1>
            <p className="text-sm text-ink-muted italic mb-4">{book.author}</p>

            {category && (
              <Link href={'/category/' + category.id}
                className="inline-block text-xs text-sage tracking-wider uppercase mb-4 hover:text-sage-light">
                {category.icon} {getCategoryName(category, lang)}
              </Link>
            )}

            {/* Condition selector */}
            {hasConditionPrices && availableConditions.length > 0 ? (
              <div className="mb-4">
                <p className="text-sm text-ink-light mb-2">{t('condition')}:</p>
                <div className="flex flex-wrap gap-2">
                  {availableConditions.map(cond => (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(cond)}
                      className={'px-3 py-1.5 border font-heading text-sm transition-all ' +
                        (selectedCondition === cond
                          ? 'border-sage bg-sage text-offwhite'
                          : 'border-line text-ink-light hover:border-sage hover:text-sage')}
                    >
                      {cond}
                      <span className="ml-1.5 text-xs opacity-80">
                        ฿{(book.condition_prices![cond] ?? 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-ink-light mb-3">
                {t('condition')}: <span className="font-medium">{book.condition}</span>
              </div>
            )}

            <div className="font-heading text-3xl font-semibold text-bark mb-4">
              ฿{currentPrice.toLocaleString()}
            </div>

            {!isSold && book.copies > 1 && (
              <div className="text-xs text-sage italic mb-4">
                {book.copies} {t('copies')}
              </div>
            )}

            {book.description && (
              <p className="text-sm text-ink-light leading-relaxed mb-6 border-t border-line pt-4">
                {book.description}
              </p>
            )}

            {!isSold ? (
              <button onClick={handleCart}
                className={'w-full py-3 font-heading text-sm transition-all ' +
                  (inCart
                    ? 'border border-rose text-rose hover:bg-rose hover:text-white'
                    : 'bg-sage text-offwhite hover:bg-sage-light')}>
                {inCart ? ('✓ ' + t('inCart')) : t('addToCart')}
              </button>
            ) : (
              <div className="w-full py-3 text-center bg-parchment text-ink-muted font-heading text-sm">
                {t('sold')}
              </div>
            )}

            <div className="mt-6 px-4 py-3 bg-offwhite border border-line text-xs text-ink-light">
              📦 {t('shipNote')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
