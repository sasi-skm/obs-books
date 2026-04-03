'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLang } from '../layout/LanguageContext'

const HERO_IMAGES = [
  'hero-botanical', 'wildflower-plate', 'roses-collection', 'pansies-dahlias',
  'garden-flowers', 'butterfly-book', 'berries-book', 'flower-poetry',
  'painting-flowers', 'trees-collection', 'haeckel-art', 'nature-diary',
]

const PARTICLES = [
  { char: '✦', top: '2%',  left: '30%', size: 11, color: '#B4636E', anim: 'twinkleStar', dur: '2.8s', delay: '0s'    },
  { char: '✧', top: '8%',  left: '72%', size: 8,  color: '#6B7F5E', anim: 'twinkleStar', dur: '3.4s', delay: '0.7s'  },
  { char: '⋆', top: '20%', left: '96%', size: 13, color: '#7A6048', anim: 'twinkleStar', dur: '2.5s', delay: '1.3s'  },
  { char: '✦', top: '55%', left: '100%',size: 9,  color: '#B4636E', anim: 'twinkleStar', dur: '3.9s', delay: '0.4s'  },
  { char: '⋆', top: '85%', left: '78%', size: 12, color: '#8BA37A', anim: 'twinkleStar', dur: '3.1s', delay: '1.8s'  },
  { char: '✧', top: '92%', left: '38%', size: 8,  color: '#6B7F5E', anim: 'twinkleStar', dur: '4.2s', delay: '0.9s'  },
  { char: '✦', top: '78%', left: '2%',  size: 10, color: '#B4636E', anim: 'twinkleStar', dur: '2.9s', delay: '2.1s'  },
  { char: '⋆', top: '42%', left: '-4%', size: 14, color: '#7A6048', anim: 'twinkleStar', dur: '3.6s', delay: '0.2s'  },
  { char: '✿', top: '-4%', left: '55%', size: 11, color: '#B4636E', anim: 'floatPetal',  dur: '3.3s', delay: '0.5s'  },
  { char: '❀', top: '15%', left: '-2%', size: 10, color: '#8BA37A', anim: 'floatPetal',  dur: '4.0s', delay: '1.6s'  },
  { char: '✾', top: '48%', left: '103%',size: 12, color: '#7A6048', anim: 'floatPetal',  dur: '3.7s', delay: '0.8s'  },
  { char: '✿', top: '70%', left: '98%', size: 9,  color: '#B4636E', anim: 'floatPetal',  dur: '2.6s', delay: '2.4s'  },
  { char: '❀', top: '96%', left: '20%', size: 13, color: '#8BA37A', anim: 'floatPetal',  dur: '3.5s', delay: '1.0s'  },
  { char: '✾', top: '30%', left: '101%',size: 8,  color: '#6B7F5E', anim: 'floatPetal',  dur: '4.4s', delay: '1.9s'  },
  { char: '✿', top: '88%', left: '10%', size: 10, color: '#B4636E', anim: 'floatPetal',  dur: '3.0s', delay: '0.3s'  },
  { char: '⋆', top: '5%',  left: '12%', size: 9,  color: '#6B7F5E', anim: 'twinkleStar', dur: '2.2s', delay: '1.1s'  },
]

export default function HeroSection() {
  const { t } = useLang()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background mosaic */}
      <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 grid-rows-3 gap-0.5 opacity-[0.35] saturate-75">
        {HERO_IMAGES.map(name => (
          <div key={name} className="relative">
            <Image
              src={`/images/${name}.jpeg`}
              alt=""
              fill
              className="object-cover"
              sizes="25vw"
              priority={false}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,240,230,0.3),rgba(245,240,230,0.85)_70%)]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 animate-fade-up">

        {/* Logo with fairy tale particles */}
        <div className="relative mx-auto mb-5" style={{ width: 220, height: 220 }}>
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: p.top,
                left: p.left,
                fontSize: p.size,
                color: p.color,
                animationName: p.anim,
                animationDuration: p.dur,
                animationDelay: p.delay,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {p.char}
            </span>
          ))}
          <Image
            src="/images/logo.jpg"
            alt="OBS Books"
            width={150}
            height={150}
            className="rounded-full border-[3px] border-parchment shadow-soft absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            priority
          />
        </div>

        <h1 className="font-cormorant text-[clamp(2rem,4vw,2.8rem)] font-normal leading-tight mb-2 text-ink">
          {t('heroTitle')}
        </h1>
        <p className="font-jost text-sm text-bark max-w-[500px] mx-auto mb-7">
          {t('heroSub')}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/shop"
            className="font-jost text-xs px-7 py-3 bg-moss text-cream tracking-wide rounded-sm hover:opacity-90 transition-opacity"
          >
            {t('browse')}
          </Link>
          <Link
            href="/#about"
            className="font-jost text-xs px-7 py-3 border border-ink text-ink tracking-wide rounded-sm hover:bg-ink hover:text-cream transition-colors"
          >
            {t('story')}
          </Link>
        </div>
      </div>
    </section>
  )
}
