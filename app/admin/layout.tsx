'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Books', href: '/admin/books', icon: '📚' },
  { label: 'Linens', href: '/admin/linens', icon: '🧵' },
  { label: 'Orders', href: '/admin/orders', icon: '📋' },
  { label: 'Reviews', href: '/admin/reviews', icon: '⭐' },
  { label: 'Customers', href: '/admin/customers', icon: '👤' },
  { label: 'Vouchers', href: '/admin/vouchers', icon: '🏷️' },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: '🌸' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingSlips, setPendingSlips] = useState(0)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'uploaded')
        .then(({ count }) => { if (count) setPendingSlips(count) })
    }
  }, [])

  // Skip auth check on login page
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false)
      return
    }

    const checkAuth = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/admin/login')
          return
        }
        // Block anyone who isn't the owner
        if (session.user.email !== 'sasiwimolskm@gmail.com') {
          await supabase.auth.signOut()
          router.push('/admin/login')
          return
        }
      } else {
        const auth = localStorage.getItem('obs-admin-auth')
        if (!auth) {
          router.push('/admin/login')
          return
        }
      }
      setChecking(false)
    }

    checkAuth()
  }, [isLoginPage, router])

  if (isLoginPage) return <>{children}</>
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink-muted font-heading">Loading...</p>
      </div>
    )
  }

  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('obs-admin-auth')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-parchment pt-14">
      {/* Admin top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-ink text-parchment px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-parchment text-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <Link href="/admin" className="font-heading text-sm tracking-wider">
            OBS BOOKS ADMIN
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-parchment/60 hover:text-parchment" target="_blank">
            View Site →
          </Link>
          <button onClick={handleLogout} className="text-xs text-parchment/60 hover:text-parchment">
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-offwhite border-r border-line z-40
          transition-transform md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 font-heading text-sm transition-colors rounded ${
                  pathname === item.href
                    ? 'bg-sage/10 text-sage font-medium'
                    : 'text-ink-light hover:text-sage hover:bg-sage/5'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
                {item.label === 'Orders' && pendingSlips > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose text-white">{pendingSlips}</span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-ink/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
