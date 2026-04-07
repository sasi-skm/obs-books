'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from './LanguageContext'
import { useCart } from '../cart/CartContext'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { key: 'nFeatured', href: '/#featured' },
  { key: 'nCategories', href: '/#categories' },
  { key: 'navShop', href: '/shop' },
  { key: 'nShipping', href: '/shipping' },
  { key: 'navAbout', href: '/#about' },
  { key: 'navContact', href: '/#contact' },
  { key: 'nFlowerLetter', href: '/subscribe' },
]

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

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-cream/95 backdrop-blur-md border-b border-sand">
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-jost text-sm font-medium tracking-widest text-ink hover:text-moss transition-colors">
            OBS BOOKS
            <span className="block font-cormorant italic text-[10px] text-ink-muted -mt-0.5">
              {t('tagline')}
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex gap-5 items-center list-none">
            {NAV_ITEMS.map(item => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="font-jost text-xs text-bark tracking-wide hover:text-ink transition-colors"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}

            {/* Auth */}
            {user ? (
              <li className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="font-jost text-xs text-bark tracking-wide hover:text-ink transition-colors flex items-center gap-1"
                >
                  Hi, {firstName}
                  <span className="text-[10px] text-ink-muted">▾</span>
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
              <li>
                <Link href="/login" className="font-jost text-xs text-bark tracking-wide hover:text-ink transition-colors">
                  Sign In
                </Link>
              </li>
            )}

            <li>
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
            </li>
            <li>
              <button
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="text-xs px-3 py-1 border border-sand rounded-full hover:bg-parchment transition-colors font-jost text-bark"
              >
                <span className={lang === 'en' ? 'text-moss font-bold' : ''}>EN</span>
                {' / '}
                <span className={lang === 'th' ? 'text-moss font-bold' : ''}>TH</span>
              </button>
            </li>
          </ul>

          {/* Mobile controls */}
          <div className="flex md:hidden gap-2 items-center">
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink/30" />
          <div className="absolute top-14 right-4 bg-cream border border-sand shadow-soft p-4 min-w-[180px]" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="border-t border-sand mt-2 pt-2">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors">
                    My Account
                  </Link>
                  <button onClick={handleSignOut}
                    className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="block py-2 font-jost text-xs text-bark hover:text-moss transition-colors">
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
