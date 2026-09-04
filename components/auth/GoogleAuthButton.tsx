'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/components/layout/LanguageContext'

/**
 * Turn the `?redirect=` query param the login/signup pages already accept
 * (checkout links to `/signup?redirect=checkout`) into an absolute same-origin
 * URL for Supabase to send the browser back to.
 *
 * Anything that is not a plain same-site path is dropped and we fall back to
 * `/account`, so `?redirect=https://example.com` cannot turn the sign-in button
 * into an open redirect.
 */
export function googleRedirectTarget(search: string, origin: string): string {
  let path = '/account'
  try {
    const raw = new URLSearchParams(search).get('redirect')
    const trimmed = raw ? raw.trim() : ''
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    const isProtocolRelative = /^[/\\]{2}/.test(trimmed)
    if (trimmed && !isAbsolute && !isProtocolRelative) {
      path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    }
  } catch {}
  return `${origin}${path}`
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.43 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

/**
 * "Continue with Google" button plus the "or" divider that separates it from
 * the email form underneath. Used by /login and /signup.
 *
 * The browser client (lib/supabase.ts) is a plain supabase-js client, whose
 * default flowType is `implicit`, so Google sends the session back in the URL
 * hash and `detectSessionInUrl` (on by default) picks it up when the landing
 * page loads. No /auth/callback route is involved.
 */
export default function GoogleAuthButton() {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: googleRedirectTarget(window.location.search, window.location.origin),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    if (authError) {
      setError(t('googleAuthError'))
      setLoading(false)
    }
    // On success the browser is navigating away to Google, so the button is
    // deliberately left in its loading state.
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 border border-moss text-moss font-jost text-sm tracking-wide rounded-sm hover:bg-moss/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5"
      >
        <GoogleMark />
        <span>{loading ? t('googleAuthLoading') : t('googleAuthCta')}</span>
      </button>

      {error && (
        <p className="font-jost text-xs mt-3 text-center" style={{ color: '#9b4a2a' }}>{error}</p>
      )}

      <div className="flex items-center gap-3 mt-6" aria-hidden="true">
        <span className="h-px flex-1 bg-sand" />
        <span className="font-jost text-[11px] uppercase tracking-[0.2em] text-ink-muted">{t('authOr')}</span>
        <span className="h-px flex-1 bg-sand" />
      </div>
    </div>
  )
}
