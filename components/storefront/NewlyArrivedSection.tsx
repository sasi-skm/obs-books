'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/components/layout/LanguageContext';
import { Book } from '@/types';

interface NewlyArrivedSectionProps {
  recentBooks: Book[];
}

export default function NewlyArrivedSection({ recentBooks }: NewlyArrivedSectionProps) {
  const { t } = useLang();

  return (
    <section className="bg-cream py-20 px-8 lg:px-12">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header row: heading left, browse link right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '40px',
          gap: '24px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10.5px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(44,36,24,0.5)',
              marginBottom: '10px',
            }}>
              — {t('newlyArrivedEyebrow')} —
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              lineHeight: 1.1,
              color: 'var(--brown-dark)',
              margin: 0,
            }}>
              {t('newlyArrivedHeadlineMain')}{' '}
              <em style={{ fontStyle: 'italic' }}>
                {t('newlyArrivedHeadlineAccent')}
              </em>
            </h2>
          </div>

          <Link href="/shop" style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--moss)',
            textDecoration: 'none',
            paddingBottom: '3px',
            borderBottom: '1px solid var(--moss)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {t('newlyArrivedBrowseBtn')}
          </Link>
        </div>

        {/* Book cards — horizontal scroll mobile, 5-col grid desktop */}
        <div className="flex gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {recentBooks.map((book) => {
            const imageUrl = book.image_url || '/images/hero-botanical.jpeg';
            const isSold = book.status === 'sold' || book.copies <= 0;
            const hasConditionPrices = book.condition_prices &&
              Object.keys(book.condition_prices).length > 0;
            const prices = hasConditionPrices
              ? Object.values(book.condition_prices!)
              : [book.price];
            const minPrice = Math.min(...(prices as number[]));
            const priceLabel = (hasConditionPrices && prices.length > 1)
              ? 'from ฿' + minPrice.toLocaleString()
              : '฿' + minPrice.toLocaleString();
            const stockLabel = isSold
              ? 'Sold'
              : book.copies === 1
              ? 'Last copy'
              : '';

            return (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex-none w-40 lg:w-auto"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                {/* Portrait image 3:4 */}
                <div style={{
                  position: 'relative',
                  aspectRatio: '3 / 4',
                  overflow: 'hidden',
                  borderRadius: '2px',
                  marginBottom: '12px',
                  background: '#e8e2d8',
                }}>
                  <Image
                    src={imageUrl}
                    alt={book.title || ''}
                    fill
                    sizes="(max-width: 1024px) 160px, 220px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: 'var(--brown-dark)',
                  marginBottom: '3px',
                }}>
                  {book.title}
                </div>

                {/* Author */}
                {book.author && (
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: 'rgba(44,36,24,0.58)',
                    marginBottom: '8px',
                  }}>
                    {book.author}
                  </div>
                )}

                {/* Price + stock */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
    </section>
  );
}
