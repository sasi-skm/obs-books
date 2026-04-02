'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from './LanguageContext'
import { useCart } from '../cart/CartContext'

const NAV_ITEMS = [
  { key: 'nFeatured', href: '/#featured' },
  { key: 'nCategories', href: '/#categories' },
  { key: 'nShop', href: '/shop' },
  { key: 'nAbout', href: '/#about' },
  { key: 'nContact', href: '/#contact' },
]

export default function Nav() {
  const { lang, setLang, t } = useLang()
  const { count, setIsOpen } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-cream/95 backdrop-blur-md border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-heading text-xl font-semibold tracking-wider text-ink hover:text-sage transition-colors">
            OBS BOOKS
            <span className="block font-light italic text-[0.62rem] text-sage -mt-0.5">
              {t('tagline')}
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex gap-5 items-center list-none">
            {NAV_ITEMS.map(item => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="font-heading text-sm text-ink-light hover:text-sage transition-colors"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => setIsOpen(true)}
                className="font-heading text-lg relative hover:text-sage transition-colors"
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
                className="text-xs px-3 py-1 border border-line rounded-full hover:bg-sage-muted transition-colors font-heading text-ink-light"
              >
                <span className={lang === 'en' ? 'text-sage font-bold' : ''}>EN</span>
                {' / '}
                <span className={lang === 'th' ? 'text-sage font-bold' : ''}>TH</span>
              </button>
            </li>
          </ul>

          {/* Mobile controls */}
          <div className="flex md:hidden gap-2 items-center">
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="text-xs px-2.5 py-1 border border-line rounded-full font-heading text-ink-light"
            >
              <span className={lang === 'en' ? 'text-sage font-bold' : ''}>EN</span>
              {' / '}
              <span className={lang === 'th' ? 'text-sage font-bold' : ''}>TH</span>
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="text-lg relative"
            >
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose text-white text-[0.58rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-sans">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5"
            >
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
              <span className="block w-5 h-[1.5px] bg-ink my-1" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink/30" />
          <div className="absolute top-14 right-4 bg-offwhite border border-line shadow-soft p-4 min-w-[180px]" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-heading text-sm text-ink-light hover:text-sage transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
