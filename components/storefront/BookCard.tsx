'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { useCart } from '../cart/CartContext'
import { useLang } from '../layout/LanguageContext'

export default function BookCard({ book }: { book: Book }) {
  const { addItem, removeItem, items } = useCart()
  const { t } = useLang()

  const isSold = book.status === 'sold' || book.copies <= 0
  const coverImage = (book.images && book.images.length > 0) ? book.images[0] : book.image_url

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
        author: book.author,
        price,
        image_url: coverImage,
        category: book.category,
        condition: defaultCondition,
        weight_grams: book.weight_grams,
      })
    }
  }

  return (
    <div className="bg-cream border border-sand rounded-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:border-moss group">
      <Link href={'/book/' + book.id} className="block">
        <div className="aspect-square overflow-hidden relative">
          <Image
            src={coverImage}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          {isSold && (
            <div className="absolute top-2.5 right-2.5 bg-rose text-white text-xs px-2 py-0.5 font-heading">
              {t('sold')}
            </div>
          )}
          {book.images && book.images.length > 1 && !isSold && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 font-heading">
              {book.images.length} photos
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading text-[0.95rem] font-semibold leading-tight mb-0.5 line-clamp-2 text-ink">
            {book.title}
          </h3>
          {/* Feature 6: Author as clickable link */}
          <div
            className="text-xs italic mb-1 font-jost"
            onClick={e => {
              e.preventDefault()
              window.location.href = `/shop?author=${encodeURIComponent(book.author)}`
            }}
            style={{ color: '#4a6741', textDecoration: 'underline', textDecorationColor: '#4a6741', cursor: 'pointer' }}
          >
            {book.author}
          </div>
          <div
            className="font-jost tracking-wide uppercase mb-2"
            style={{ fontSize: 10, color: '#8a7d65' }}
          >
            {book.condition}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-semibold text-bark">
              {priceLabel}
            </span>
            {!isSold && (
              <button
                onClick={handleCartClick}
                className={'text-xs px-3 py-1.5 border transition-all font-jost tracking-wide rounded-sm ' +
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
