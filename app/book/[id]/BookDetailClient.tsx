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
    label: 'Like New',
    desc: 'Pristine condition. No marks, creases, or wear. May have been read once or never.',
  },
  {
    label: 'Very Good',
    desc: 'Minor signs of previous ownership - e.g. a name inscription or light shelf wear. Spine tight, pages clean.',
  },
  {
    label: 'Good',
    desc: 'Shows normal use. May have pencil marks, light foxing, or small stamps. Still a great reading copy.',
  },
  {
    label: 'Well Read',
    desc: 'Clearly loved and used. Noticeable wear, possible highlighting or annotations. Content fully intact.',
  },
]

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  'Like New': 'Pristine condition - no marks, creases, or wear. May have been read once or never.',
  'Very Good': 'Minor signs of previous ownership such as a name inscription or light shelf wear. Spine tight, pages clean.',
  'Good': 'Shows normal use. May have pencil marks, light foxing, or small stamps. Still a great reading copy.',
  'Well Read': 'Clearly loved and used. Noticeable wear, possible highlighting or annotations. Content fully intact.',
}

function getNextMonday(): string {
  const today = new Date()
  const day = today.getDay()
  const daysUntil = (8 - day) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntil)
  return nextMonday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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

  const nextMonday = getNextMonday()

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
    <div className="pt-20 pb-16 px-6 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        <Link href="/shop" className="font-heading text-sm text-ink-muted hover:text-moss mb-6 inline-block">
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

            {/* Thumbnails */}
            {(galleryImages.length > 1 || book.video_url) && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setShowVideo(false) }}
                    className={'relative w-16 h-16 shrink-0 border-2 overflow-hidden transition-all ' +
                      (activeImage === i && !showVideo ? 'border-moss' : 'border-line hover:border-moss/50')}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
                {book.video_url && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={'w-16 h-16 shrink-0 border-2 flex items-center justify-center bg-ink/80 text-white text-xl transition-all ' +
                      (showVideo ? 'border-moss' : 'border-line hover:border-moss/50')}
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

            {/* Feature 6: Author as clickable link */}
            <Link
              href={`/shop?author=${encodeURIComponent(book.author)}`}
              className="text-sm text-ink-muted italic mb-3 inline-block hover:text-moss transition-colors underline underline-offset-2 decoration-moss/40"
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
              <div className="mb-3 px-3 py-2 bg-rose/10 border border-rose/30 text-xs text-rose font-heading">
                {book.copies === 1 ? 'Only 1 copy left!' : `Only ${book.copies} copies left!`}
              </div>
            )}

            {/* Condition selector */}
            {hasConditionPrices && availableConditions.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-ink-light">{t('condition')}:</p>
                  {/* Feature 1: Condition guide link */}
                  <button
                    onClick={() => setShowConditionGuide(true)}
                    className="text-xs text-moss underline underline-offset-2 hover:opacity-70 transition-opacity"
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
                          ? 'border-moss bg-moss text-parchment'
                          : 'border-line text-ink-light hover:border-moss hover:text-moss')}
                    >
                      {cond}
                      <span className="ml-1.5 text-xs opacity-80">
                        ฿{(book.condition_prices![cond] ?? 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Feature 3: Condition description */}
                {CONDITION_DESCRIPTIONS[selectedCondition] && (
                  <div className="mt-2 pl-3 border-l-2 border-moss text-xs text-ink-muted leading-relaxed">
                    {CONDITION_DESCRIPTIONS[selectedCondition]}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-ink-light">
                    {t('condition')}: <span className="font-medium">{book.condition}</span>
                  </span>
                  <button
                    onClick={() => setShowConditionGuide(true)}
                    className="text-xs text-moss underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    guide
                  </button>
                </div>
                {/* Feature 3: Condition description for single condition */}
                {CONDITION_DESCRIPTIONS[book.condition] && (
                  <div className="pl-3 border-l-2 border-moss text-xs text-ink-muted leading-relaxed">
                    {CONDITION_DESCRIPTIONS[book.condition]}
                  </div>
                )}
              </div>
            )}

            <div className="font-heading text-3xl font-semibold text-bark mb-1">
              ฿{currentPrice.toLocaleString()}
            </div>

            {/* Feature 4: Pricing note */}
            <p className="text-xs text-ink-muted italic mb-3">
              ✦ All books carefully inspected and honestly described
            </p>

            {!isSold && book.copies > 2 && (
              <div className="text-xs text-moss italic mb-4">
                {book.copies} {t('copies')}
              </div>
            )}

            {book.description && (
              <p className="text-sm text-ink-light leading-relaxed mb-6 border-t border-line pt-4">
                {book.description}
              </p>
            )}

            {!isSold ? (
              <button
                onClick={handleCart}
                className={'w-full py-3 font-heading text-sm transition-all ' +
                  (inCart
                    ? 'border border-rose text-rose hover:bg-rose hover:text-white'
                    : 'bg-moss text-parchment hover:opacity-90')}
              >
                {inCart ? ('✓ ' + t('inCart')) : t('addToCart')}
              </button>
            ) : (
              <div className="w-full py-3 text-center bg-parchment text-ink-muted font-heading text-sm">
                {t('sold')}
              </div>
            )}

            {/* Feature 5: Estimated dispatch */}
            <div className="mt-3 text-center text-xs text-ink-muted">
              🗓 Ships next Monday ({nextMonday}) - Free shipping in Thailand
            </div>

            <div className="mt-3 px-4 py-3 bg-offwhite border border-line text-xs text-ink-light">
              📦 {t('shipNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Condition Guide Modal */}
      {showConditionGuide && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center px-4"
          onClick={() => setShowConditionGuide(false)}
        >
          <div
            className="bg-cream border border-line max-w-md w-full p-6 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-semibold">Condition Guide</h2>
              <button
                onClick={() => setShowConditionGuide(false)}
                className="text-ink-muted hover:text-ink text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-ink-muted italic mb-4">
              All conditions are honestly graded. We only sell books we would be happy to receive ourselves.
            </p>
            <div className="space-y-3">
              {CONDITION_GUIDE.map(item => (
                <div key={item.label} className="pl-3 border-l-2 border-moss">
                  <p className="font-heading text-sm font-semibold text-ink">{item.label}</p>
                  <p className="text-xs text-ink-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
