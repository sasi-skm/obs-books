'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { CATEGORIES, getCategoryName } from '@/lib/translations'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'

const CONDITIONS_ORDER = ['Like New', 'Very Good', 'Good', 'Well Read']

const CONDITION_GUIDE = [
  {
    star: '★',
    label: 'Like New',
    lines: [
      'Appears unread or barely handled',
      'No visible wear to cover or spine',
      'Clean, unmarked pages',
      'Dust jacket included and intact (if applicable)',
    ],
  },
  {
    star: '★',
    label: 'Very Good',
    lines: [
      'Minimal spine creasing',
      'Cover shows light shelf wear only',
      'No notes or highlighting',
      'Dust jacket included if applicable',
    ],
  },
  {
    star: '☆',
    label: 'Good',
    lines: [
      'Noticeable wear to cover or spine',
      'Pages clean but may show yellowing',
      'May have previous owner\'s name or stamp',
      'No heavy annotations or highlighting',
    ],
  },
  {
    star: '☆',
    label: 'Well Read',
    lines: [
      'Loved and used — wear is visible',
      'May have notes, underlining, or highlighting',
      'Pages intact but may show significant yellowing',
      'All text fully readable',
    ],
  },
]

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  'Like New': 'Appears unread or barely handled. No visible wear to cover or spine. Clean, unmarked pages. Dust jacket intact if applicable.',
  'Very Good': 'Minimal spine creasing. Cover shows light shelf wear only. No notes or highlighting. Dust jacket included if applicable.',
  'Good': 'Noticeable wear to cover or spine. Pages clean but may show yellowing. May have previous owner\'s name or stamp.',
  'Well Read': 'Loved and used — wear is visible. May have notes or highlighting. All text fully readable.',
}

function getNextMonday(): Date {
  const today = new Date()
  const day = today.getDay()
  const daysUntil = (8 - day) % 7 || 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return next
}

