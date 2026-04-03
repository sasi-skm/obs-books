'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from './LanguageContext'

export default function Footer() {
  const pathname = usePathname()
  const { t } = useLang()

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="py-10 px-6 text-center" style={{ background: '#2c2416' }}>
      <div
        className="font-jost text-sm tracking-widest mb-1"
        style={{ color: '#e0d9c8' }}
      >
        OBS BOOKS
      </div>
      <div
        className="font-cormorant italic mb-4"
        style={{ fontSize: 12, color: '#8a7d65' }}
      >
        {t('aboutQuote')}
      </div>
      <div className="flex justify-center gap-5 mb-4">
        <a href="https://instagram.com/obs_books" target="_blank" rel="noopener noreferrer"
           className="font-jost transition-colors"
           style={{ fontSize: 11, color: '#8a7d65' }}
           onMouseEnter={e => (e.currentTarget.style.color = '#e0d9c8')}
           onMouseLeave={e => (e.currentTarget.style.color = '#8a7d65')}
        >
          Instagram
        </a>
        <a href="https://www.tiktok.com/@obs_books" target="_blank" rel="noopener noreferrer"
           className="font-jost transition-colors"
           style={{ fontSize: 11, color: '#8a7d65' }}
           onMouseEnter={e => (e.currentTarget.style.color = '#e0d9c8')}
           onMouseLeave={e => (e.currentTarget.style.color = '#8a7d65')}
        >
          TikTok
        </a>
        <a href="https://www.facebook.com/obsbooks" target="_blank" rel="noopener noreferrer"
           className="font-jost transition-colors"
           style={{ fontSize: 11, color: '#8a7d65' }}
           onMouseEnter={e => (e.currentTarget.style.color = '#e0d9c8')}
           onMouseLeave={e => (e.currentTarget.style.color = '#8a7d65')}
        >
          Facebook
        </a>
      </div>
      <div className="flex justify-center gap-4 mb-4">
        <Link
          href="/track"
          className="font-jost transition-colors"
          style={{ fontSize: 11, color: '#8a7d65' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e0d9c8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a7d65')}
        >
          {t('trackOrder')}
        </Link>
        <Link
          href="/admin/login"
          className="font-jost transition-colors"
          style={{ fontSize: 11, color: '#3a2e20' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#5a4e3a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a2e20')}
        >
          Admin
        </Link>
      </div>
      <div className="font-jost" style={{ fontSize: 10, color: '#5a4e3a' }}>
        &copy; 2023-{new Date().getFullYear()} OBS Books
      </div>
    </footer>
  )
}
