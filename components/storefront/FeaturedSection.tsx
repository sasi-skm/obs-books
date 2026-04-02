'use client'

import { Book } from '@/types'
import { useLang } from '../layout/LanguageContext'
import BookGrid from './BookGrid'

export default function FeaturedSection({ books }: { books: Book[] }) {
  const { t } = useLang()

  return (
    <section className="py-16 px-6 bg-offwhite" id="featured">
      <div className="text-center mb-10">
        <h2 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">{t('featTitle')}</h2>
        <div className="divider divider-white" />
        <p className="text-sm text-ink-muted italic max-w-[480px] mx-auto mt-2">{t('featSub')}</p>
      </div>
      <BookGrid books={books} />
    </section>
  )
}
