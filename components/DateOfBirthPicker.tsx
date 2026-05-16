'use client'

import { useMemo } from 'react'

// Day / Month / Year dropdowns for a date of birth. Replaces the native
// <input type="date"> which, for a birthday, forces month-by-month calendar
// navigation (no practical way to jump back to a birth year) and behaves
// inconsistently on mobile. Value is the same 'YYYY-MM-DD' string the native
// input produced, so it stays compatible with the profiles.date_of_birth
// storage and any already-saved values. Empty string = not provided.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// month1 is 1-12; day 0 of the next month = last day of this month (handles leap years).
function daysInMonth(year: number, month1: number): number {
  if (!year || !month1) return 31
  return new Date(year, month1, 0).getDate()
}

export default function DateOfBirthPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [y, m, d] =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? (value.split('-').map(Number) as [number, number, number])
      : [0, 0, 0]

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const arr: number[] = []
    for (let yr = currentYear; yr >= currentYear - 110; yr--) arr.push(yr)
    return arr
  }, [currentYear])

  const days = useMemo(() => {
    const count = daysInMonth(y, m)
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [y, m])

  const emit = (ny: number, nm: number, nd: number) => {
    if (ny && nm && nd) {
      // Clamp the day to the valid range for the chosen month/year so a
      // leftover "31" can't produce an invalid date like 2000-02-31.
      const cd = Math.min(nd, daysInMonth(ny, nm))
      onChange(`${ny}-${String(nm).padStart(2, '0')}-${String(cd).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  const sel =
    'px-3 py-2.5 border border-sand bg-parchment font-jost text-sm text-ink outline-none focus:border-moss transition-colors'

  return (
    <div className="flex gap-2">
      <select
        aria-label="Day of birth"
        value={d || ''}
        onChange={e => emit(y, m, Number(e.target.value))}
        className={`${sel} w-[26%]`}
      >
        <option value="">Day</option>
        {days.map(dd => (
          <option key={dd} value={dd}>{dd}</option>
        ))}
      </select>
      <select
        aria-label="Month of birth"
        value={m || ''}
        onChange={e => emit(y, Number(e.target.value), d)}
        className={`${sel} flex-1`}
      >
        <option value="">Month</option>
        {MONTHS.map((mn, i) => (
          <option key={mn} value={i + 1}>{mn}</option>
        ))}
      </select>
      <select
        aria-label="Year of birth"
        value={y || ''}
        onChange={e => emit(Number(e.target.value), m, d)}
        className={`${sel} w-[32%]`}
      >
        <option value="">Year</option>
        {years.map(yr => (
          <option key={yr} value={yr}>{yr}</option>
        ))}
      </select>
    </div>
  )
}
