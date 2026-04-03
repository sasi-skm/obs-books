'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update profile with full name (trigger already created the row)
      await supabase.from('profiles')
        .upsert({ id: data.user.id, email: form.email, full_name: form.fullName })

      // Link any guest orders with matching email to this new account
      try {
        await supabase.from('orders')
          .update({ user_id: data.user.id })
          .eq('customer_email', form.email)
          .is('user_id', null)
      } catch {}
    }

    setLoading(false)
    router.push('/account')
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="font-cormorant text-[32px] font-normal text-ink mb-1">Create Your Account</h1>
          <p className="font-jost text-[11px] text-ink-muted tracking-[0.3em]">— ✦ —</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-cream border border-sand p-8">
          <div className="mb-4">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors"
            />
          </div>
          <div className="mb-5">
            <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="font-jost text-xs text-bark">
            Already have an account?{' '}
            <Link href="/login" className="text-moss underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
