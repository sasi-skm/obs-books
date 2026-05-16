'use client'

import { useEffect, useState } from 'react'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import BookCard from './BookCard'

type RatingMap = Map<string, { avg: number; count: number }>

export default function BookGrid({ books }: { books: Book[] }) {
  const [ratingsMap, setRatingsMap] = useState<RatingMap>(new Map())

  useEffect(() => {
    if (!books.length) return
    const titles = books.map(b => b.title)
    supabase
      .from('reviews')
      .select('book_title, rating')
      .in('book_title', titles)
      .eq('status', 'approved')
      .then(({ data }) => {
        if (!data || !data.length) return
        // Group rows by book_title, then compute avg + count per title
        const grouped = new Map<string, number[]>()
        for (const row of data) {
          const arr = grouped.get(row.book_title) ?? []
          arr.push(row.rating)
          grouped.set(row.book_title, arr)
        }
        const result: RatingMap = new Map()
        grouped.forEach((ratings, title) => {
          result.set(title, {
            avg: ratings.reduce((s, r) => s + r, 0) / ratings.length,
            count: ratings.length,
          })
        })
        setRatingsMap(result)
      })
  // Re-fetch when the set of books changes (different page / category)
  // Using a stable key: sorted titles joined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books.map(b => b.title).sort().join('|')])

  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          priority={index < 4}
          ratingData={ratingsMap.get(book.title) ?? null}
        />
      ))}
    </div>
  )
}
