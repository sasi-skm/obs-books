'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

interface Props {
  bookId: string
  bookTitle: string
}

export default function WishlistHeart({ bookId, bookTitle }: Props) {
  const { user, isWishlisted, addToWishlist, removeFromWishlist } = useAuth()
  const [showTooltip, setShowTooltip] = useState(false)
  const [busy, setBusy] = useState(false)
  const wishlisted = isWishlisted(bookId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 3500)
      return
    }
    if (busy) return
    setBusy(true)
    if (wishlisted) {
      await removeFromWishlist(bookId)
    } else {
      await addToWishlist(bookId, bookTitle)
    }
    setBusy(false)
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={busy}
        className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm transition-all hover:scale-110 disabled:opacity-60"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <span style={{ fontSize: 16, color: wishlisted ? '#4a6741' : '#8a7d65', lineHeight: 1 }}>
          {wishlisted ? '♥' : '♡'}
        </span>
      </button>

      {showTooltip && (
        <div
          className="absolute right-0 top-10 bg-ink text-cream font-jost rounded shadow-lg z-20 whitespace-nowrap"
          style={{ fontSize: 11, padding: '6px 10px' }}
          onClick={e => e.stopPropagation()}
        >
          <Link href="/login" className="underline text-parchment hover:text-cream">Sign in</Link>
          {' '}to save to your wishlist
        </div>
      )}
    </div>
  )
}
