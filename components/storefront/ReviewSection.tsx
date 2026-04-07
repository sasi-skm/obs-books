'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  user_id: string
  book_title: string
  rating: number
  comment: string
  photo_urls: string[]
  status: 'pending' | 'approved' | 'hidden'
  created_at: string
  profiles?: { full_name?: string }
}

function StarRow({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number
  size?: number
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: (interactive ? hover || rating : rating) >= i ? '#4a6741' : '#d6cdb8',
            cursor: interactive ? 'pointer' : 'default',
            lineHeight: 1,
          }}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function ReviewSection({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [bookTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) checkEligibility()
  }, [user, bookTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('book_title', bookTitle)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (data) setReviews(data as Review[])
    } catch {}
    setLoading(false)
  }

  const checkEligibility = async () => {
    if (!user) return
    try {
      // Check if already reviewed
      const { data: existing } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_title', bookTitle)
        .maybeSingle()

      if (existing) {
        setMyReview(existing as Review)
        return
      }

      // Check if purchased: get user's non-cancelled orders
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .neq('order_status', 'cancelled')

      if (userOrders && userOrders.length > 0) {
        const orderIds = userOrders.map((o: { id: string }) => o.id)
        const { data: items } = await supabase
          .from('order_items')
          .select('id')
          .eq('title', bookTitle)
          .in('order_id', orderIds)

        setCanReview(!!(items && items.length > 0))
      }
    } catch {}
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos(prev => [...prev, ...newFiles])
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!user || rating === 0 || comment.length < 20) return
    setSubmitting(true)

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

    setSubmitted(true)
    setSubmitting(false)
  }

  // Rating calculations
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  const formatName = (review: Review) => {
    const name = review.profiles?.full_name || 'Customer'
    const parts = name.trim().split(' ')
    if (parts.length >= 2 && parts[1]) return parts[0] + ' ' + parts[1][0] + '.'
    return parts[0]
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return { bg: '#fdf0eb', color: '#9b4a2a', label: 'Pending approval' }
    if (status === 'approved') return { bg: '#eef3ec', color: '#3a5832', label: 'Published' }
    return { bg: '#f1efe8', color: '#8a7d65', label: 'Not published' }
  }

  return (
    <div className="mt-10 border-t border-sand pt-8">
      {/* Section header */}
      <p className="font-jost uppercase tracking-widest mb-1" style={{ fontSize: 11, color: '#8a7d65' }}>
        Share your experience
      </p>
      <h2 className="font-cormorant text-2xl font-normal text-ink mb-1">Customer Reviews</h2>
      <p className="font-jost text-ink-muted mb-6" style={{ fontSize: 11 }}>— ✦ —</p>

      {/* Overall rating block */}
      {reviews.length > 0 && (
        <div className="mb-6 p-4 rounded-sm" style={{ background: '#eee8d8' }}>
          <div className="flex gap-6 items-start">
            <div className="text-center shrink-0">
              <div className="font-cormorant font-normal text-ink leading-none" style={{ fontSize: 40 }}>
                {avgRating.toFixed(1)}
              </div>
              <StarRow rating={Math.round(avgRating)} size={13} />
              <p className="font-jost mt-1" style={{ fontSize: 11, color: '#8a7d65' }}>
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </p>
            </div>
            <div className="flex-1">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="font-jost w-3 text-right" style={{ fontSize: 11, color: '#8a7d65' }}>{star}</span>
                  <span style={{ fontSize: 10, color: '#8a7d65' }}>★</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: '#d6cdb8' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: '#4a6741',
                        width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="font-jost w-3" style={{ fontSize: 11, color: '#8a7d65' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {!loading && reviews.length === 0 && (
        <p className="font-jost text-center mb-6" style={{ fontSize: 13, color: '#8a7d65' }}>
          Be the first to review this book
        </p>
      )}

      <div className="space-y-4 mb-8">
        {reviews.map(review => (
          <div key={review.id} className="bg-cream border border-sand rounded-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-jost text-sm font-semibold text-ink">{formatName(review)}</span>
              <span className="font-jost" style={{ fontSize: 11, color: '#8a7d65' }}>
                {new Date(review.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <StarRow rating={review.rating} size={13} />
            <p className="font-jost mt-2 leading-relaxed" style={{ fontSize: 13, color: '#6b5e48' }}>
              {review.comment}
            </p>
            {review.photo_urls && review.photo_urls.length > 0 && (
              <div className="flex gap-2 mt-3">
                {review.photo_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxUrl(url)}
                    className="relative overflow-hidden rounded-sm border border-sand hover:border-moss transition-colors"
                    style={{ width: 52, height: 52 }}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="52px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review form area */}
      {!user && (
        <p style={{ fontSize: 13, color: '#8a7d65' }} className="font-jost">
          <Link href="/login" className="text-moss underline underline-offset-2">Sign in</Link>{' '}
          to leave a review
        </p>
      )}

      {user && myReview && (
        <div className="p-4 bg-parchment border border-sand rounded-sm">
          <p className="font-jost text-xs font-semibold text-bark mb-2">Your review</p>
          <StarRow rating={myReview.rating} size={14} />
          <p className="font-jost mt-2 leading-relaxed" style={{ fontSize: 13, color: '#6b5e48' }}>
            {myReview.comment}
          </p>
          <span
            className="inline-block mt-2 font-jost px-2 py-0.5 rounded-sm"
            style={{
              fontSize: 11,
              background: statusBadge(myReview.status).bg,
              color: statusBadge(myReview.status).color,
            }}
          >
            {statusBadge(myReview.status).label}
          </span>
        </div>
      )}

      {user && !myReview && !canReview && (
        <p style={{ fontSize: 13, color: '#8a7d65' }} className="font-jost">
          Purchase this book to leave a review
        </p>
      )}

      {user && !myReview && canReview && (
        <div>
          {submitted ? (
            <p className="font-jost text-sm text-moss">
              Thank you - your review is pending approval. You&apos;ll earn points once it&apos;s published.
            </p>
          ) : (
            <div className="border border-sand p-5 rounded-sm" style={{ background: 'rgba(238,232,216,0.3)' }}>
              <p className="font-jost text-xs font-semibold uppercase tracking-wide text-bark mb-4">Write a Review</p>

              {/* Star rating */}
              <div className="mb-4">
                <p className="font-jost text-xs mb-2" style={{ color: '#8a7d65' }}>Your rating</p>
                <StarRow rating={rating} size={28} interactive onChange={setRating} />
              </div>

              {/* Comment */}
              <div className="mb-4">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-sand bg-cream font-jost text-sm text-ink outline-none focus:border-moss resize-y rounded-sm"
                />
                {comment.length > 0 && comment.length < 20 && (
                  <p className="font-jost mt-1" style={{ fontSize: 11, color: '#9b4a2a' }}>
                    Minimum 20 characters ({20 - comment.length} more needed)
                  </p>
                )}
              </div>

              {/* Photo upload */}
              <div className="mb-4">
                {photoPreviews.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {photoPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden rounded-sm border border-sand"
                        style={{ width: 60, height: 60 }}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="60px" />
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < 3 && (
                  <label className="block border-2 border-dashed border-sand p-3 text-center cursor-pointer hover:border-moss transition-colors rounded-sm">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <span className="font-jost" style={{ fontSize: 12, color: '#8a7d65' }}>
                      + Add photos (up to 3) · optional
                    </span>
                  </label>
                )}
                <p className="font-jost mt-2" style={{ fontSize: 11, color: '#8a7d65' }}>
                  Reviews are checked before publishing. You&apos;ll earn 20 points for your review, +30 more if you include a photo.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || comment.length < 20}
                className="w-full py-3 bg-moss text-cream font-jost text-sm tracking-wide rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(44,36,22,0.85)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-lg w-full">
            <Image
              src={lightboxUrl}
              alt="Review photo"
              width={600}
              height={800}
              className="w-full h-auto object-contain rounded-sm"
            />
            <button
              className="absolute top-2 right-2 text-white text-xl bg-black/50 w-8 h-8 rounded-full flex items-center justify-center"
              onClick={() => setLightboxUrl(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
