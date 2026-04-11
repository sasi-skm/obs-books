'use client'

import { useEffect, useState } from 'react'
import { Book } from '@/types'
import { CATEGORIES, getCategoryName } from '@/lib/translations'
import { useLang } from '@/components/layout/LanguageContext'
import BookGrid from '@/components/storefront/BookGrid'

export default function ShopClient({
  books,
  initialAuthorFilter,
}: {
  books: Book[]
  initialAuthorFilter?: string
}) {
  const { lang, t } = useLang()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [authorFilter, setAuthorFilter] = useState(initialAuthorFilter || '')

  // If the server rendered an empty grid (Supabase was slow or in cold start
  // when the page was built), automatically retry the RSC fetch after 6s so
  // the visitor recovers without touching anything.
  useEffect(() => {
    if (books.length > 0) return
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') window.location.reload()
    }, 6000)
    return () => clearTimeout(timer)
  }, [books.length])

  const filtered = books.filter(b => {
    if (selectedCategory && b.category !== selectedCategory) return false
    if (authorFilter && b.author.toLowerCase() !== authorFilter.toLowerCase()) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    }
    return true
  })

  const clearAuthorFilter = () => {
    setAuthorFilter('')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('author')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className="pt-20 pb-16 px-6">
      <div className="text-center mb-10">
        {authorFilter ? (
          <>
            <p className="text-xs text-moss tracking-widest uppercase mb-1">Books by</p>
            <h1 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">{authorFilter}</h1>
            <div className="divider divider-cream" />
            <button
              onClick={clearAuthorFilter}
              className="text-xs text-ink-muted hover:text-moss underline underline-offset-2 mt-1 transition-colors"
            >
              Clear - show all books
            </button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">{t('shopTitle')}</h1>
            <div className="divider divider-cream" />
            <p className="text-sm text-ink-muted italic max-w-[480px] mx-auto mt-2">{t('shopSub')}</p>
          </>
        )}
      </div>

      {/* Filters - hidden when browsing by author */}
      {!authorFilter && (
        <div className="max-w-[1200px] mx-auto mb-8">
          <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 border font-heading transition-all ${
                !selectedCategory ? 'bg-moss text-parchment border-moss' : 'border-line text-ink-light hover:border-moss'
              }`}
            >
              {t('allCategories')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 border font-heading transition-all ${
                  selectedCategory === cat.id ? 'bg-moss text-parchment border-moss' : 'border-line text-ink-light hover:border-moss'
                }`}
              >
                {cat.icon} {getCategoryName(cat, lang)}
              </button>
            ))}
          </div>
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-line bg-cream font-body text-sm text-ink outline-none focus:border-moss"
            />
          </div>
        </div>
      )}

      {books.length === 0 ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-4xl mb-4">🌿</p>
          <p className="font-heading text-xl text-ink mb-2">Loading our collection...</p>
          <p className="text-sm text-ink-muted italic mb-6">One moment — we&apos;re fetching the latest books for you.</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-block w-2 h-2 bg-moss rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="inline-block w-2 h-2 bg-moss rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <span className="inline-block w-2 h-2 bg-moss rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
          <button onClick={() => window.location.reload()} className="text-xs px-5 py-2 border border-moss text-moss hover:bg-moss hover:text-parchment transition-all font-heading">
            Refresh Now
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-ink-muted italic py-10">{t('noResults')} 🌿</p>
      ) : (
        <BookGrid books={filtered} />
      )}
    </div>
  )
}
