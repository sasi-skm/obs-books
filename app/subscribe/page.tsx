'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase
      .from('subscriber_waitlist')
      .insert({ email: email.trim().toLowerCase() })

    if (error) {
      if (error.code === '23505') {
        // Already on the list - treat as success
        setStatus('done')
      } else {
        setErrorMsg('Something went wrong. Please try again.')
        setStatus('error')
      }
    } else {
      setStatus('done')
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6 pt-20">
      <div className="max-w-md w-full text-center py-20">
        <div className="text-4xl mb-6">🌿</div>

        <h1 className="font-cormorant text-4xl text-ink mb-4">
          The Flower Letter
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-16 bg-sand block" />
          <span className="font-cormorant italic text-ink-muted text-lg">- * -</span>
          <span className="h-px w-16 bg-sand block" />
        </div>

        <p className="font-crimson text-lg text-bark leading-relaxed mb-10">
          A monthly botanical letter for book lovers.
          <br />
          Launching soon - stay tuned.
        </p>

        {status === 'done' ? (
          <div className="bg-parchment border border-sand px-6 py-5">
            <p className="font-cormorant italic text-xl text-moss mb-1">You are on the list.</p>
            <p className="font-crimson text-bark text-sm">
              We will let you know as soon as The Flower Letter launches.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="font-jost text-xs text-bark tracking-wide uppercase mb-4">
              Join the waiting list
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-white border border-sand font-crimson text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors"
            />
            {status === 'error' && (
              <p className="font-crimson text-sm text-rose">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-moss text-cream font-jost text-xs tracking-widest uppercase hover:bg-bark transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Saving...' : 'Notify Me'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
