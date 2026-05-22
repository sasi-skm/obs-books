'use client'

import { Book, Category } from '@/types'
import HeroSection from '@/components/storefront/HeroSection'
import FeaturedSection from '@/components/storefront/FeaturedSection'
import CategorySection from '@/components/storefront/CategorySection'
import EditorNoteSection from '@/components/storefront/EditorNoteSection'
import ContactSection from '@/components/storefront/ContactSection'
import FlowerLetterSection from '@/components/storefront/FlowerLetterSection'
import { useLang } from '@/components/layout/LanguageContext'

interface Props {
  featuredBooks: Book[]
  categoryCounts: (Category & { count: number })[]
}

export default function HomeClient({ featuredBooks, categoryCounts }: Props) {
  const { t } = useLang()

  return (
    <>
      <HeroSection />

      {/* 5d — Info strip */}
      <div className="bg-cream py-3 px-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 font-jost text-[11px] tracking-[0.18em] uppercase text-[#2c2416]">
          <span>{t('stripShippingTH')}</span>
          <span className="hidden sm:inline mx-4 text-moss opacity-60">✦</span>
          <span>{t('stripShippingFree')}</span>
          <span className="hidden sm:inline mx-4 text-moss opacity-60">✦</span>
          <span>{t('stripShippingIntl')}</span>
        </div>
      </div>

      <FeaturedSection books={featuredBooks} />

      {/* 5g — Category grid */}
      <CategorySection categoryCounts={categoryCounts} />

      <FlowerLetterSection />

      <EditorNoteSection />
      <ContactSection />
    </>
  )
}
