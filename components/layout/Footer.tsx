'use client'

import Link from 'next/link'
import { useLang } from './LanguageContext'

export default function Footer() {
  const { t } = useLang()

  return (
    <footer className="bg-ink text-parchment py-10 px-6 text-center">
      <div className="font-heading text-xl tracking-widest mb-1">OBS BOOKS</div>
      <div className="text-xs text-ink-muted italic mb-4">{t('aboutQuote')}</div>
      <div className="flex justify-center gap-5 mb-4">
        <a href="https://instagram.com/obs_books" target="_blank" rel="noopener noreferrer"
           className="text-parchment/60 hover:text-parchment font-heading text-sm transition-opacity">
          Instagram
        </a>
        <a href="https://www.tiktok.com/@obs_books" target="_blank" rel="noopener noreferrer"
           className="text-parchment/60 hover:text-parchment font-heading text-sm transition-opacity">
          TikTok
        </a>
        <a href="https://www.facebook.com/profile.php?id=122100382010460957" target="_blank" rel="noopener noreferrer"
           className="text-parchment/60 hover:text-parchment font-heading text-sm transition-opacity">
          Facebook
        </a>
      </div>
      <div className="flex justify-center gap-4 mb-4">
        <Link href="/track" className="text-parchment/40 hover:text-parchment font-heading text-xs transition-opacity">
          {t('trackOrder')}
        </Link>
        <Link href="/admin/login" className="text-parchment/20 hover:text-parchment/40 font-heading text-xs transition-opacity">
          Admin
        </Link>
      </div>
      <div className="text-[0.68rem] text-ink-muted/40">
        &copy; 2023-{new Date().getFullYear()} OBS Books
      </div>
    </footer>
  )
}
