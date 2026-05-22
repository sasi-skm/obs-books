'use client';

import { useLang } from '@/components/layout/LanguageContext';

export default function EditorNoteSection() {
  const { t } = useLang();

  return (
    <section style={{
      background: 'var(--cream)',
      padding: '80px 24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10.5px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(44,36,24,0.45)',
          marginBottom: '32px',
        }}>
          — {t('editorNoteEyebrow')} —
        </div>

        <blockquote style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(17px, 2vw, 24px)',
          lineHeight: 1.65,
          color: 'var(--brown-dark)',
          margin: '0 0 32px 0',
        }}>
          &#8220;{t('editorNoteQuote')}&#8221;
        </blockquote>

        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(44,36,24,0.48)',
        }}>
          {t('editorNoteAttribution')}
        </div>

      </div>
    </section>
  );
}
