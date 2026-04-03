'use client'

import Link from 'next/link'
import { Category } from '@/types'
import { useLang } from '../layout/LanguageContext'
import { getCategoryName } from '@/lib/translations'

export default function CategoryCard({ category, bookCount }: { category: Category; bookCount: number }) {
  const { lang, t } = useLang()

  return (
    <Link
      href={`/category/${category.id}`}
      className="block text-center p-6 bg-cream border border-sand rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-moss"
    >
      <span className="block text-3xl mb-2">{category.icon}</span>
      <h3 className="font-jost text-sm font-medium text-ink">{getCategoryName(category, lang)}</h3>
      <div className="font-jost text-[11px] text-ink-muted mt-1">
        {bookCount} {t('books')}
      </div>
    </Link>
  )
}
