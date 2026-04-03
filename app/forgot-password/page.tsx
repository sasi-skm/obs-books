'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="font-cormorant text-[32px] font-normal text-ink mb-1">Reset Your Password</h1>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em]">— ✦ —</p>
        </div>

        {sent ? (
          <div className="bg-cream border border-sand p-8 text-center">
            <p className="text-2xl mb-3">✉️</p>
            <p className="font-cormorant text-xl text-moss mb-2">Check your email</p>
            <p className="font-jost text-sm text-bark leading-relaxed mb-5">
              We&apos;ve sent a reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
            </p>
            <Link href="/login" className="font-jost text-xs text-moss underline underline-offset-2">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-cream border border-sand p-8">
            <p className="font-jost text-sm text-bark leading-relaxed mb-5">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div className="mb-5">
              <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors"
              />
            </div>

            {error && (
              <p className="font-jost text-xs mb-4" style={{ color: '#9b4a2a' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-moss text-cream font-jost text-sm tracking-wide rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-4">
              <Link href="/login" className="font-jost text-xs text-ink-muted underline underline-offset-2 hover:text-moss">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
