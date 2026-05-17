'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { useCart } from '../cart/CartContext'
import { useLang } from '../layout/LanguageContext'
import WishlistHeart from './WishlistHeart'
import { thumbSrc } from '@/lib/image'

export default function BookCard({
  book,
  priority = false,
  ratingData = null,
}: {
  book: Book
  priority?: boolean
  /** Pre-fetched rating for this book, supplied by the parent grid.
   *  Defaults to null (no rating shown) so the card is safe when used
   *  without the prop. */
  ratingData?: { avg: number; count: number } | null
}) {
  const rating = ratingData
  const { addItem, removeItem, items } = useCart()
  const { t } = useLang()

  const isSold = book.status === 'sold' || book.copies <= 0
  // Fallback chain — guards against books where images[] is empty AND
  // image_url is missing/null so Next/Image never receives an empty src
  // (which crashes the whole page tree).
  const FALLBACK_COVER = '/images/hero-botanical.jpeg'
  const coverImage =
    (book.images && book.images.length > 0 && book.images[0])
      ? book.images[0]
      : (book.image_url || FALLBACK_COVER)
  const safeAuthor = book.author || ''

  const inCart = items.some(i => i.id.startsWith(book.id + '-') || i.id === book.id)

  const hasConditionPrices = book.condition_prices && Object.keys(book.condition_prices).length > 0
  const prices = hasConditionPrices ? Object.values(book.condition_prices!) : [book.price]
  const minPrice = Math.min(...prices)
  const priceLabel = (hasConditionPrices && prices.length > 1)
    ? 'from ฿' + minPrice.toLocaleString()
    : '฿' + minPrice.toLocaleString()

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSold) return
    if (inCart) {
      items.filter(i => i.id.startsWith(book.id + '-') || i.id === book.id)
        .forEach(i => removeItem(i.id))
    } else {
      const defaultCondition = hasConditionPrices
        ? Object.keys(book.condition_prices!)[0]
        : book.condition
      const price = hasConditionPrices ? book.condition_prices![defaultCondition] : book.price
      addItem({
        id: book.id + '-' + defaultCondition,
        bookId: book.id,
        title: book.title,
        author: safeAuthor,
        price,
        image_url: coverImage,
        category: book.category,
        condition: defaultCondition,
        weight_grams: book.weight_grams,
        quantity: 1,
        maxQuantity: book.copies,
      })
    }
  }

  return (
    <div className="bg-cream border border-sand rounded-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:border-moss group h-full flex flex-col">
      <Link href={'/book/' + book.id} className="flex flex-1 flex-col">
        <div className="aspect-square overflow-hidden relative">
          <Image
            src={thumbSrc(coverImage)}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
            priority={priority}
            onError={e => {
              const img = e.target as HTMLImageElement
              if (img.src !== coverImage) {
                img.src = coverImage
              } else {
                img.src = FALLBACK_COVER
              }
            }}
          />
          {isSold && (
            <div className="absolute top-2.5 right-2.5 bg-rose text-white text-xs px-2 py-0.5 font-heading">
              {t('sold')}
            </div>
          )}
          {/* Wishlist heart */}
          <div className="absolute top-2 right-2 z-10" onClick={e => e.preventDefault()}>
            <WishlistHeart bookId={book.id} bookTitle={book.title} />
          </div>
          {book.images && book.images.length > 1 && !isSold && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 font-heading">
              {book.images.length} photos
            </div>
          )}
        </div>
        <div className="p-4 flex flex-1 flex-col">
          <h3 className="font-heading text-[0.95rem] font-semibold leading-tight mb-0.5 line-clamp-2 text-ink">
            {book.title}
          </h3>
          {rating && rating.count >= 1 && (
            <p className="font-jost mb-0.5" style={{ fontSize: 12, color: '#8a7d65' }}>
              {rating.avg.toFixed(1)} ★ ({rating.count})
            </p>
          )}
          {/* Feature 6: Author as clickable link — only render when we
              actually have an author (textile products, for example, have
              no author and we shouldn't render a broken filter link). */}
          {safeAuthor && (
            <div
              className="text-xs italic mb-1 font-jost"
              onClick={e => {
                e.preventDefault()
                window.location.href = `/shop?author=${encodeURIComponent(safeAuthor)}`
              }}
              style={{ color: '#4a6741', textDecoration: 'underline', textDecorationColor: '#4a6741', cursor: 'pointer' }}
            >
              {safeAuthor}
            </div>
          )}
          <div
            className="font-jost tracking-wide uppercase mb-2"
            style={{ fontSize: 10, color: '#8a7d65' }}
          >
            {book.condition}
          </div>
          {/* Stacked footer pinned to the card bottom (mt-auto).
              Price on its own line, then a full-width CTA. The
              card is a full-height flex column, so every footer in
              a grid row aligns on the same baseline regardless of
              title length / 'from' price / condition — no clip or
              wrap at any width or base font-size. */}
          <div className="mt-auto pt-3 flex flex-col gap-2">
            <span className="font-heading text-lg font-semibold text-bark">
              {priceLabel}
            </span>
            {!isSold && (
              <button
                onClick={handleCartClick}
                className={'w-full whitespace-nowrap text-sm px-3 py-2 border transition-all font-jost tracking-wide rounded-sm ' +
                  (inCart
                    ? 'border-rose text-rose hover:bg-rose hover:text-white'
                    : 'bg-moss text-cream hover:opacity-90')}
              >
                {inCart ? ('✓ ' + t('inCart')) : t('addToCart')}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
