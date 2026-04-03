'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/components/cart/CartContext'
import { Book, Order } from '@/types'

type Tab = 'profile' | 'orders' | 'wishlist' | 'points'

interface WishlistEntry { id: string; book_id: string; book_title: string; added_at: string }
interface PointsTx { id: string; points: number; type: string; created_at: string; reference_id?: string }

function StatusBadge({ status }: { status: string }) {
  const isShipped = status === 'shipped' || status === 'delivered'
  return (
    <span
      className="font-jost text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm"
      style={isShipped
        ? { background: '#eef3ec', color: '#3a5832' }
        : { background: '#fdf0eb', color: '#9b4a2a' }}
    >
      {status}
    </span>
  )
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="flex items-center justify-center rounded-full font-jost font-semibold text-cream"
      style={{ width: 48, height: 48, background: '#4a6741', fontSize: 18 }}
    >
      {initials || '?'}
    </div>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading, refreshProfile, removeFromWishlist } = useAuth()
  const { addItem } = useCart()
  const [tab, setTab] = useState<Tab>('profile')

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', address: '', country: 'TH' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Wishlist
  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([])
  const [wishlistBooks, setWishlistBooks] = useState<Record<string, Book>>({})
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Points
  const [pointsTxs, setPointsTxs] = useState<PointsTx[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Populate profile form
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.shipping_address?.address || '',
        country: profile.shipping_address?.country || 'TH',
      })
    }
  }, [profile])

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setOrdersLoading(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as Order[])
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

  useEffect(() => {
    if (tab === 'orders') fetchOrders()
    if (tab === 'wishlist') fetchWishlist()
    if (tab === 'points') fetchPoints()
  }, [tab, fetchOrders, fetchWishlist, fetchPoints])

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profileForm.fullName,
      phone: profileForm.phone,
      shipping_address: { address: profileForm.address, country: profileForm.country },
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
    await supabase.from('waitlists').insert({
      user_id: user.id,
      book_id: bookId,
      book_title: bookTitle,
      email: user.email,
    })
  }

  const handleRemoveWishlist = async (entry: WishlistEntry) => {
    await removeFromWishlist(entry.book_id)
    setWishlistEntries(prev => prev.filter(w => w.id !== entry.id))
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-cream" />
  }

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'You'
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()
  const points = profile?.points_balance || 0

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'orders', label: 'Orders' },
    { key: 'wishlist', label: 'Wishlist' },
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
          <button
            onClick={handleSignOut}
            className="ml-auto font-jost text-xs text-ink-muted underline underline-offset-2 hover:text-moss"
          >
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
                tab === t.key
                  ? 'border-moss text-moss'
                  : 'border-transparent text-bark hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Full Name</label>
                <input
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Email</label>
                <input
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 border border-sand bg-parchment/50 font-jost text-sm text-ink-muted outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Country</label>
                <input
                  value={profileForm.country}
                  onChange={e => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block font-jost text-xs uppercase tracking-wide text-bark mb-1.5">Shipping Address</label>
              <textarea
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss resize-y"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-6 py-2.5 bg-moss text-cream font-jost text-xs tracking-wide rounded-sm hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              {profileSaved && (
                <span className="font-jost text-xs text-moss">Changes saved ✓</span>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            {ordersLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-jost text-sm text-ink-muted italic mb-4">No orders yet</p>
                <Link href="/shop" className="font-jost text-xs text-moss underline underline-offset-2">
                  Browse our collection
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="border border-sand p-4 bg-parchment/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-jost text-xs font-semibold text-ink tracking-wide">{order.order_number}</span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.order_status} />
                        <span className="font-jost text-xs text-bark">
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs font-jost text-bark">
                            <span className="truncate mr-4">{item.title}</span>
                            <span className="flex-shrink-0">฿{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-sand">
                      <span className="font-jost text-xs text-ink-muted">Total</span>
                      <span className="font-cormorant text-base font-semibold text-bark">฿{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tab === 'wishlist' && (
          <div>
            {wishlistLoading ? (
              <p className="font-jost text-sm text-ink-muted italic">Loading wishlist...</p>
            ) : wishlistEntries.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-jost text-sm text-ink-muted italic mb-4">Your wishlist is empty</p>
                <Link href="/shop" className="font-jost text-xs text-moss underline underline-offset-2">
                  Browse our collection
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {wishlistEntries.map(entry => {
                  const book = wishlistBooks[entry.book_id]
                  const isSold = !book || book.status === 'sold' || book.copies <= 0
                  return (
                    <div key={entry.id} className="bg-cream border border-sand rounded-sm overflow-hidden relative">
                      {/* Heart remove button */}
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
                          {book && (
                            <p className="font-cormorant text-base font-semibold text-bark">
                              ฿{book.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="px-3 pb-3">
                        {!isSold && book ? (
                          <button
                            onClick={() => addItem({
                              id: book.id + '-' + (book.condition || 'Like New'),
                              bookId: book.id,
                              title: book.title,
                              author: book.author,
                              price: book.price,
                              image_url: book.image_url,
                              category: book.category,
                              condition: book.condition,
                            })}
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

        {/* Points Tab */}
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
                  Earn more points by leaving reviews on your purchases
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
                        {tx.type === 'earned_review' ? 'Review submitted' :
                         tx.type === 'earned_photo' ? 'Photo review' :
                         tx.type === 'redeemed' ? 'Redeemed at checkout' : tx.type}
                      </p>
                      <p className="font-jost text-ink-muted" style={{ fontSize: 10 }}>
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className="font-jost text-sm font-semibold"
                      style={{ color: tx.points > 0 ? '#4a6741' : '#9b4a2a' }}
                    >
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
