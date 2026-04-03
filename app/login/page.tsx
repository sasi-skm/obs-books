'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      router.push(redirect)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="font-cormorant text-[32px] font-normal text-ink mb-1">Welcome Back</h1>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em]">— ✦ —</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-cream border border-sand p-8">
          <div className="mb-4">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors"
            />
          </div>
          <div className="mb-5">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-5 space-y-2">
          <p className="font-jost text-xs text-bark">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-moss underline underline-offset-2">Create one</Link>
          </p>
          <p>
            <Link href="/forgot-password" className="font-jost text-xs text-ink-muted underline underline-offset-2 hover:text-moss">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LoginForm />
    </Suspense>
  )
}
