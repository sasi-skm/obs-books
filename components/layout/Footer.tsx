'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/components/layout/LanguageContext';
import { CATEGORIES } from '@/lib/translations';

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(245, 240, 230, 0.7)',
  margin: '0 0 18px 0',
  fontWeight: 500,
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: 'var(--cream)',
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  lineHeight: 2,
};

export default function Footer() {
  const { t, lang } = useLang();

  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  const visibleCategories = CATEGORIES.filter((c) => c.id !== 'embroidery-fabric');
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'var(--brown-dark)',
        color: 'var(--cream)',
        padding: '64px 24px 32px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Column 1 - Brand blurb */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '22px',
                marginBottom: '14px',
                color: 'var(--cream)',
                lineHeight: 1,
              }}
            >
              OBS Books
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'rgba(245, 240, 230, 0.7)',
                margin: '0 0 12px 0',
              }}
            >
              {t('footerBlurb')}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-thai), var(--font-body)',
                fontSize: '12px',
                fontStyle: 'italic',
                color: 'rgba(245, 240, 230, 0.45)',
                margin: 0,
              }}
            >
              ร้านหนังสือเล็ก ๆ จากกรุงเทพฯ
            </p>
          </div>

          {/* Column 2 - Shop (real categories) */}
          <div>
            <h4 style={headingStyle}>{t('footerShop')}</h4>
            <ul style={listStyle}>
              {visibleCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.id}`} style={linkStyle}>
                    {cat[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - The Shop */}
          <div>
            <h4 style={headingStyle}>{t('footerTheShop')}</h4>
            <ul style={listStyle}>
              <li>
                <Link href="/about" style={linkStyle}>
                  {t('footerAbout')}
                </Link>
              </li>
              <li>
                <Link href="/shipping" style={linkStyle}>
                  {t('footerShipping')}
                </Link>
              </li>
              <li>
                <Link href="/track" style={linkStyle}>
                  {t('footerTrackOrder')}
                </Link>
              </li>
              <li>
                <Link href="/#contact" style={linkStyle}>
                  {t('footerContact')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" style={linkStyle}>
                  {t('footerPrivacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" style={linkStyle}>
                  {t('footerTerms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Family */}
          <div>
            <h4 style={headingStyle}>{t('footerFamily')}</h4>
            <ul style={listStyle}>
              <li>
                <a
                  href="https://obsflowerletter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {t('footerFlowerLetter')} ↗
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/obs_books"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {t('footerInstagram')} ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@obs_books"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {t('footerTiktok')} ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/obsbooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {t('footerFacebook')} ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Baseline */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(245, 240, 230, 0.15)',
            fontSize: '11px',
            color: 'rgba(245, 240, 230, 0.5)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.02em',
          }}
        >
          <span>© 2023–{year} OBS Books · Obsessed with Books</span>
          <span>{t('footerOrigin')}</span>
        </div>
      </div>
    </footer>
  );
}
