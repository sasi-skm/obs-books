'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import Link from 'next/link'
import { Book } from '@/types'
import { CATEGORIES, getCategoryName } from '@/lib/translations'
import { useCart } from '@/components/cart/CartContext'
import { useLang } from '@/components/layout/LanguageContext'
import { useAuth } from '@/lib/AuthContext'
import WishlistHeart from '@/components/storefront/WishlistHeart'
import ReviewSection from '@/components/storefront/ReviewSection'
import { supabase } from '@/lib/supabase'

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

const CONDITION_KEY_MAP: Record<string, string> = {
  'Like New': 'conditionLikeNew',
  'Very Good': 'conditionVeryGood',
  'Good': 'conditionGood',
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
  const delivery = new Date(shipDate)
  delivery.setDate(shipDate.getDate() + 3)
  return delivery.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function BookDetailClient({ book, relatedBooks = [] }: { book: Book; relatedBooks?: Book[] }) {
  const { addItem, removeItem, items } = useCart()
  const { lang, t } = useLang()
  const { user } = useAuth()
  const category = CATEGORIES.find(c => c.id === book.category)
  const [showConditionGuide, setShowConditionGuide] = useState(false)
  const [waitlistJoined, setWaitlistJoined] = useState(false)
  const [qty, setQty] = useState(1)

  const handleJoinWaitlist = async () => {
    if (!user) { window.location.href = '/login'; return }
    await supabase.from('waitlists').insert({
      user_id: user.id,
      book_id: book.id,
      book_title: book.title,
      email: user.email,
    })
    setWaitlistJoined(true)
  }

  const galleryImages = (book.images && book.images.length > 0) ? book.images : [book.image_url]
  const [activeImage, setActiveImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed || showVideo) return
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZoomed || showVideo || !touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    const dt = Date.now() - touchStartRef.current.t
    touchStartRef.current = null
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 350) {
      if (dx < 0) setActiveImage(i => Math.min(i + 1, galleryImages.length - 1))
      else setActiveImage(i => Math.max(i - 1, 0))
    }
  }

  const hasConditionPrices = book.condition_prices && Object.keys(book.condition_prices).length > 0
  const hasConditionCopies = book.condition_copies && Object.keys(book.condition_copies).length > 0

  const availableConditions = hasConditionPrices
    ? CONDITIONS_ORDER.filter(c => {
        if (book.condition_prices![c] === undefined) return false
        if (hasConditionCopies) return (book.condition_copies![c] ?? 0) > 0
        return true
      })
    : [book.condition]

  const defaultCondition = (() => {
    if (hasConditionCopies && availableConditions.length > 0) {
      return availableConditions.reduce((best, c) =>
        (book.condition_copies![c] ?? 0) > (book.condition_copies![best] ?? 0) ? c : best
      )
    }
    return availableConditions[0] || book.condition
  })()

  const [selectedCondition, setSelectedCondition] = useState(defaultCondition)

  const currentPrice = hasConditionPrices
    ? (book.condition_prices![selectedCondition] ?? book.price)
    : book.price

  const conditionStock = hasConditionCopies
    ? (book.condition_copies![selectedCondition] ?? 0)
    : book.copies

  const cartItemId = book.id + '-' + selectedCondition
  const isSold = book.status === 'sold' || book.copies <= 0 || (hasConditionCopies && availableConditions.length === 0)
  const inCart = items.some(i => i.id === cartItemId)
  const isLowStock = !isSold && conditionStock > 0 && conditionStock <= 2

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
        quantity: qty,
        maxQuantity: conditionStock,
      })
    }
  }

  // Description: prefer lang-specific, fall back to generic description
  const description = lang === 'th'
    ? (book.description_th || book.description_en || book.description)
    : (book.description_en || book.description)

  // Book specs
  const specs: { label: string; value: string }[] = []
  if (book.publisher) specs.push({ label: 'Publisher', value: book.publisher })
  if (book.year_published) specs.push({ label: 'Year', value: String(book.year_published) })
  if (book.pages) specs.push({ label: 'Pages', value: String(book.pages) })
  if (book.cover_type) specs.push({ label: 'Cover', value: book.cover_type })
  if (book.language) specs.push({ label: 'Language', value: book.language })
  if (book.height_cm || book.width_cm) {
    const dims = [book.height_cm && `${book.height_cm} cm`, book.width_cm && `${book.width_cm} cm`].filter(Boolean).join(' x ')
    specs.push({ label: 'Dimensions', value: dims })
  }

  return (
    <div className="pt-20 pb-16 px-6 min-h-screen bg-cream">
      <div className="max-w-[1100px] mx-auto">
        <Link href="/shop" className="text-[11px] tracking-widest uppercase text-ink-muted hover:text-moss mb-6 inline-block transition-colors">
          {t('backHome')}
        </Link>

        <div className="grid md:grid-cols-[45%_55%] gap-10">
          {/* LEFT: Gallery + Description */}
          <div>
            {/* Main image - portrait */}
            <div
              className="relative overflow-hidden border border-sand mb-2"
              style={{ aspectRatio: '2/3' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {showVideo && book.video_url ? (
                <video
                  src={book.video_url}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  doubleClick={{ mode: 'reset' }}
                  wheel={{ disabled: true }}
                  panning={{ disabled: !isZoomed }}
                  onTransform={(_ref, state) => setIsZoomed(state.scale > 1.05)}
                >
                  <TransformComponent
                    wrapperStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%' }}
                  >
                    <Image
                      src={galleryImages[activeImage] || galleryImages[0]}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 45vw"
                      priority
                    />
                  </TransformComponent>
                </TransformWrapper>
              )}
              {isSold && !showVideo && (
                <div className="absolute top-4 right-4 bg-rose text-white text-sm px-4 py-1 font-heading z-10">
                  {t('sold')}
                </div>
              )}
              {!isSold && !showVideo && (
                <div className="absolute top-3 right-3 z-10">
                  <WishlistHeart bookId={book.id} bookTitle={book.title} />
                </div>
              )}
              {!showVideo && !isZoomed && galleryImages.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
                  {galleryImages.map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeImage ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {(galleryImages.length > 1 || book.video_url) && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setShowVideo(false) }}
                    className={'relative w-14 h-14 shrink-0 border-2 overflow-hidden transition-all ' +
                      (activeImage === i && !showVideo ? 'border-moss' : 'border-sand hover:border-moss/50')}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                  </button>
                ))}
                {book.video_url && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={'w-14 h-14 shrink-0 border-2 flex items-center justify-center bg-ink/80 text-white text-xl transition-all ' +
                      (showVideo ? 'border-moss' : 'border-sand hover:border-moss/50')}
                  >
                    ▶
                  </button>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="border-t border-sand pt-5">
                <p className="font-heading text-xs tracking-widest uppercase text-ink-muted mb-3">About this book</p>
                <p className="font-cormorant text-base text-ink leading-relaxed" style={{ fontSize: '1.05rem' }}>
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Details + Specs + Related */}
          <div>
            <h1 className="font-heading text-2xl font-semibold mb-1 text-ink">{book.title}</h1>

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

            {/* Low stock warning */}
            {isLowStock && (
              <div
                className="mb-3 px-3 py-2 text-xs font-jost flex items-center gap-1.5"
                style={{ background: '#fdf0eb', border: '0.5px solid #e8c4b0', color: '#9b4a2a' }}
              >
                <span style={{ fontSize: 7 }}>●</span>
                {conditionStock === 1 ? 'Last one — order before it\'s gone' : `Only ${conditionStock} left — order before it\'s gone`}
              </div>
            )}

            {/* Condition selector */}
            {hasConditionPrices && availableConditions.length > 0 ? (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-ink-light">{t('condition')}:</p>
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

            {/* Condition description */}
            {CONDITION_KEY_MAP[selectedCondition || book.condition] && (
              <div
                className="mb-3 pl-3 py-2 pr-3 font-jost leading-relaxed"
                style={{ background: '#eee8d8', borderLeft: '2px solid #4a6741', fontSize: 12, color: '#6b5e48' }}
              >
                {t(CONDITION_KEY_MAP[selectedCondition || book.condition])}
              </div>
            )}

            <p className="font-jost mb-3" style={{ fontSize: 11, color: '#8a7d65' }}>
              ✦ All books carefully inspected and honestly described
            </p>

            <div className="font-heading text-3xl font-semibold text-bark mb-2">
              ฿{currentPrice.toLocaleString()}
            </div>

            {!isSold && conditionStock > 2 && (
              <div className="text-xs text-moss italic mb-3">
                {conditionStock} {t('copies')}
              </div>
            )}

            {!isSold ? (
              <div className="space-y-2 mb-4">
                {!inCart && (
                  <div className="flex items-center gap-3">
                    <span className="font-jost text-xs text-bark tracking-wide">Qty</span>
                    <div className="flex items-center border border-sand rounded">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center text-bark hover:text-moss transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-jost text-sm text-ink">{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(conditionStock, q + 1))}
                        className="w-8 h-8 flex items-center justify-center text-bark hover:text-moss transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleCart}
                  className={'w-full py-3 font-jost text-sm tracking-wide transition-all rounded-sm ' +
                    (inCart
                      ? 'border border-rose text-rose hover:bg-rose hover:text-white'
                      : 'bg-moss text-cream hover:opacity-90')}
                >
                  {inCart ? ('✓ ' + t('inCart')) : t('addToCart')}
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <div className="w-full py-3 text-center bg-parchment text-ink-muted font-heading text-sm mb-2">
                  {t('sold')}
                </div>
                <p className="font-jost text-xs text-ink-muted leading-relaxed mb-3 text-center italic">
                  {t('outOfStock')}
                </p>
                {waitlistJoined ? (
                  <p className="text-center font-jost text-xs text-moss">✓ You&apos;re on the waitlist</p>
                ) : (
                  <button
                    onClick={handleJoinWaitlist}
                    className="w-full py-2.5 border border-moss text-moss font-jost text-sm tracking-wide rounded-sm hover:bg-moss hover:text-cream transition-colors"
                  >
                    Join Waitlist
                  </button>
                )}
              </div>
            )}

            {/* Estimated delivery */}
            <div
              className="mb-3 px-4 py-3 font-jost text-center"
              style={{ border: '1px solid #d6cdb8', fontSize: 12, color: '#6b5e48' }}
            >
              📦 Get delivery by <span className="font-semibold">{estimatedDelivery}</span>
            </div>

            <div className="mb-6 px-4 py-3 bg-parchment border border-sand text-xs text-ink-light font-jost">
              {t('shipNote')}
            </div>

            {/* Book Details specs */}
            {specs.length > 0 && (
              <div className="mb-8 border border-sand">
                <div className="px-4 py-2 bg-parchment border-b border-sand">
                  <p className="font-heading text-xs tracking-widest uppercase text-ink-muted">Book Details</p>
                </div>
                <div className="divide-y divide-sand">
                  {specs.map(spec => (
                    <div key={spec.label} className="flex px-4 py-2.5 gap-4">
                      <span className="font-heading text-xs text-ink-muted w-24 shrink-0">{spec.label}</span>
                      <span className="font-jost text-xs text-ink">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* You Might Also Like */}
            {relatedBooks.length > 0 && (
              <div>
                <p className="font-heading text-xs tracking-widest uppercase text-ink-muted mb-4">You Might Also Like</p>
                <div className="grid grid-cols-3 gap-3">
                  {relatedBooks.map(rb => (
                    <Link key={rb.id} href={`/book/${rb.id}`} className="group">
                      <div className="relative overflow-hidden border border-sand mb-1.5" style={{ aspectRatio: '2/3' }}>
                        <Image
                          src={rb.image_url}
                          alt={rb.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="120px"
                        />
                      </div>
                      <p className="font-heading text-[11px] text-ink leading-tight truncate">{rb.title}</p>
                      <p className="font-jost text-[10px] text-bark">฿{rb.price.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection bookId={book.id} bookTitle={book.title} />
        </div>
      </div>

      {/* Condition Guide Modal */}
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
