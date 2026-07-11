'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from './LanguageContext'
import { useCart } from '../cart/CartContext'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'


export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { lang, setLang, t } = useLang()
  const { count, setIsOpen } = useCart()
  const { user, profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Account'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setAccountOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (pathname.startsWith('/admin')) return null

  const linkStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--fg)',
    textDecoration: 'none',
  }

  return (
    <>
      <nav className="fixed top-[25px] w-full z-50 bg-cream/95 backdrop-blur-md border-b border-sand">

        {/* ── DESKTOP (lg+) ── */}
        <div className="hidden lg:grid grid-cols-3 items-center max-w-[1200px] mx-auto px-6 py-5">

          {/* Col 1 — Left nav links */}
          <div className="flex items-center gap-7">
            <Link href="/shop" style={linkStyle} className="hover:text-moss transition-colors">
              {t('navShop')}
            </Link>
            <Link href="/#categories" style={linkStyle} className="hover:text-moss transition-colors">
              {t('nCategories')}
            </Link>
            <Link href="/#featured" style={linkStyle} className="hover:text-moss transition-colors">
              {t('nFeatured')}
            </Link>
          </div>

          {/* Col 2 — Center wordmark */}
          <div className="text-center">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: 'var(--fg-secondary)',
                marginBottom: '4px',
              }}>
                obsessed with books
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '26px',
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}>
                OBS Books
              </div>
            </Link>
          </div>

          {/* Col 3 — Right: About, Account, Cart, EN/TH */}
          <div className="flex items-center justify-end gap-5">

            {/* About */}
            <Link href="/#about" style={linkStyle} className="hover:text-moss transition-colors">
              {t('navAbout')}
            </Link>

            {/* Account */}
            {user ? (
              <li className="relative list-none" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  style={linkStyle}
                  className="hover:text-moss transition-colors flex items-center gap-1"
                >
                  Hi, {firstName}
                  <span style={{ fontSize: '10px', color: 'var(--fg-muted)' }}>▾</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-8 bg-cream border border-sand shadow-soft min-w-[140px] py-1 z-50">
                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 font-jost text-xs text-bark hover:text-moss hover:bg-parchment transition-colors"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 font-jost text-xs text-bark hover:text-moss hover:bg-parchment transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <Link href="/login" style={linkStyle} className="hover:text-moss transition-colors">
                Sign In
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="text-lg relative hover:text-moss transition-colors"
            >
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose text-white text-[0.58rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-sans">
                  {count}
                </span>
              )}
            </button>

            {/* EN/TH toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="text-xs px-3 py-1 border border-sand rounded-full hover:bg-parchment transition-colors font-jost text-bark"
            >
              <span className={lang === 'en' ? 'text-moss font-bold' : ''}>EN</span>
              {' / '}
              <span className={lang === 'th' ? 'text-moss font-bold' : ''}>TH</span>
            </button>
          </div>
        </div>

        {/* ── MOBILE (below lg) ──
            Field-journal header: the wordmark sits centred like a title
            page with its eyebrow restored; menu left, cart right. The
            EN/TH toggle moves into the menu sheet - three controls in a
            48px bar was one too many for comfortable thumbs. */}
        <div className="grid lg:hidden grid-cols-[44px_1fr_44px] items-center max-w-[1200px] mx-auto px-4 py-1.5">

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 justify-self-start"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className={`block w-5 h-[1.5px] bg-ink my-1 transition-transform ${mobileOpen ? 'translate-y-[5px] rotate-45' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-ink my-1 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-ink my-1 transition-transform ${mobileOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
          </button>

          <Link href="/" style={{ textDecoration: 'none' }} className="text-center">
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontSize: '8.5px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: 'var(--fg-secondary)',
              marginBottom: '2px',
            }}>
              obsessed with books
            </span>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '19px',
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              OBS Books
            </span>
          </Link>

          <button onClick={() => setIsOpen(true)} className="text-lg relative p-1 justify-self-end" aria-label="Open cart">
            🛒
            {count > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-rose text-white text-[0.58rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-sans">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU SHEET ──
          Full-width contents-page sheet: serif rows at thumb height
          instead of a small corner dropdown. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink/30" />
          <div
            className="absolute top-[74px] left-0 right-0 bg-cream border-b border-sand shadow-soft"
            onClick={e => e.stopPropagation()}
          >
            {[
              { href: '/shop', label: t('navShop') },
              { href: '/#categories', label: t('nCategories') },
              { href: '/#featured', label: t('nFeatured') },
              { href: '/#about', label: t('navAbout') },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-6 py-4 border-b border-sand font-heading text-[19px] text-ink hover:text-moss transition-colors"
              >
                {item.label}
                <span className="text-moss text-sm" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-6 py-4 border-b border-sand font-heading text-[19px] text-ink hover:text-moss transition-colors"
                >
                  Hi, {firstName}
                  <span className="text-moss text-sm" aria-hidden="true">&rarr;</span>
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut() }}
                  className="flex w-full items-center justify-between px-6 py-4 border-b border-sand font-heading text-[19px] text-ink hover:text-moss transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-6 py-4 border-b border-sand font-heading text-[19px] text-ink hover:text-moss transition-colors"
              >
                Sign In
                <span className="text-moss text-sm" aria-hidden="true">&rarr;</span>
              </Link>
            )}
            <div className="flex gap-2.5 px-6 py-4">
              {(['en', 'th'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-5 py-2 border font-jost text-xs tracking-wide transition-colors ${
                    lang === l ? 'bg-ink text-cream border-ink' : 'border-sand text-bark'
                  }`}
                >
                  {l === 'en' ? 'English' : 'ไทย'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
