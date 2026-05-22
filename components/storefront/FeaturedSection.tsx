'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/components/layout/LanguageContext';
import { Book } from '@/types';

interface FeaturedSectionProps {
  books: Book[];
}

export default function FeaturedSection({ books }: FeaturedSectionProps) {
  const { t } = useLang();
  const featured = books.slice(0, 3);

  return (
    <section className="bg-cream py-20 px-8 lg:px-12">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">

          {/* Left: editorial text */}
          <div className="lg:w-[36%] flex-shrink-0">
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10.5px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(44,36,24,0.5)',
              marginBottom: '18px',
            }}>
              — {t('featEyebrow')} —
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(26px, 3.2vw, 40px)',
              lineHeight: 1.15,
              color: 'var(--brown-dark)',
              margin: '0 0 22px 0',
            }}>
              {t('featHeadlineMain')}{' '}
              <em style={{ fontStyle: 'italic' }}>
                {t('featHeadlineAccent')}
              </em>
            </h2>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'rgba(44,36,24,0.68)',
              margin: '0 0 22px 0',
              maxWidth: '340px',
            }}>
              {t('featBody')}
            </p>

            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              letterSpacing: '0.05em',
              color: 'rgba(44,36,24,0.45)',
            }}>
              — {t('featAttribution')}
            </div>
          </div>

          {/* Right: book cards */}
          <div className="w-full lg:flex-1 flex gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {featured.map((book) => {
              // IMAGE — same fallback chain as BookCard.tsx
              const FALLBACK_COVER = '/images/hero-botanical.jpeg';
              const imageUrl =
                (book.images && book.images.length > 0 && book.images[0])
                  ? book.images[0]
                  : (book.image_url || FALLBACK_COVER);

              // PRICE — same condition_prices logic as BookCard.tsx
              const hasConditionPrices =
                book.condition_prices && Object.keys(book.condition_prices).length > 0;
              const prices = hasConditionPrices
                ? Object.values(book.condition_prices!)
                : [book.price];
              const minPrice = Math.min(...prices);
              const priceLabel =
                hasConditionPrices && prices.length > 1
                  ? 'from ฿' + minPrice.toLocaleString()
                  : '฿' + minPrice.toLocaleString();

              // STOCK — same sold/copies logic as BookCard.tsx
              const isSold = book.status === 'sold' || book.copies <= 0;
              const stockLabel = isSold
                ? 'Sold'
                : book.copies === 1
                  ? 'Last copy'
                  : '';

              return (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="flex-none w-44 lg:w-auto"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {/* Portrait image 3:4 */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '3 / 4',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    marginBottom: '13px',
                    background: '#e8e2d8',
                  }}>
                    <Image
                      src={imageUrl}
                      alt={book.title || ''}
                      fill
                      sizes="(max-width: 1024px) 176px, 280px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>

                  {/* Title */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '14.5px',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: 'var(--brown-dark)',
                    marginBottom: '4px',
                  }}>
                    {book.title}
                  </div>

                  {/* Author */}
                  {book.author && (
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: '12.5px',
                      color: 'rgba(44,36,24,0.58)',
                      marginBottom: '10px',
                    }}>
                      {book.author}
                    </div>
                  )}

                  {/* Price + stock */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-body)',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--brown-dark)',
                    }}>
                      {priceLabel}
                    </span>
                    {stockLabel && (
                      <span style={{
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(44,36,24,0.45)',
                      }}>
                        {stockLabel}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
