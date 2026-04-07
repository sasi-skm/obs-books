'use client'

import Link from 'next/link'
import { useLang } from '../layout/LanguageContext'

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="3.2" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="17.2" cy="6.8" r="1" fill="white" />
    </svg>
  )
}

function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.79 1.54V6.98a4.85 4.85 0 0 1-1.02-.29z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="20" height="20" x="2" y="2" rx="6" fill="#6B7F5E" />
      <path d="M6 8l6 5 6-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="6" y="8" width="12" height="8" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

const SOCIALS = [
  { icon: <IgIcon />,     name: 'Instagram', handle: '@obs_books', href: 'https://instagram.com/obs_books' },
  { icon: <FbIcon />,     name: 'Facebook',  handle: 'OBS Books',  href: 'https://www.facebook.com/obsbooks' },
  { icon: <TikTokIcon />, name: 'TikTok',    handle: '@obs_books', href: 'https://www.tiktok.com/@obs_books' },
]

export default function ContactSection() {
  const { t } = useLang()

  return (
    <section className="py-16 px-6 bg-parchment text-center" id="contact">
      <div className="text-center mb-10">
        <p className="font-jost text-[11px] uppercase tracking-widest text-ink-muted mb-2">Bangkok, Thailand</p>
        <h2 className="font-cormorant text-[clamp(1.6rem,3vw,2.3rem)] font-normal text-ink">{t('findUsTitle')}</h2>
        <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em] my-3 select-none">— ✦ —</p>
        <p className="font-jost text-sm text-ink-muted max-w-[480px] mx-auto mt-2">{t('findUsSub')}</p>
      </div>

      {/* Social cards — 2x2 grid */}
      <div className="max-w-[600px] mx-auto grid grid-cols-2 gap-4 mb-4">
        {SOCIALS.map(s => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cream p-6 border border-sand rounded-sm text-center transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-moss"
          >
            <div className="flex justify-center mb-2">{s.icon}</div>
            <h3 className="font-heading text-base font-medium mb-0.5 text-ink">{s.name}</h3>
            <p className="font-jost text-xs text-ink-muted">{s.handle}</p>
          </a>
        ))}

        {/* Email support card */}
        <a
          href="mailto:obsbooksstore@gmail.com"
          className="bg-cream p-6 border border-sand rounded-sm text-center transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-moss"
        >
          <div className="flex justify-center mb-2"><EmailIcon /></div>
          <h3 className="font-heading text-base font-medium mb-0.5 text-ink">{t('emailSupport')}</h3>
          <p className="font-jost text-xs text-ink-muted">obsbooksstore@gmail.com</p>
          <p className="font-jost text-[10px] text-moss mt-1">{t('emailSupportSub')}</p>
        </a>
      </div>

      {/* Track Order — full width */}
      <div className="max-w-[600px] mx-auto">
        <Link
          href="/track"
          className="flex items-center justify-center gap-3 bg-cream p-5 border border-sand rounded-sm text-center transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-moss w-full"
        >
          <span className="text-2xl">📦</span>
          <div className="text-left">
            <h3 className="font-heading text-base font-medium text-ink">{t('trackOrder')}</h3>
            <p className="font-jost text-xs text-moss">{t('shippedMonday')}</p>
          </div>
        </Link>
      </div>
    </section>
  )
}
