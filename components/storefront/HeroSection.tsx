'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/components/layout/LanguageContext';

export default function HeroSection() {
  const { t } = useLang();

  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'clamp(560px, 88vh, 880px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <Image
        src="/images/hero-1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      {/* Dark scrim for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(44,36,24,0.5) 0%, rgba(44,36,24,0.4) 45%, rgba(44,36,24,0.62) 100%)',
        }}
      />

      {/* Main content — centered in available space */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 24px',
        }}
      >
        <div style={{ maxWidth: '760px', textAlign: 'center', color: 'var(--cream)' }}>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,230,0.78)',
              marginBottom: '26px',
            }}
          >
            — {t('heroEyebrow')} —
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(38px, 6.6vw, 76px)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              margin: '0 0 26px 0',
              color: 'var(--cream)',
            }}
          >
            {t('heroHeadlineLead')}{' '}
            <em style={{ fontStyle: 'italic', color: '#aac291' }}>
              {t('heroHeadlineAccent')}
            </em>
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 1.7vw, 19px)',
              lineHeight: 1.6,
              color: 'rgba(245,240,230,0.9)',
              maxWidth: '560px',
              margin: '0 auto 38px',
            }}
          >
            {t('heroLead')}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/shop"
              style={{
                background: 'var(--cream)',
                color: 'var(--brown-dark)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 500,
                padding: '15px 32px',
                borderRadius: '2px',
                textDecoration: 'none',
              }}
            >
              {t('heroBrowseBtn')}
            </Link>
            <Link
              href="/about"
              style={{
                background: 'transparent',
                color: 'var(--cream)',
                border: '1px solid rgba(245,240,230,0.55)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 500,
                padding: '14px 32px',
                borderRadius: '2px',
                textDecoration: 'none',
              }}
            >
              {t('heroStoryBtn')}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 24px 38px',
          fontFamily: 'var(--font-body)',
          fontSize: '10.5px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(245,240,230,0.6)',
        }}
      >
        — {t('heroStrip')} —
      </div>
    </section>
  );
}
