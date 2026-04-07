'use client'

import { useState, useEffect, useCallback } from 'react'

interface Review {
  id: string
  user_id: string
  book_title: string
  rating: number
  comment: string
  photo_urls: string[]
  status: 'pending' | 'approved' | 'hidden'
  points_awarded: boolean
  created_at: string
  profiles?: { full_name?: string; email?: string }
}

type TabType = 'pending' | 'all'
type FilterType = 'all' | 'approved' | 'hidden' | 'pending'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fdf0eb', color: '#9b4a2a' },
    approved: { bg: '#eef3ec', color: '#3a5832' },
    hidden: { bg: '#f1efe8', color: '#8a7d65' },
  }
  const s = styles[status] || styles.pending
  return (
    <span
      className="font-jost px-2 py-0.5 rounded-sm capitalize"
      style={{ fontSize: 11, background: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="font-jost" style={{ fontSize: 13, color: '#4a6741', letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<TabType>('pending')
  const [reviews, setReviews] = useState<Review[]>([])
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews?status=pending')
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews?status=all')
      const data = await res.json()
      setAllReviews(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'pending') fetchPending()
    else fetchAll()
  }, [tab, fetchPending, fetchAll])

  const handleAction = async (id: string, action: 'approve' | 'hide' | 'delete') => {
    setActionLoading(id + action)
    try {
      if (action === 'delete') {
        await fetch('/api/admin/reviews', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      } else {
        await fetch('/api/admin/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action }),
        })
      }
      // Refresh
      if (tab === 'pending') fetchPending()
      else fetchAll()
    } catch {}
    setActionLoading(null)
  }

  const pendingCount = reviews.length
  const filteredAll = filter === 'all' ? allReviews : allReviews.filter(r => r.status === filter)

  const displayList = tab === 'pending' ? reviews : filteredAll

  return (
    <div>
      <h1 className="font-heading text-2xl font-normal mb-6">Reviews</h1>

      {/* Tabs */}
      <div className="flex border-b border-line mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`font-heading text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            tab === 'pending' ? 'border-sage text-sage' : 'border-transparent text-ink-light hover:text-sage'
          }`}
        >
          Pending{pendingCount > 0 && (
            <span
              className="ml-1.5 font-jost px-1.5 py-0.5 rounded-sm text-[10px]"
              style={{ background: '#fdf0eb', color: '#9b4a2a' }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`font-heading text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            tab === 'all' ? 'border-sage text-sage' : 'border-transparent text-ink-light hover:text-sage'
          }`}
        >
          All Reviews
        </button>
      </div>

      {/* Filter (All tab only) */}
      {tab === 'all' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-heading text-xs text-ink-light">Filter:</span>
          {(['all', 'approved', 'pending', 'hidden'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-jost text-xs px-3 py-1 border rounded-sm transition-colors capitalize ${
                filter === f ? 'border-sage bg-sage/10 text-sage' : 'border-line text-ink-light hover:border-sage hover:text-sage'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="font-heading text-sm text-ink-light italic">Loading...</p>
      ) : displayList.length === 0 ? (
        <p className="font-heading text-sm text-ink-light italic">
          {tab === 'pending' ? 'No reviews awaiting approval' : 'No reviews found'}
        </p>
      ) : (
        <div className="space-y-4">
          {displayList.map(review => (
            <div key={review.id} className="border border-line bg-offwhite p-4 rounded">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-heading text-sm font-semibold text-ink">
                    {review.profiles?.full_name || review.profiles?.email || 'Unknown'}
                  </p>
                  <p className="font-jost text-xs text-ink-light">{review.profiles?.email}</p>
                </div>
                <div className="text-right">
                  {tab === 'all' && <StatusBadge status={review.status} />}
                  <p className="font-jost text-xs text-ink-light mt-1">
                    {new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <p className="font-heading text-sm text-ink mb-1">
                <span className="text-ink-light font-body">Book: </span>{review.book_title}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <StarRow rating={review.rating} />
                {review.photo_urls && review.photo_urls.length > 0 && (
                  <span className="font-jost text-xs text-ink-light">
                    📷 {review.photo_urls.length} photo{review.photo_urls.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-ink-light leading-relaxed mb-3">
                {review.comment.length > 80 ? review.comment.slice(0, 80) + '...' : review.comment}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleAction(review.id, 'approve')}
                    disabled={actionLoading === review.id + 'approve'}
                    className="px-3 py-1.5 bg-sage text-offwhite font-heading text-xs rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {actionLoading === review.id + 'approve' ? '...' : 'Approve'}
                  </button>
                )}
                {review.status !== 'hidden' && (
                  <button
                    onClick={() => handleAction(review.id, 'hide')}
                    disabled={actionLoading === review.id + 'hide'}
                    className="px-3 py-1.5 border border-line text-ink-light font-heading text-xs rounded hover:border-sage hover:text-sage disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === review.id + 'hide' ? '...' : 'Hide'}
                  </button>
                )}
                {review.status === 'hidden' && (
                  <button
                    onClick={() => {
                      if (confirm('Permanently delete this review? Points will not be clawed back.')) {
                        handleAction(review.id, 'delete')
                      }
                    }}
                    disabled={actionLoading === review.id + 'delete'}
                    className="px-3 py-1.5 border border-red-300 text-red-500 font-heading text-xs rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === review.id + 'delete' ? '...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