function getEstimatedDelivery(): string {
  const shipDate = getNextMonday()
  // Default: Thailand +3 days transit
  const delivery = new Date(shipDate)
  delivery.setDate(shipDate.getDate() + 3)
  return delivery.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function BookDetailClient({ book }: { book: Book }) {
  const { addItem, removeItem, items } = useCart()
  const { lang, t } = useLang()
  const category = CATEGORIES.find(c => c.id === book.category)
  const [showConditionGuide, setShowConditionGuide] = useState(false)

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
  const isLowStock = !isSold && book.copies > 0 && book.copies <= 2

  const estimatedDelivery = getEstimatedDelivery()

  const handleCart = () => {
    if (isSold) return
    if (inCart) {
      removeItem(cartItemId)
    } else {
      addItem({
        id: cartItemId,
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: currentPrice,
        image_url: galleryImages[0],
        category: book.category,
        condition: selectedCondition,
        weight_grams: book.weight_grams,
      })
    }
  }

  return (
    <div className="pt-20 pb-16 px-6 min-h-screen bg-cream">
      <div className="max-w-[900px] mx-auto">
        <Link href="/shop" className="text-[11px] tracking-widest uppercase text-ink-muted hover:text-moss mb-6 inline-block transition-colors">
          {t('backHome')}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden border border-sand mb-2">
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

            {/* Thumbnails */}
            {(galleryImages.length > 1 || book.video_url) && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setShowVideo(false) }}
                    className={'relative w-16 h-16 shrink-0 border-2 overflow-hidden transition-all ' +
                      (activeImage === i && !showVideo ? 'border-moss' : 'border-sand hover:border-moss/50')}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
                {book.video_url && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={'w-16 h-16 shrink-0 border-2 flex items-center justify-center bg-ink/80 text-white text-xl transition-all ' +
                      (showVideo ? 'border-moss' : 'border-sand hover:border-moss/50')}
                  >
                    ▶
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-heading text-2xl font-semibold mb-1 text-ink">{book.title}</h1>

            {/* Feature 6: Author as clickable link */}
            <Link
              href={`/shop?author=${encodeURIComponent(book.author)}`}
              className="text-sm italic mb-3 inline-block transition-colors"
              style={{ color: '#4a6741', borderBottom: '1px solid #4a6741' }}
            >
              {book.author}
            </Link>

            {category && (
              <Link
                href={'/category/' + category.id}
                className="block text-xs text-moss tracking-wider uppercase mb-4 hover:opacity-70"
              >
                {category.icon} {getCategoryName(category, lang)}
              </Link>
            )}

            {/* Feature 2: Low stock warning */}
            {isLowStock && (
              <div
                className="mb-3 px-3 py-2 text-xs font-jost flex items-center gap-1.5"
                style={{ background: '#fdf0eb', border: '0.5px solid #e8c4b0', color: '#9b4a2a' }}
              >
                <span style={{ fontSize: 7 }}>●</span>
                {book.copies === 1 ? 'Last one — order before it\'s gone' : 'Only 2 left — order before it\'s gone'}
              </div>
            )}

            {/* Condition selector */}
            {hasConditionPrices && availableConditions.length > 0 ? (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-ink-light">{t('condition')}:</p>
                  {/* Feature 1: Condition guide link */}
                  <button
                    onClick={() => setShowConditionGuide(true)}
                    className="font-jost transition-opacity hover:opacity-70"
                    style={{ fontSize: 11, color: '#4a6741', textDecoration: 'underline', textDecorationColor: '#4a6741' }}
                  >
                    Condition guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableConditions.map(cond => (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(cond)}
                      className={'px-3 py-1.5 border font-heading text-sm transition-all ' +
                        (selectedCondition === cond
                          ? 'border-moss bg-[#eef3ec] text-moss'
                          : 'border-sand text-ink-light hover:border-moss hover:text-moss')}
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
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-ink-light">
                    {t('condition')}: <span className="font-medium">{book.condition}</span>
                  </span>
                  <button
                    onClick={() => setShowConditionGuide(true)}
                    className="font-jost transition-opacity hover:opacity-70"
                    style={{ fontSize: 11, color: '#4a6741', textDecoration: 'underline', textDecorationColor: '#4a6741' }}
                  >
                    guide
                  </button>
                </div>
              </div>
            )}

            {/* Feature 3: Condition description */}
            {CONDITION_DESCRIPTIONS[selectedCondition || book.condition] && (
              <div
                className="mb-3 pl-3 py-2 pr-3 font-jost leading-relaxed"
                style={{ background: '#eee8d8', borderLeft: '2px solid #4a6741', fontSize: 12, color: '#6b5e48' }}
              >
                {CONDITION_DESCRIPTIONS[selectedCondition || book.condition]}
              </div>
            )}

            {/* Feature 4: Pricing note */}
            <p className="font-jost mb-3" style={{ fontSize: 11, color: '#8a7d65' }}>
              ✦ All books carefully inspected and honestly described
            </p>

            <div className="font-heading text-3xl font-semibold text-bark mb-2">
              ฿{currentPrice.toLocaleString()}
            </div>

            {!isSold && book.copies > 2 && (
              <div className="text-xs text-moss italic mb-3">
                {book.copies} {t('copies')}
              </div>
            )}

            {book.description && (
              <p className="text-sm text-ink-light leading-relaxed mb-5 border-t border-sand pt-4">
                {book.description}
              </p>
            )}

            {!isSold ? (
              <button
                onClick={handleCart}
                className={'w-full py-3 font-jost text-sm tracking-wide transition-all rounded-sm ' +
                  (inCart
                    ? 'border border-rose text-rose hover:bg-rose hover:text-white'
                    : 'bg-moss text-cream hover:opacity-90')}
              >
                {inCart ? ('✓ ' + t('inCart')) : t('addToCart')}
              </button>
            ) : (
              <div className="w-full py-3 text-center bg-parchment text-ink-muted font-heading text-sm">
                {t('sold')}
              </div>
            )}

            {/* Feature 5: Estimated delivery */}
            <div
              className="mt-3 px-4 py-3 font-jost text-center"
              style={{ border: '1px solid #d6cdb8', fontSize: 12, color: '#6b5e48' }}
            >
              📦 Get delivery by <span className="font-semibold">{estimatedDelivery}</span>
            </div>

            <div className="mt-3 px-4 py-3 bg-parchment border border-sand text-xs text-ink-light font-jost">
              {t('shipNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Condition Guide Modal */}
      {showConditionGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(44,36,22,0.5)' }}
          onClick={() => setShowConditionGuide(false)}
        >
          <div
            className="border border-sand max-w-md w-full p-6 shadow-lg"
            style={{ background: '#f5f0e6' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-normal text-ink">Condition Guide</h2>
              <button
                onClick={() => setShowConditionGuide(false)}
                className="text-ink-muted hover:text-ink text-2xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="font-jost text-xs text-ink-muted italic mb-5">
              All conditions are honestly graded. We only sell books we would be happy to receive ourselves.
            </p>
            <div className="space-y-4">
              {CONDITION_GUIDE.map(item => (
                <div key={item.label} className="pl-3 border-l-2 border-moss">
                  <p className="font-heading text-sm font-semibold text-ink mb-1">
                    {item.star} {item.label}
                  </p>
                  <ul className="space-y-0.5">
                    {item.lines.map((line, i) => (
                      <li key={i} className="font-jost text-xs text-ink-muted">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
