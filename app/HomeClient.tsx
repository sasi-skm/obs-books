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
      <section className="py-16 px-6" id="categories">
        <div className="text-center mb-10">
          <h2 className="font-heading text-[clamp(1.6rem,3vw,2.3rem)] font-normal">{t('catTitle')}</h2>
          <div className="divider divider-cream" />
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
