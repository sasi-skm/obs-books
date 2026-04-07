'use client'

import Link from 'next/link'
import { Book, Category } from '@/types'
import { getCategoryName } from '@/lib/translations'
import { useLang } from '@/components/layout/LanguageContext'
import BookGrid from '@/components/storefront/BookGrid'

const CATEGORY_DESC_KEY: Record<string, string> = {
  'wildflowers': 'catWildFlowers',
  'garden-roses': 'catGardenRoses',
  'trees-plants': 'catTreesPlants',
  'butterflies': 'catButterflies',
  'wildlife-birds-animals': 'catWildlifeAnimals',
  'cookbooks': 'catCookbooks',
  'country-life': 'catTeaCountry',
  'fairytale': 'catFairyTales',
  'art-illustration': 'catArtJournals',
  'rare-items': 'catRareItems',
  'embroidery-fabric': 'catEmbroideryFabric',
  'sale': 'catSale',
}

export default function CategoryClient({ category, books }: { category: Category; books: Book[] }) {
  const { lang, t } = useLang()
  const descKey = CATEGORY_DESC_KEY[category.id]

  return (
    <div className="pt-20 pb-16 px-6 bg-offwhite min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <Link href="/shop" className="font-heading text-sm text-ink-muted hover:text-sage mb-4 inline-block">
          {t('backHome')}
        </Link>
        <div className="text-center mb-10">
          <div className="text-4xl mb-2">{category.icon}</div>
          <h1 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">
            {getCategoryName(category, lang)}
          </h1>
          <div className="divider divider-white" />
          {descKey && (
            <p className="font-cormorant italic text-base text-ink-light max-w-[620px] mx-auto mt-3 mb-1 leading-relaxed">
              {t(descKey)}
            </p>
          )}
          <p className="text-sm text-ink-muted italic mt-2">
            {books.length} {t('books')}
          </p>
        </div>
        {books.length === 0 ? (
          <p className="text-center text-ink-muted italic py-10">{t('comingSoon')} ✿</p>
        ) : (
          <BookGrid books={books} />
        )}
      </div>
    </div>
  )
}
