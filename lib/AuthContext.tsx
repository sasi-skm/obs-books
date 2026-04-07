'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  shipping_address?: { address?: string; country?: string }
  points_balance: number
  date_of_birth?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  wishlistIds: Set<string>
  addToWishlist: (bookId: string, bookTitle: string) => Promise<void>
  removeFromWishlist: (bookId: string) => Promise<void>
  isWishlisted: (bookId: string) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setProfile(data as Profile)
    } catch {}
  }

  const fetchWishlist = async (userId: string) => {
    try {
      const { data } = await supabase.from('wishlists').select('book_id').eq('user_id', userId)
      if (data) setWishlistIds(new Set(Array.from(data.map((w: { book_id: string }) => w.book_id))))
    } catch {}
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchWishlist(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchWishlist(session.user.id)
      } else {
        setProfile(null)
        setWishlistIds(new Set())
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const addToWishlist = async (bookId: string, bookTitle: string) => {
    if (!user) return
    try {
      await supabase.from('wishlists').insert({ user_id: user.id, book_id: bookId, book_title: bookTitle })
      setWishlistIds(prev => { const n = new Set(Array.from(prev)); n.add(bookId); return n })
    } catch {}
  }

  const removeFromWishlist = async (bookId: string) => {
    if (!user) return
    try {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', bookId)
      setWishlistIds(prev => { const n = new Set(prev); n.delete(bookId); return n })
    } catch {}
  }

  const isWishlisted = (bookId: string) => wishlistIds.has(bookId)

  return (
    <AuthContext.Provider value={{ user, profile, loading, wishlistIds, addToWishlist, removeFromWishlist, isWishlisted, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
