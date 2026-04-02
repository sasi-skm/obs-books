'use client'

import Image from 'next/image'
import { useLang } from '../layout/LanguageContext'

const ABOUT_IMAGES = [
  '/images/obs-display.png',
  '/images/warm-display.jpeg',
  '/images/wildflower-guide.jpeg',
  '/images/shop-display.jpeg',
]

export default function AboutSection() {
  const { t } = useLang()

  return (
    <section className="py-16 px-6" id="about">
      <div className="max-w-[950px] mx-auto grid md:grid-cols-2 gap-10 items-center">
        {/* Image grid */}
        <div className="grid grid-cols-2 gap-2.5 md:order-first order-first">
          {ABOUT_IMAGES.map((src, i) => (
            <div key={i} className="relative h-[170px]">
              <Image
                src={src}
                alt="OBS Books collection"
                fill
                className="object-cover border-[3px] border-offwhite shadow-card"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>

        {/* Text */}
        <div>
          <h2 className="font-heading text-3xl font-normal mb-3">{t('aboutTitle')}</h2>
          <p className="text-sm text-ink-light leading-relaxed mb-3">{t('aboutP1')}</p>
          <p className="text-sm text-ink-light leading-relaxed mb-3">{t('aboutP2')}</p>
          <p className="text-sm text-ink-light">📍 Bangkok, Thailand</p>
          <div className="mt-4 font-heading italic text-base text-sage border-l-2 border-sage-light pl-4">
            {t('aboutQuote')}
          </div>
        </div>
      </div>
    </section>
  )
}
