'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Try Supabase auth if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
      } else {
        // Dev mode: accept any login
        if (!email || !password) {
          setError('Please enter email and password')
          setLoading(false)
          return
        }
        localStorage.setItem('obs-admin-auth', 'true')
      }
      router.push('/admin')
    } catch {
      setError('Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-normal mb-1">OBS Books Admin</h1>
          <div className="divider divider-cream" />
        </div>

        <form onSubmit={handleLogin} className="bg-offwhite border border-line p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose/10 border border-rose/20 text-rose text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block font-heading text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block font-heading text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
