'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/components/layout/LanguageContext'

/**
 * Live countdown to the 24-hour auto-cancellation deadline.
 *
 * Takes the order's `created_at` ISO string, adds 24 hours, and shows the
 * time remaining in days / hours / minutes. Updates every 30 seconds.
 *
 * Shown on /track and /slip-upload for any order that's still waiting
 * for payment confirmation. Once the deadline passes, shows the "expired"
 * message. (The server-side cron will have already cancelled the order
 * by then — this is just friendly UI copy for the edge case where a
 * customer opens the page just after the cutoff but before the cron fires.)
 */

const WINDOW_MS = 24 * 60 * 60 * 1000

export default function PaymentCountdown({ createdAt }: { createdAt: string }) {
  const { lang, t } = useLang()
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 30_000) // every 30s is plenty for minute precision
    return () => clearInterval(id)
  }, [])

  const createdMs = new Date(createdAt).getTime()
  if (!Number.isFinite(createdMs)) return null
  const deadlineMs = createdMs + WINDOW_MS
  const remainingMs = deadlineMs - now

  if (remainingMs <= 0) {
    return (
      <div
        className="text-center px-3 py-2 border-l-4 bg-rose/5 border-rose"
      >
        <p className="font-heading text-xs text-rose">⏰ {t('pay24hExpired')}</p>
      </div>
    )
  }

  const totalMinutes = Math.floor(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(lang === 'th' ? `${hours} ชั่วโมง` : `${hours}h`)
  }
  parts.push(lang === 'th' ? `${minutes} นาที` : `${minutes}m`)

  // Color escalates as the deadline approaches
  const urgent = remainingMs < 2 * 60 * 60 * 1000 // < 2h remaining
  const warn = remainingMs < 6 * 60 * 60 * 1000 // < 6h remaining

  const color = urgent ? '#9b4a2a' : warn ? '#b06a2f' : '#4a6741'
  const bg = urgent ? '#fdf0eb' : warn ? '#fdf4ea' : '#eef3ec'

  return (
    <div
      className="text-center px-3 py-2 border-l-4"
      style={{ background: bg, borderColor: color }}
    >
      <p className="font-heading text-xs" style={{ color }}>
        ⏰ {t('pay24hRemaining')}: <span className="font-bold">{parts.join(' ')}</span>
      </p>
    </div>
  )
}
