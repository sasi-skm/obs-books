'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/cart/CartContext'
import { Book, Order } from '@/types'
// static QR image used instead of generated promptpay QR

type Tab = 'profile' | 'orders' | 'history' | 'wishlist' | 'subscription' | 'points'

interface WishlistEntry { id: string; book_id: string; book_title: string; added_at: string }
interface PointsTx { id: string; points: number; type: string; created_at: string; reference_id?: string; book_title?: string }
interface ReviewData { id: string; book_title: string; rating: number; status: 'pending' | 'approved' | 'hidden' }
interface Subscription { id: string; plan: string; subscriber_type: string; status: string; expires_at: string; started_at: string; amount_paid: number; currency: string }

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isGood = status === 'shipped' || status === 'delivered' || status === 'confirmed' || status === 'paid'
  return (
    <span
      className="font-jost text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm"
      style={isGood ? { background: '#eef3ec', color: '#3a5832' } : { background: '#fdf0eb', color: '#9b4a2a' }}
    >
      {status}
    </span>
  )
}

function ReviewStatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <span className="font-jost text-[11px] px-1.5 py-0.5 rounded-sm" style={{ background: '#eef3ec', color: '#3a5832' }}>Published</span>
  if (status === 'hidden') return <span className="font-jost text-[11px] px-1.5 py-0.5 rounded-sm" style={{ background: '#f1efe8', color: '#8a7d65' }}>Not published</span>
  return <span className="font-jost text-[11px] px-1.5 py-0.5 rounded-sm" style={{ background: '#fdf0eb', color: '#9b4a2a' }}>Pending approval</span>
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 13, color: '#4a6741', letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          style={{ fontSize: 26, color: (hover || value) >= i ? '#4a6741' : '#d6cdb8', cursor: 'pointer', lineHeight: 1 }}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center justify-center rounded-full font-jost font-semibold text-cream"
      style={{ width: 48, height: 48, background: '#4a6741', fontSize: 18 }}>
      {initials || '?'}
    </div>
  )
}

// ── Slip uploader ─────────────────────────────────────────────────────────────

function SlipUploader({ orderId, onUploaded }: { orderId: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'payment-slips')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload_slip', slip_url: url }),
      })
      setDone(true)
      onUploaded()
    } catch {
      setPreview(null)
    }
    setUploading(false)
  }

  if (done) {
    return (
      <p className="font-jost text-xs text-center" style={{ color: '#4a6741' }}>
        ✓ Payment slip submitted — we will confirm your order shortly.
      </p>
    )
  }

  return (
    <div>
      <p className="font-jost text-xs uppercase tracking-widest mb-2" style={{ color: '#8a7d65' }}>Upload Payment Slip</p>
      <label className="block border border-dashed border-sand p-4 text-center cursor-pointer hover:border-moss transition-colors rounded-sm">
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        {preview ? (
          <div className="max-w-[120px] mx-auto">
            <Image src={preview} alt="Slip preview" width={120} height={160} className="w-full border border-sand" />
          </div>
        ) : (
          <p className="font-jost text-xs text-ink-muted">{uploading ? 'Uploading...' : '📎 Tap to upload slip'}</p>
        )}
      </label>
    </div>
  )
}

// ── Inline review form ────────────────────────────────────────────────────────

function InlineReviewForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (rating: number, comment: string, photos: File[]) => void
  submitting: boolean
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length)
    setPhotos(prev => [...prev, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  return (
    <div className="mt-3 p-4 border border-sand rounded-sm" style={{ background: 'rgba(238,232,216,0.3)' }}>
      <div className="mb-3">
        <p className="font-jost mb-1" style={{ fontSize: 11, color: '#8a7d65' }}>Your rating</p>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your thoughts about this book..."
        rows={3}
        className="w-full px-3 py-2 border border-sand bg-cream font-jost text-sm text-ink outline-none focus:border-moss resize-none rounded-sm mb-2"
      />
      {comment.length > 0 && comment.length < 20 && (
        <p className="font-jost mb-2" style={{ fontSize: 11, color: '#9b4a2a' }}>
          {20 - comment.length} more characters needed
        </p>
      )}

      {previews.length > 0 && (
        <div className="flex gap-2 mb-2">
          {previews.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-sm border border-sand" style={{ width: 48, height: 48 }}>
              <Image src={src} alt="" fill className="object-cover" sizes="48px" />
            </div>
          ))}
        </div>
      )}
      {photos.length < 3 && (
        <label className="block border-dashed border border-sand p-2 text-center cursor-pointer hover:border-moss transition-colors rounded-sm mb-2">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoChange} />
          <span className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>+ Add photos (optional)</span>
        </label>
      )}
      <p className="font-jost mb-3" style={{ fontSize: 11, color: '#8a7d65' }}>
        You&apos;ll earn 20 points for your review, +30 more if you include a photo.
      </p>

      <button
        onClick={() => onSubmit(rating, comment, photos)}
        disabled={submitting || rating === 0 || comment.length < 20}
        className="w-full py-2 bg-moss text-cream font-jost text-xs tracking-wide rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading, refreshProfile, removeFromWishlist } = useAuth()
  const { addItem } = useCart()
  const [tab, setTab] = useState<Tab>('profile')

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', address: '', country: 'TH', dateOfBirth: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const PROMPTPAY_QR = '/images/promptpay-qr.jpg'

  // Reviews (for orders tab)
  const [userReviews, setUserReviews] = useState<Map<string, ReviewData>>(new Map())
  const [expandedReviewBook, setExpandedReviewBook] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  // Popup
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const [unreviewedBooks, setUnreviewedBooks] = useState<string[]>([])

  // Wishlist
  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([])
  const [wishlistBooks, setWishlistBooks] = useState<Record<string, Book>>({})
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Points
  const [pointsTxs, setPointsTxs] = useState<PointsTx[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  // Populate profile form
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.shipping_address?.address || '',
        country: profile.shipping_address?.country || 'TH',
        dateOfBirth: profile.date_of_birth || '',
      })
    }
  }, [profile])

  // Review popup: check once per session
  useEffect(() => {
    if (!user) return
    if (typeof window !== 'undefined') {
      const lastShown = sessionStorage.getItem('obs-review-popup-date')
      if (lastShown && new Date().toDateString() === lastShown) return
    }

    const checkPopup = async () => {
      try {
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          .eq('order_status', 'delivered')

        if (!deliveredOrders || deliveredOrders.length === 0) return

        const { data: reviews } = await supabase
          .from('reviews')
          .select('book_title')
          .eq('user_id', user.id)

        const reviewedSet = new Set((reviews || []).map((r: { book_title: string }) => r.book_title))
        const unreviewed: string[] = []

        for (const order of deliveredOrders) {
          for (const item of (order.items || [])) {
            if (!reviewedSet.has(item.title) && !unreviewed.includes(item.title)) {
              unreviewed.push(item.title)
            }
          }
        }

        if (unreviewed.length > 0) {
          setUnreviewedBooks(unreviewed)
          setShowReviewPopup(true)
          sessionStorage.setItem('obs-review-popup-date', new Date().toDateString())
        }
      } catch {}
    }

    checkPopup()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setOrdersLoading(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
      if (data) {
        setOrders(data as Order[])
      }

      // Fetch user's reviews for status display
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, book_title, rating, status')
        .eq('user_id', user.id)
      if (reviews) {
        const map = new Map<string, ReviewData>()
        reviews.forEach((r: ReviewData) => map.set(r.book_title, r))
        setUserReviews(map)
      }
    } catch {}
    setOrdersLoading(false)
  }, [user])

  const fetchWishlist = useCallback(async () => {
    if (!user) return
    setWishlistLoading(true)
    try {
      const { data: wl } = await supabase
        .from('wishlists').select('*').eq('user_id', user.id).order('added_at', { ascending: false })
      if (wl) {
        setWishlistEntries(wl as WishlistEntry[])
        const bookIds = wl.map((w: WishlistEntry) => w.book_id)
        if (bookIds.length > 0) {
          const { data: books } = await supabase.from('books').select('*').in('id', bookIds)
          if (books) {
            const map: Record<string, Book> = {}
            books.forEach((b: Book) => { map[b.id] = b })
            setWishlistBooks(map)
          }
        }
      }
    } catch {}
    setWishlistLoading(false)
  }, [user])

  const fetchPoints = useCallback(async () => {
    if (!user) return
    setPointsLoading(true)
    try {
      const { data } = await supabase
        .from('points_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setPointsTxs(data as PointsTx[])
    } catch {}
    setPointsLoading(false)
  }, [user])

  const fetchSubscription = useCallback(async () => {
    if (!user) return
    setSubLoading(true)
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'expired'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data) setSubscription(data as Subscription)
    } catch {}
    setSubLoading(false)
  }, [user])

  useEffect(() => {
    if (tab === 'orders' || tab === 'history') fetchOrders()
    if (tab === 'wishlist') fetchWishlist()
    if (tab === 'subscription') fetchSubscription()
    if (tab === 'points') fetchPoints()
  }, [tab, fetchOrders, fetchWishlist, fetchSubscription, fetchPoints])

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profileForm.fullName,
      phone: profileForm.phone,
      shipping_address: { address: profileForm.address, country: profileForm.country },
      date_of_birth: profileForm.dateOfBirth || null,
    })
    await refreshProfile()
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleJoinWaitlist = async (bookId: string, bookTitle: string) => {
    if (!user) return
    await supabase.from('waitlists').insert({ user_id: user.id, book_id: bookId, book_title: bookTitle, email: user.email })
  }

  const handleRemoveWishlist = async (entry: WishlistEntry) => {
    await removeFromWishlist(entry.book_id)
    setWishlistEntries(prev => prev.filter(w => w.id !== entry.id))
  }

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(trackingNumber)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleSubmitReview = async (bookTitle: string, bookId: string, rating: number, comment: string, photos: File[]) => {
    if (!user || rating === 0 || comment.length < 20) return
    setSubmittingReview(true)

    const photoUrls: string[] = []
    for (const photo of photos) {
      try {
        const fd = new FormData()
        fd.append('file', photo)
        fd.append('bucket', 'review-photos')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          if (data.url) photoUrls.push(data.url)
        }
      } catch {}
    }

    await supabase.from('reviews').insert({
      user_id: user.id,
      book_id: parseInt(bookId) || 0,
      book_title: bookTitle,
      rating,
      comment,
      photo_urls: photoUrls,
      status: 'pending',
    })

    setSubmittedReviews(prev => new Set(Array.from(prev).concat(bookTitle)))
    setExpandedReviewBook(null)
    setSubmittingReview(false)
  }

  if (loading || !user) return <div className="min-h-screen bg-cream" />

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'You'
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()
  const points = profile?.points_balance || 0

  const activeOrders = orders.filter(o => ['new', 'paid', 'packing', 'shipped'].includes(o.order_status))
  const deliveredOrders = orders.filter(o => o.order_status === 'delivered')

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'cancelled' } : o))
    } catch {}
    setCancellingOrder(null)
    setCancelConfirmId(null)
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    setCancelling(true)
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', subscription.id)
    setSubscription({ ...subscription, status: 'cancelled' })
    setCancelModal(false)
    setCancelling(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'orders', label: 'Orders' },
    { key: 'history', label: 'Purchase History' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'points', label: 'Points' },
  ]

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-[700px] mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <InitialsAvatar name={profile?.full_name || firstName} />
          <div>
            <h1 className="font-cormorant text-[18px] font-normal text-ink">{profile?.full_name || firstName}</h1>
            <p className="font-jost text-ink-muted" style={{ fontSize: 12 }}>
              Member since {memberYear} &middot; {points} points
            </p>
          </div>
          <button onClick={handleSignOut} className="ml-auto font-jost text-xs text-ink-muted underline underline-offset-2 hover:text-moss">
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sand mb-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-jost text-xs px-4 py-2.5 tracking-wide transition-colors border-b-2 -mb-px ${
                tab === t.key ? 'border-moss text-moss' : 'border-transparent text-bark hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Full Name</label>
                <input value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss" />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Email</label>
                <input value={user.email || ''} disabled
                  className="w-full px-3 py-2.5 border border-sand bg-parchment/50 font-jost text-sm text-ink-muted outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Phone</label>
                <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss" />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Country</label>
                <input value={profileForm.country} onChange={e => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss" />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">
                  Date of Birth <span className="normal-case text-ink-muted text-[10px]">(birthday surprises)</span>
                </label>
                <input type="date" value={profileForm.dateOfBirth} onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss" />
              </div>
            </div>
            <div className="mb-5">
              <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Shipping Address</label>
              <textarea value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                rows={3} className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss resize-y" />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="px-6 py-2.5 bg-moss text-cream font-jost text-xs tracking-wide rounded-sm hover:opacity-90 disabled:opacity-50">
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              {profileSaved && <span className="font-jost text-xs text-moss">Changes saved ✓</span>}
            </div>
          </div>
        )}

        {/* ── Orders Tab (active only) ─────────────────────────────────── */}
        {tab === 'orders' && (
          <div>
            {ordersLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading orders...</p>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-jost text-sm text-ink-muted italic mb-2">No active orders</p>
                <p className="font-jost text-xs text-ink-muted mb-4">Delivered orders are in Purchase History</p>
                <Link href="/shop" className="font-jost text-xs text-moss underline underline-offset-2">Browse our collection</Link>
              </div>
            ) : (
              <div>
                {activeOrders.map((order, idx) => (
                  <div key={order.id} className={`pb-6 mb-6 ${idx < activeOrders.length - 1 ? 'border-b border-sand' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>
                        {order.order_number} &middot; {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <StatusBadge status={order.payment_status} />
                        <StatusBadge status={order.order_status} />
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {order.items.map(item => (
                          <Link key={item.id} href={`/book/${item.book_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            {item.image_url ? (
                              <div className="relative shrink-0 border border-sand overflow-hidden rounded-sm" style={{ width: 44, height: 44 }}>
                                <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="44px" />
                              </div>
                            ) : (
                              <div className="shrink-0 border border-sand bg-parchment flex items-center justify-center rounded-sm" style={{ width: 44, height: 44 }}>
                                <span style={{ fontSize: 18 }}>📖</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-cormorant text-sm font-semibold text-ink leading-tight truncate">{item.title}</p>
                              <p className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>{item.author}</p>
                            </div>
                            <span className="font-jost text-sm text-bark shrink-0">฿{item.price.toLocaleString()}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Payment instructions for unpaid orders */}
                    {order.payment_status === 'pending' && (
                      <div className="mt-3 mb-1 p-4 border border-sand rounded-sm" style={{ background: '#fdf8f2' }}>
                        <p className="font-jost text-xs uppercase tracking-widest mb-3" style={{ color: '#9b4a2a' }}>
                          ⚠ Payment Required
                        </p>
                        {order.payment_method === 'promptpay' ? (
                          <div className="text-center">
                            <p className="font-jost text-xs text-ink-muted mb-1">PromptPay — ศศิวิมล แก้วกมล</p>
                            <p className="font-cormorant text-base font-semibold text-bark mb-3">
                              Amount: ฿{order.total_amount.toLocaleString()}
                            </p>
                            <Image src={PROMPTPAY_QR} alt="PromptPay QR" width={180} height={180} className="mx-auto mb-2" />
                            <p className="font-jost text-xs text-ink-muted">Scan with your banking app to pay</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="font-cormorant text-base font-semibold text-bark">
                              Amount: ฿{order.total_amount.toLocaleString()}
                            </p>
                            <div className="text-sm space-y-1">
                              <p className="font-jost font-semibold text-ink text-xs">KBank / กสิกรไทย</p>
                              <p className="font-jost text-xs text-ink-muted">Account: <span className="font-mono text-ink">021-3-24417-5</span></p>
                              <p className="font-jost text-xs text-ink-muted">Name: ศศิวิมล แก้วกมล</p>
                            </div>
                            <div className="text-sm space-y-1 pt-2 border-t border-sand">
                              <p className="font-jost font-semibold text-ink text-xs">Krungsri / กรุงศรี</p>
                              <p className="font-jost text-xs text-ink-muted">Account: <span className="font-mono text-ink">719-1-26847-2</span></p>
                              <p className="font-jost text-xs text-ink-muted">Name: ศศิวิมล แก้วกมล</p>
                            </div>
                          </div>
                        )}
                        {/* Slip upload */}
                        <div className="mt-4 pt-3 border-t border-sand">
                          <SlipUploader orderId={order.id} onUploaded={() =>
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'uploaded' as const } : o))
                          } />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-sand">
                      <div>
                        {order.tracking_number && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-jost" style={{ fontSize: 12, color: '#8a7d65' }}>
                              Tracking: <span className="font-mono text-ink">{order.tracking_number}</span>
                            </span>
                            <button onClick={() => handleCopyTracking(order.tracking_number!)} className="text-ink-muted hover:text-moss transition-colors" title="Copy">
                              {copied === order.tracking_number ? <span style={{ fontSize: 11, color: '#4a6741' }}>✓</span> : <span style={{ fontSize: 13 }}>⎘</span>}
                            </button>
                            <Link
                              href={`/track?order=${encodeURIComponent(order.order_number)}`}
                              className="font-jost text-xs underline underline-offset-2"
                              style={{ color: '#4a6741' }}
                            >
                              Track Package
                            </Link>
                          </div>
                        )}
                        {order.order_status === 'new' && order.payment_status === 'pending' && (
                          cancelConfirmId === order.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-jost text-xs text-ink-muted">Cancel this order?</span>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrder === order.id}
                                className="font-jost text-xs px-2 py-1 rounded-sm text-white disabled:opacity-50"
                                style={{ background: '#9b4a2a' }}
                              >
                                {cancellingOrder === order.id ? '...' : 'Yes, cancel'}
                              </button>
                              <button
                                onClick={() => setCancelConfirmId(null)}
                                className="font-jost text-xs px-2 py-1 rounded-sm border border-sand text-bark hover:border-moss hover:text-moss transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancelConfirmId(order.id)}
                              className="font-jost text-xs mt-1 underline underline-offset-2"
                              style={{ color: '#9b4a2a' }}
                            >
                              Cancel Order
                            </button>
                          )
                        )}
                      </div>
                      <span className="font-cormorant text-base font-semibold text-ink">฿{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Purchase History Tab (delivered) ────────────────────────────── */}
        {tab === 'history' && (
          <div>
            {ordersLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading...</p>
            ) : deliveredOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-jost text-sm text-ink-muted italic mb-4">No delivered orders yet</p>
                <Link href="/shop" className="font-jost text-xs text-moss underline underline-offset-2">Browse our collection</Link>
              </div>
            ) : (
              <div>
                {deliveredOrders.map((order, idx) => (
                  <div key={order.id} className={`pb-6 mb-6 ${idx < deliveredOrders.length - 1 ? 'border-b border-sand' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>
                        {order.order_number} &middot; {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <StatusBadge status="delivered" />
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {order.items.map(item => (
                          <Link key={item.id} href={`/book/${item.book_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            {item.image_url ? (
                              <div className="relative shrink-0 border border-sand overflow-hidden rounded-sm" style={{ width: 44, height: 44 }}>
                                <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="44px" />
                              </div>
                            ) : (
                              <div className="shrink-0 border border-sand bg-parchment flex items-center justify-center rounded-sm" style={{ width: 44, height: 44 }}>
                                <span style={{ fontSize: 18 }}>📖</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-cormorant text-sm font-semibold text-ink leading-tight truncate">{item.title}</p>
                              <p className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>{item.author}</p>
                            </div>
                            <span className="font-jost text-sm text-bark shrink-0">฿{item.price.toLocaleString()}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-sand">
                      <div className="flex-1" />
                      <span className="font-cormorant text-base font-semibold text-ink">฿{order.total_amount.toLocaleString()}</span>
                    </div>

                    {/* Reviews section */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sand">
                        <p className="font-jost uppercase tracking-widest mb-3" style={{ fontSize: 10, color: '#8a7d65' }}>Your Reviews</p>
                        <div className="space-y-3">
                          {order.items.map(item => {
                            const review = userReviews.get(item.title)
                            const alreadySubmitted = submittedReviews.has(item.title)
                            if (alreadySubmitted) {
                              return (
                                <div key={item.id} className="flex items-center justify-between">
                                  <span className="font-jost text-xs text-ink truncate mr-2">{item.title}</span>
                                  <span className="font-jost text-xs text-moss shrink-0">Review submitted - pending approval</span>
                                </div>
                              )
                            }
                            if (review) {
                              return (
                                <div key={item.id} className="flex items-center gap-2 flex-wrap">
                                  <span className="font-jost text-xs text-ink">{item.title}</span>
                                  <StarDisplay rating={review.rating} />
                                  <ReviewStatusBadge status={review.status} />
                                </div>
                              )
                            }
                            return (
                              <div key={item.id}>
                                <div className="flex items-center justify-between">
                                  <span className="font-jost text-xs text-ink truncate mr-2">{item.title}</span>
                                  <button
                                    onClick={() => setExpandedReviewBook(expandedReviewBook === item.title ? null : item.title)}
                                    className="font-jost text-xs text-moss underline underline-offset-2 shrink-0 hover:opacity-70"
                                  >
                                    {expandedReviewBook === item.title ? 'Cancel' : 'Leave a review'}
                                  </button>
                                </div>
                                {expandedReviewBook === item.title && (
                                  <InlineReviewForm
                                    onSubmit={(rating, comment, photos) => handleSubmitReview(item.title, item.book_id, rating, comment, photos)}
                                    submitting={submittingReview}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Wishlist Tab ─────────────────────────────────────────────────── */}
        {tab === 'wishlist' && (
          <div>
            {wishlistLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading wishlist...</p>
            ) : wishlistEntries.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-jost text-sm text-ink-muted italic mb-4">Your wishlist is empty</p>
                <Link href="/shop" className="font-jost text-xs text-moss underline underline-offset-2">Browse our collection</Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {wishlistEntries.map(entry => {
                  const book = wishlistBooks[entry.book_id]
                  const isSold = !book || book.status === 'sold' || book.copies <= 0
                  return (
                    <div key={entry.id} className="bg-cream border border-sand rounded-sm overflow-hidden relative">
                      <button
                        onClick={() => handleRemoveWishlist(entry)}
                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                        title="Remove from wishlist"
                      >
                        <span style={{ color: '#4a6741', fontSize: 14 }}>♥</span>
                      </button>
                      <Link href={book ? `/book/${book.id}` : '#'}>
                        <div className="aspect-square overflow-hidden relative">
                          {book?.image_url ? (
                            <Image src={book.image_url} alt={entry.book_title} fill className="object-cover" sizes="200px" />
                          ) : (
                            <div className="w-full h-full bg-parchment flex items-center justify-center">
                              <span className="text-3xl">📖</span>
                            </div>
                          )}
                          {isSold && (
                            <div className="absolute top-2 left-2 bg-rose text-white text-[10px] px-1.5 py-0.5 font-jost">Sold</div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-cormorant text-sm text-ink leading-tight mb-0.5 line-clamp-2">{entry.book_title}</h3>
                          {book && <p className="font-cormorant text-base font-semibold text-bark">฿{book.price.toLocaleString()}</p>}
                        </div>
                      </Link>
                      <div className="px-3 pb-3">
                        {!isSold && book ? (
                          <button
                            onClick={() => addItem({ id: book.id + '-' + (book.condition || 'Like New'), bookId: book.id, title: book.title, author: book.author, price: book.price, image_url: book.image_url, category: book.category, condition: book.condition, quantity: 1 })}
                            className="w-full py-1.5 bg-moss text-cream font-jost text-[11px] tracking-wide rounded-sm hover:opacity-90"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => book && handleJoinWaitlist(book.id, book.title)}
                            className="w-full py-1.5 border border-moss text-moss font-jost text-[11px] tracking-wide rounded-sm hover:bg-moss hover:text-cream transition-colors"
                          >
                            Join Waitlist
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Subscription Tab ─────────────────────────────────────────────── */}
        {tab === 'subscription' && (
          <div>
            {subLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading...</p>
            ) : !subscription || subscription.status === 'cancelled' ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-4">🌸</p>
                <h2 className="font-cormorant text-2xl font-normal text-ink mb-2">Join The Flower Letter</h2>
                <p className="font-jost text-sm text-bark leading-relaxed mb-6 max-w-xs mx-auto">
                  Subscribe to receive a monthly botanical letter and exclusive member benefits.
                </p>
                <Link href="/subscribe" className="inline-block px-8 py-3 bg-moss text-cream font-jost text-xs tracking-wide hover:opacity-90">
                  Subscribe Now
                </Link>
              </div>
            ) : subscription.status === 'expired' ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-4">🌿</p>
                <h2 className="font-cormorant text-2xl font-normal text-ink mb-2">Your Subscription Has Ended</h2>
                <div className="inline-block mb-4">
                  <span className="font-jost text-xs px-2 py-0.5 rounded-sm" style={{ background: '#f1efe8', color: '#8a7d65' }}>Expired</span>
                </div>
                <p className="font-jost text-sm text-bark mb-6">Thank you for being part of our botanical community. Come back anytime.</p>
                <Link href="/subscribe" className="inline-block px-8 py-3 bg-moss text-cream font-jost text-xs tracking-wide hover:opacity-90">
                  Resubscribe
                </Link>
              </div>
            ) : (
              <div>
                {/* Active subscription */}
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="font-cormorant text-xl font-normal text-ink">The Flower Letter</h2>
                  <span className="font-jost text-[10px] px-2 py-0.5 rounded-sm" style={{ background: '#eef3ec', color: '#3a5832' }}>Active</span>
                </div>

                <div className="p-5 border border-sand bg-parchment mb-5">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="font-jost text-ink-muted mb-0.5" style={{ fontSize: 11 }}>Plan</p>
                      <p className="font-cormorant text-base font-semibold text-ink">
                        {subscription.plan === 'monthly' ? 'Monthly' : subscription.plan === '6months' ? '6 Months' : '1 Year'}
                      </p>
                    </div>
                    <div>
                      <p className="font-jost text-ink-muted mb-0.5" style={{ fontSize: 11 }}>Type</p>
                      <p className="font-cormorant text-base font-semibold text-ink capitalize">{subscription.subscriber_type}</p>
                    </div>
                    <div>
                      <p className="font-jost text-ink-muted mb-0.5" style={{ fontSize: 11 }}>Amount Paid</p>
                      <p className="font-cormorant text-base font-semibold text-ink">
                        {subscription.currency === 'THB' ? '฿' : '$'}{Number(subscription.amount_paid).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-jost text-ink-muted mb-0.5" style={{ fontSize: 11 }}>Renews / Expires</p>
                      <p className="font-cormorant text-base font-semibold text-ink">
                        {new Date(subscription.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Days remaining bar */}
                  {(() => {
                    const total = new Date(subscription.expires_at).getTime() - new Date(subscription.started_at).getTime()
                    const elapsed = Date.now() - new Date(subscription.started_at).getTime()
                    const pct = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100))
                    const daysLeft = Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
                    return (
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-jost text-xs text-ink-muted">Time remaining</span>
                          <span className="font-jost text-xs text-moss">{daysLeft} days</span>
                        </div>
                        <div className="w-full h-1.5 bg-sand rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Benefits reminder */}
                <div className="mb-6 space-y-2">
                  <p className="font-jost text-xs text-ink-muted uppercase tracking-widest mb-3">Your Benefits</p>
                  {['5% discount on orders over ฿1,000 — applied automatically', 'Birthday 10% gift code sent at the start of your birthday month', 'Monthly lottery entry — one member wins a curated gift'].map(b => (
                    <div key={b} className="flex items-start gap-2">
                      <span className="text-moss" style={{ fontSize: 10, marginTop: 3 }}>●</span>
                      <p className="font-jost text-xs text-bark">{b}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Link href="/subscribe" className="px-5 py-2 border border-moss text-moss font-jost text-xs tracking-wide hover:bg-moss hover:text-cream transition-colors">
                    Renew Early
                  </Link>
                  <button
                    onClick={() => setCancelModal(true)}
                    className="font-jost text-ink-muted hover:text-rose transition-colors"
                    style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Points Tab ───────────────────────────────────────────────────── */}
        {tab === 'points' && (
          <div>
            <div className="text-center mb-8">
              <div className="font-cormorant text-[52px] font-normal text-ink leading-none">{points}</div>
              <div className="font-jost text-bark mt-1" style={{ fontSize: 12 }}>points balance</div>
              <div className="font-jost text-ink-muted mt-1" style={{ fontSize: 11 }}>100 points = ฿50 discount</div>
            </div>

            {points >= 100 ? (
              <div className="mb-6 p-4 rounded-sm text-center" style={{ background: '#eef3ec', border: '1px solid #4a6741' }}>
                <p className="font-jost text-sm font-semibold" style={{ color: '#3a5832' }}>
                  🎉 You have a ฿50 reward ready to use at checkout
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-sm text-center bg-parchment border border-sand">
                <p className="font-jost text-xs text-ink-muted">
                  You need {100 - points} more points to redeem
                </p>
                <p className="font-jost text-xs text-ink-muted mt-1">
                  Earn points by leaving reviews on your purchases
                </p>
              </div>
            )}

            {pointsLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading...</p>
            ) : pointsTxs.length === 0 ? (
              <p className="font-jost text-sm text-ink-muted italic text-center">No transactions yet</p>
            ) : (
              <div className="border border-sand divide-y divide-sand">
                {pointsTxs.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center px-4 py-3">
                    <div>
                      <p className="font-jost text-xs text-ink">
                        {tx.type === 'earned_review'
                          ? (tx.book_title ? `Review: ${tx.book_title}` : 'Review submitted')
                          : tx.type === 'earned_photo'
                          ? (tx.book_title ? `Photo bonus: ${tx.book_title}` : 'Photo review')
                          : tx.type === 'redeemed'
                          ? 'Redeemed at checkout'
                          : tx.type === 'signup_bonus'
                          ? 'Welcome bonus'
                          : tx.type}
                      </p>
                      <p className="font-jost text-ink-muted" style={{ fontSize: 10 }}>
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-jost text-sm font-semibold" style={{ color: tx.points > 0 ? '#4a6741' : '#9b4a2a' }}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cancel Subscription Modal ────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(44,36,22,0.4)' }} onClick={() => setCancelModal(false)}>
          <div className="bg-cream border border-sand rounded-sm max-w-[380px] w-full p-8 shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="font-cormorant text-xl font-normal text-ink mb-2">Cancel Subscription?</h2>
            <p className="font-jost text-sm text-bark leading-relaxed mb-6">
              You will keep your benefits until your subscription expires. You can always resubscribe later.
            </p>
            <div className="flex gap-3">
              <button onClick={handleCancelSubscription} disabled={cancelling}
                className="flex-1 py-2.5 bg-rose text-white font-jost text-xs tracking-wide hover:opacity-90 disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button onClick={() => setCancelModal(false)} className="flex-1 py-2.5 border border-sand text-bark font-jost text-xs hover:border-moss hover:text-moss transition-colors">
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Popup ─────────────────────────────────────────────────── */}
      {showReviewPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(44,36,22,0.4)' }}
          onClick={() => setShowReviewPopup(false)}
        >
          <div
            className="bg-cream border border-sand rounded-sm max-w-[420px] w-full p-8 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-cormorant text-[22px] font-normal text-ink mb-1">
              Your books have been delivered!
            </h2>
            <p className="font-jost mb-4" style={{ fontSize: 11, color: '#8a7d65' }}>— ✦ —</p>
            <p className="font-jost text-sm text-bark leading-relaxed mb-4">
              Share your thoughts and earn loyalty points — 20 points per review, 50 points if you include a photo. 100 points = ฿50 discount on your next order.
            </p>

            <div className="mb-5 space-y-1">
              {unreviewedBooks.slice(0, 3).map(title => (
                <p key={title} className="font-jost text-xs text-ink flex items-center gap-1.5">
                  <span style={{ color: '#4a6741', fontSize: 10 }}>●</span>
                  {title}
                </p>
              ))}
              {unreviewedBooks.length > 3 && (
                <p className="font-jost text-xs text-ink-muted">+ {unreviewedBooks.length - 3} more</p>
              )}
            </div>

            <button
              onClick={() => {
                setShowReviewPopup(false)
                setTab('history')
              }}
              className="w-full py-2.5 bg-moss text-cream font-jost text-sm tracking-wide rounded-sm hover:opacity-90 mb-3"
            >
              Write a Review
            </button>
            <button
              onClick={() => setShowReviewPopup(false)}
              className="w-full text-center font-jost"
              style={{ fontSize: 12, color: '#8a7d65' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
