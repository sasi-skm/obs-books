'use client'

import { useState } from 'react'
import { Book } from '@/types'
import { CATEGORIES, getCategoryName } from '@/lib/translations'
import { useLang } from '@/components/layout/LanguageContext'
import BookGrid from '@/components/storefront/BookGrid'

export default function ShopClient({ books }: { books: Book[] }) {
  const { lang, t } = useLang()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = books.filter(b => {
    if (selectedCategory && b.category !== selectedCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="pt-20 pb-16 px-6">
      <div className="text-center mb-10">
        <h1 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">{t('shopTitle')}</h1>
        <div className="divider divider-cream" />
        <p className="text-sm text-ink-muted italic max-w-[480px] mx-auto mt-2">{t('shopSub')}</p>
      </div>

      {/* Filters */}
      <div className="max-w-[1200px] mx-auto mb-8">
        <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1.5 border font-heading transition-all ${
              !selectedCategory ? 'bg-sage text-offwhite border-sage' : 'border-line text-ink-light hover:border-sage'
            }`}
          >
            {t('allCategories')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-3 py-1.5 border font-heading transition-all ${
                selectedCategory === cat.id ? 'bg-sage text-offwhite border-sage' : 'border-line text-ink-light hover:border-sage'
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
            className="w-full px-4 py-2.5 border border-line bg-cream font-body text-sm text-ink outline-none focus:border-sage"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted italic py-10">{t('noResults')} 🌿</p>
      ) : (
        <BookGrid books={filtered} />
      )}
    </div>
  )
}
