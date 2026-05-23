'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Book, Category } from '@/types'
import { getCategoryName, CATEGORIES } from '@/lib/translations'
import { useLang } from '@/components/layout/LanguageContext'
import BookGrid from '@/components/storefront/BookGrid'

const CATEGORY_DESC_KEY: Record<string, string> = {
  'wildflowers':             'catWildFlowers',
  'garden-roses':            'catGardenRoses',
  'trees-plants':            'catTreesPlants',
  'butterflies':             'catButterflies',
  'wildlife-birds-animals':  'catWildlifeAnimals',
  'cookbooks':               'catCookbooks',
  'country-life':            'catTeaCountry',
  'fairytale':               'catFairyTales',
  'art-illustration':        'catArtJournals',
  'rare-items':              'catRareItems',
  'embroidery-fabric':       'catEmbroideryFabric',
  'sale':                    'catSale',
}

type SortKey = 'newest' | 'price-asc' | 'price-desc'

interface Props {
  category: Category
  books: Book[]
  categoryCounts: (Category & { count: number })[]
}

export default function CategoryClient({ category, books, categoryCounts }: Props) {
  const { lang, t } = useLang()
  const [sort, setSort] = useState<SortKey>('newest')
  const descKey = CATEGORY_DESC_KEY[category.id]

  const sortedBooks = useMemo(() => {
    const arr = [...books]
    if (sort === 'price-asc')  return arr.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return arr.sort((a, b) => b.price - a.price)
    // 'newest' — already ordered by created_at DESC from getBooks()
    return arr
  }, [books, sort])

  // Other shelves: exclude current category, exclude textiles, require at least 1 book
  const otherCategories = categoryCounts
    .filter(c => c.id !== category.id && c.id !== 'embroidery-fabric' && c.count > 0)
    .slice(0, 6)

  const SORT_LABELS: Record<SortKey, Record<'en' | 'th', string>> = {
    'newest':     { en: 'Newest',    th: 'ใหม่สุด'  },
    'price-asc':  { en: 'Price ↑',   th: 'ราคา ↑'  },
    'price-desc': { en: 'Price ↓',   th: 'ราคา ↓'  },
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '40px' }}>
          <Link
            href="/shop"
            style={{
              fontFamily: 'var(--font-jost)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#8a7d65',
              textDecoration: 'none',
            }}
          >
            ← {lang === 'en' ? 'All books' : 'หนังสือทั้งหมด'}
          </Link>
        </nav>

        {/* Page header */}
        <header style={{ maxWidth: '760px', marginBottom: '48px' }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: 'var(--font-jost)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--moss)',
            margin: '0 0 10px 0',
          }}>
            {category.icon}&nbsp;&nbsp;{lang === 'en' ? 'The shelves' : 'ชั้นหนังสือ'}
          </p>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: 'var(--brown-dark)',
            margin: '0 0 20px 0',
            lineHeight: 1.1,
          }}>
            {getCategoryName(category, lang)}
          </h1>

          {/* Description */}
          {descKey && (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 1.6vw, 18px)',
              color: '#5a4e3c',
              lineHeight: 1.75,
              margin: '0 0 20px 0',
            }}>
              {t(descKey)}
            </p>
          )}

          {/* Count */}
          <p style={{
            fontFamily: 'var(--font-jost)',
            fontSize: '12px',
            color: '#8a7d65',
            letterSpacing: '0.06em',
            margin: 0,
          }}>
            {books.length} {t('books')}{lang === 'en' ? ' available' : ' ในหมวดนี้'}
          </p>
        </header>

        {/* Sort bar — only shown when there are enough books to make sorting meaningful */}
        {books.length > 3 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '1px solid #e8e0d0',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-jost)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#8a7d65',
            }}>
              {lang === 'en' ? 'Sort by' : 'เรียงตาม'}
            </span>
            {(['newest', 'price-asc', 'price-desc'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSort(key)}
                style={{
                  fontFamily: 'var(--font-jost)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  padding: '5px 14px',
                  border: '1px solid',
                  borderColor: sort === key ? 'var(--moss)' : '#d4cbbf',
                  borderRadius: '2px',
                  background: sort === key ? 'var(--moss)' : 'transparent',
                  color: sort === key ? 'var(--cream)' : '#5a4e3c',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {SORT_LABELS[key][lang]}
              </button>
            ))}
          </div>
        )}

        {/* Book grid or empty state */}
        {sortedBooks.length === 0 ? (
          <p style={{
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: '#8a7d65',
            padding: '60px 0',
          }}>
            {t('comingSoon')} ✿
          </p>
        ) : (
          <BookGrid books={sortedBooks} />
        )}

        {/* Browse other shelves */}
        {otherCategories.length > 0 && (
          <div style={{ marginTop: '80px', paddingTop: '48px', borderTop: '1px solid #e8e0d0' }}>
            <p style={{
              fontFamily: 'var(--font-jost)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--moss)',
              margin: '0 0 10px 0',
            }}>
              {lang === 'en' ? 'More shelves' : 'ชั้นหนังสืออื่น'}
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
              color: 'var(--brown-dark)',
              margin: '0 0 24px 0',
              lineHeight: 1.15,
            }}>
              {lang === 'en' ? 'Browse other shelves.' : 'สำรวจชั้นหนังสืออื่น'}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '10px',
            }}>
              {otherCategories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #d4cbbf',
                      borderRadius: '2px',
                      background: '#ffffff',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--moss)'
                      el.style.background = '#f0ece2'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = '#d4cbbf'
                      el.style.background = '#ffffff'
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-jost)',
                      fontSize: '13px',
                      color: 'var(--brown-dark)',
                      marginBottom: '4px',
                    }}>
                      {cat.icon}&nbsp;{getCategoryName(cat, lang)}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-jost)',
                      fontSize: '11px',
                      color: '#8a7d65',
                    }}>
                      {cat.count} {t('books')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
