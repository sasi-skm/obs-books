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
    <section className="py-16 px-6 bg-cream" id="about">
      <div className="max-w-[950px] mx-auto grid md:grid-cols-2 gap-10 items-center">
        {/* Image grid */}
        <div className="grid grid-cols-2 gap-2.5 md:order-first order-first">
          {ABOUT_IMAGES.map((src, i) => (
            <div key={i} className="relative h-[170px]">
              <Image
                src={src}
                alt="OBS Books collection"
                fill
                className="object-cover border-[3px] border-parchment shadow-card"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>

        {/* Text */}
        <div>
          <p className="font-jost text-[11px] uppercase tracking-widest text-ink-muted mb-2">
            OBS Books
          </p>
          <h2 className="font-cormorant text-3xl font-normal text-ink mb-1">{t('aboutTitle')}</h2>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em] my-3 select-none">— ✦ —</p>
          <p className="text-sm text-ink-light leading-relaxed mb-3">{t('aboutP1')}</p>
          <p className="text-sm text-ink-light leading-relaxed mb-3">{t('aboutP2')}</p>
          <p className="text-sm text-ink-light">📍 Bangkok, Thailand</p>
          <div className="mt-4 font-cormorant italic text-base text-moss border-l-2 border-moss pl-4">
            {t('aboutQuote')}
          </div>
        </div>
      </div>
    </section>
  )
}
