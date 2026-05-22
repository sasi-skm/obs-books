'use client'

import { Book, Category } from '@/types'
import HeroSection from '@/components/storefront/HeroSection'
import FeaturedSection from '@/components/storefront/FeaturedSection'
import CategoryCard from '@/components/storefront/CategoryCard'
import AboutSection from '@/components/storefront/AboutSection'
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

      {/* Categories */}
      <section className="py-16 px-6 bg-cream" id="categories">
        <div className="text-center mb-10">
          <p className="font-jost text-[11px] uppercase tracking-widest text-ink-muted mb-2">Collection</p>
          <h2 className="font-cormorant text-[clamp(1.6rem,3vw,2.3rem)] font-normal text-ink">{t('shopByCategoryTitle')}</h2>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em] my-3 select-none">— ✦ —</p>
        </div>
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryCounts.map(cat => (
            <CategoryCard key={cat.id} category={cat} bookCount={cat.count} />
          ))}
        </div>
      </section>

      <FlowerLetterSection />

      <AboutSection />
      <ContactSection />
    </>
  )
}
