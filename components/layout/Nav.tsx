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
      <nav className="fixed top-[30px] w-full z-50 bg-cream/95 backdrop-blur-md border-b border-sand">

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

        {/* ── MOBILE (below lg) ── */}
        <div className="flex lg:hidden items-center justify-between max-w-[1200px] mx-auto px-6 py-2.5">

          {/* Wordmark — italic only */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '20px',
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              OBS Books
            </span>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="text-xs px-2.5 py-1 border border-sand rounded-full font-jost text-bark"
            >
              <span className={lang === 'en' ? 'text-moss font-bold' : ''}>EN</span>
              {' / '}
              <span className={lang === 'th' ? 'text-moss font-bold' : ''}>TH</span>
            </button>
            <button onClick={() => setIsOpen(true)} className="text-lg relative">
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose text-white text-[0.58rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-sans">
                  {count}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5">
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE OVERLAY MENU ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink/30" />
          <div
            className="absolute top-14 right-4 bg-cream border border-sand shadow-soft p-4 min-w-[180px]"
            onClick={e => e.stopPropagation()}
          >
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
            >
              {t('navShop')}
            </Link>
            <Link
              href="/#categories"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
            >
              {t('nCategories')}
            </Link>
            <Link
              href="/#featured"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
            >
              {t('nFeatured')}
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
            >
              {t('navAbout')}
            </Link>
            <div className="border-t border-sand mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
