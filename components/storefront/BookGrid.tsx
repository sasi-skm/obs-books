'use client'

import { Book } from '@/types'
import BookCard from './BookCard'

export default function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
