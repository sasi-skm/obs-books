'use client'

import { Book, Category } from '@/types'
import HeroSection from '@/components/storefront/HeroSection'
import FeaturedSection from '@/components/storefront/FeaturedSection'
import CategoryCard from '@/components/storefront/CategoryCard'
import AboutSection from '@/components/storefront/AboutSection'
import ContactSection from '@/components/storefront/ContactSection'
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
      <FeaturedSection books={featuredBooks} />

      {/* Categories */}
      <section className="py-16 px-6 bg-cream" id="categories">
        <div className="text-center mb-10">
          <p className="font-jost text-[11px] uppercase tracking-widest text-ink-muted mb-2">Collection</p>
          <h2 className="font-cormorant text-[clamp(1.6rem,3vw,2.3rem)] font-normal text-ink">{t('catTitle')}</h2>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em] my-3 select-none">— ✦ —</p>
        </div>
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryCounts.map(cat => (
            <CategoryCard key={cat.id} category={cat} bookCount={cat.count} />
          ))}
        </div>
      </section>

      <AboutSection />
      <ContactSection />
    </>
  )
}
