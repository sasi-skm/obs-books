'use client'

import { Book } from '@/types'
import { useLang } from '../layout/LanguageContext'
import BookGrid from './BookGrid'

export default function FeaturedSection({ books }: { books: Book[] }) {
  const { t } = useLang()

  return (
    <section className="py-16 px-6 bg-parchment" id="featured">
      <div className="text-center mb-10">
        <p className="font-jost text-[11px] uppercase tracking-widest text-ink-muted mb-2">
          {t('featSub')}
        </p>
        <h2 className="font-cormorant text-[clamp(1.6rem,3vw,2.3rem)] font-normal text-ink">
          {t('newArrivalsTitle')}
        </h2>
        <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em] my-3 select-none">— ✦ —</p>
      </div>
      <BookGrid books={books} />
    </section>
  )
}
