'use client';

import Image from 'next/image';
import { useLang } from '@/components/layout/LanguageContext';

export default function FlowerLetterSection() {
  const { t } = useLang();

  return (
    <section
      style={{
        background: 'var(--brown-dark)',
        color: 'var(--cream)',
        padding: '88px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '56px',
          alignItems: 'center',
        }}
      >
        {/* Left — Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 5',
            overflow: 'hidden',
            borderRadius: '2px',
          }}
        >
          <Image
            src="/images/flower-letter-promo.jpg"
            alt="The Flower Letter — a monthly envelope from OBS Books"
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 500px"
          />
        </div>

        {/* Right — Text */}
        <div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(245, 240, 230, 0.6)',
              marginBottom: '20px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            — {t('flSectionEyebrow')} —
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              margin: '0 0 28px 0',
              color: 'var(--cream)',
            }}
          >
            The Flower Letter
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.75,
              color: 'rgba(245, 240, 230, 0.85)',
              margin: '0 0 36px 0',
            }}
          >
            {t('flSectionBody')}
          </p>

          <a
            href="https://obsflowerletter.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              color: 'var(--cream)',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(245, 240, 230, 0.4)',
              paddingBottom: '4px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            {t('flSectionCta')} →
          </a>
        </div>
      </div>
    </section>
  );
}
