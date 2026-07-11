'use client';

import Link from 'next/link';
import { useLang } from '@/components/layout/LanguageContext';

// One-line descriptions for each category tile.
// Edit the th (Thai) values to refine — these are first-pass.
const TILE_DESCS: Record<string, { en: string; th: string }> = {
  'wildflowers':            { en: 'Field guides, herbals, and the kind of plates you want to copy by hand.',    th: 'คู่มือพรรณไม้ สมุนไพร และแผ่นภาพที่อยากวาดตาม' },
  'garden-roses':           { en: 'Gardening books worth keeping. Roses, cottage gardens, and old varieties.',  th: 'หนังสือจัดสวนที่คู่ควรเก็บ กุหลาบ สวนชนบท และสายพันธุ์เก่า' },
  'trees-plants':           { en: 'Illustrated guides to trees, medicinal herbs, and the plants around us.',    th: 'คู่มือภาพต้นไม้ สมุนไพร และพืชรอบตัวเรา' },
  'butterflies':            { en: 'Entomology done beautifully — butterflies, moths, and the smaller things.',  th: 'กีฏวิทยาที่สวยงาม ผีเสื้อ มอธ และสัตว์เล็กๆ' },
  'wildlife-birds-animals': { en: 'Birds in the garden and the field. Animals observed with patience.',          th: 'นกในสวนและในทุ่ง สัตว์ที่สังเกตด้วยความอดทน' },
  'cookbooks':              { en: 'Cookbooks with beautiful illustrations. Slow food, foraged, and tea.',        th: 'ตำราอาหารภาพสวย อาหารช้าๆ หาจากป่า และชา' },
  'country-life':           { en: 'Nature diaries, field notes, and books about living slowly outdoors.',       th: 'บันทึกธรรมชาติ บันทึกภาคสนาม และหนังสือเกี่ยวกับชีวิตกลางแจ้ง' },
  'fairytale':              { en: 'Old illustrations, gilt-edged collections, stories worth re-reading.',        th: 'ภาพประกอบเก่า หนังสือขอบทอง และเรื่องราวที่ควรอ่านซ้ำ' },
  'art-illustration':       { en: 'Books about making. Sketchbooks, illustration history, working artists.',    th: 'หนังสือเกี่ยวกับการสร้างสรรค์ สมุดสเก็ตช์ และศิลปิน' },
  'rare-items':             { en: 'One copy only. Books that will not come around again.',                       th: 'มีเพียงเล่มเดียว หนังสือที่จะไม่มาอีกครั้ง' },
  'sale':                   { en: 'Reduced prices — still carefully chosen, just priced to move.',              th: 'ราคาลดแล้ว ยังคัดสรรอย่างดี แค่ตั้งราคาให้เดินออกไป' },
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface Category {
  id: string;
  en: string;
  th: string;
  icon: string;
  count: number;
}

interface CategorySectionProps {
  categoryCounts: Category[];
}

export default function CategorySection({ categoryCounts }: CategorySectionProps) {
  const { t, lang } = useLang();

  // Hide embroidery-fabric (admin / Vintage Linens — not for public browse)
  const visible = categoryCounts.filter(cat => cat.id !== 'embroidery-fabric');

  return (
    <section id="categories" className="bg-cream py-12 px-8 lg:px-12">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10.5px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(44,36,24,0.5)',
            marginBottom: '18px',
          }}>
            — {t('shelvesEyebrow')} —
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(32px, 4vw, 52px)',
            lineHeight: 1.1,
            color: 'var(--brown-dark)',
            margin: '0 0 20px 0',
          }}>
            {t('shelvesHeading')}
          </h2>

          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'rgba(44,36,24,0.6)',
            maxWidth: '520px',
            margin: '0 auto',
          }}>
            {t('shelvesSubtitle')}
          </p>
        </div>

        {/* Mobile: a contents page. Eleven shelves as one thumb-height
            row each - scan, tap, done - instead of a wall of tiles. */}
        <nav className="sm:hidden border-t border-sand">
          {visible.map((cat, index) => {
            const name = lang === 'th' ? cat.th : cat.en;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="grid grid-cols-[34px_1fr_auto_18px] items-baseline gap-2 px-1 py-[15px] border-b border-sand"
                style={{ textDecoration: 'none' }}
              >
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: 'rgba(44,36,24,0.35)',
                }}>
                  {ROMAN[index]}.
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '19px',
                  fontWeight: 500,
                  color: 'var(--brown-dark)',
                  lineHeight: 1.2,
                }}>
                  {name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(44,36,24,0.4)',
                }}>
                  {cat.count > 0 ? `${cat.count} titles` : ''}
                </span>
                <span aria-hidden="true" style={{ color: 'var(--moss)', fontSize: '14px' }}>&rarr;</span>
              </Link>
            );
          })}
        </nav>

        {/* Category tiles — 2 col mobile, 3 col desktop */}
        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {visible.map((cat, index) => {
            const name = lang === 'th' ? cat.th : cat.en;
            const desc = TILE_DESCS[cat.id];
            const descText = desc ? (lang === 'th' ? desc.th : desc.en) : '';

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    border: '1px solid rgba(44,36,24,0.12)',
                    borderRadius: '2px',
                    background: 'var(--cream)',
                    height: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'var(--moss)';
                    el.style.background = '#f0ece2';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'rgba(44,36,24,0.12)';
                    el.style.background = 'var(--cream)';
                  }}
                >
                  {/* Roman numeral */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'rgba(44,36,24,0.32)',
                    marginBottom: '4px',
                  }}>
                    {ROMAN[index]}.
                  </div>

                  {/* Category name */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 'clamp(15px, 1.5vw, 19px)',
                    lineHeight: 1.25,
                    color: 'var(--brown-dark)',
                    marginBottom: '3px',
                  }}>
                    {name}
                  </div>

                  {/* Description */}
                  {descText && (
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      lineHeight: 1.45,
                      color: 'rgba(44,36,24,0.52)',
                      marginBottom: '5px',
                    }}>
                      {descText}
                    </div>
                  )}

                  {/* Real title count */}
                  {cat.count > 0 && (
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(44,36,24,0.35)',
                    }}>
                      — {cat.count} titles —
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
