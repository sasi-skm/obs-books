'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLang } from '@/components/layout/LanguageContext'

export default function AboutPageClient() {
  const { t } = useLang()

  const storyParagraphs = t('aboutStory').split('\n\n').filter(Boolean)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: '112px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* Breadcrumb */}
        <div style={{
          marginBottom: '48px',
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(44,36,24,0.42)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ color: 'rgba(44,36,24,0.42)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--brown-dark)' }}>About</span>
        </div>

        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10.5px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(44,36,24,0.45)',
            marginBottom: '16px',
          }}>
            — {t('aboutPageEyebrow')} —
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(32px, 4vw, 52px)',
            lineHeight: 1.1,
            color: 'var(--brown-dark)',
            margin: 0,
          }}>
            {t('aboutTitle')}
          </h1>
        </div>

        {/* Pull quote */}
        <div style={{
          textAlign: 'center',
          maxWidth: '720px',
          margin: '0 auto 64px',
          padding: '0 24px',
        }}>
          <blockquote style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(17px, 2vw, 22px)',
            lineHeight: 1.65,
            color: 'var(--brown-dark)',
            margin: '0 0 20px 0',
          }}>
            &#8220;{t('editorNoteQuote')}&#8221;
          </blockquote>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(44,36,24,0.48)',
          }}>
            — {t('editorNoteAttribution')}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(44,36,24,0.1)', marginBottom: '60px' }} />

        {/* Two-column: images + story */}
        <div className="flex flex-col md:flex-row gap-14 mb-20">

          {/* Image grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
            className="w-full md:w-[400px]"
          >
            {[
              { src: '/images/obs-display.jpg',       alt: 'OBS Books shop' },
              { src: '/images/warm-display.jpeg',     alt: 'Books on display' },
              { src: '/images/wildflower-guide.jpeg', alt: 'Wildflower guide' },
              { src: '/images/shop-display.jpeg',     alt: 'Shop display' },
            ].map(img => (
              <div key={img.src} style={{
                position: 'relative',
                height: '170px',
                overflow: 'hidden',
                borderRadius: '2px',
                background: '#e8e2d8',
              }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 45vw, 200px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>

          {/* Story text */}
          <div style={{ flex: 1 }}>
            {/* Lead */}
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'rgba(44,36,24,0.78)',
              marginBottom: '24px',
            }}>
              {t('welcomeText')}
            </p>

            {/* Story paragraphs */}
            {storyParagraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                lineHeight: 1.72,
                color: 'rgba(44,36,24,0.7)',
                marginBottom: i < storyParagraphs.length - 1 ? '20px' : 0,
              }}>
                {para}
              </p>
            ))}
          </div>

        </div>

        {/* Practical info */}
        <div style={{
          borderTop: '1px solid rgba(44,36,24,0.1)',
          paddingTop: '48px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10.5px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(44,36,24,0.42)',
            marginBottom: '24px',
          }}>
            — From Bangkok —
          </div>

          {/* Shipping info row */}
          <div className="flex flex-col sm:flex-row justify-center gap-1 sm:gap-0" style={{ marginBottom: '32px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brown-dark)' }}>
              Thailand · 2–3 days
            </span>
            <span className="hidden sm:inline" style={{ margin: '0 16px', color: 'rgba(44,36,24,0.3)' }}>✦</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brown-dark)' }}>
              Worldwide · 5–10 days
            </span>
            <span className="hidden sm:inline" style={{ margin: '0 16px', color: 'rgba(44,36,24,0.3)' }}>✦</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brown-dark)' }}>
              Free shipping on all Thailand orders
            </span>
          </div>

          {/* Contact links */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://instagram.com/obs_books"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                color: 'var(--moss)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--moss)',
                paddingBottom: '2px',
              }}
            >
              @obs_books
            </a>
            <a
              href="mailto:hello@obsbooks.com"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                color: 'var(--moss)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--moss)',
                paddingBottom: '2px',
              }}
            >
              hello@obsbooks.com
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
