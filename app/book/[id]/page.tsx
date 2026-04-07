import { getBookById, getBooks } from '@/lib/books-data'
import BookDetailClient from './BookDetailClient'
import { notFound } from 'next/navigation'

export const revalidate = 600
export const dynamicParams = true

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBookById(params.id)
  if (!book) notFound()

  // getBooks() is deduplicated by React cache() — no extra Supabase call
  const allBooks = await getBooks()
  const relatedBooks = allBooks
    .filter(b => b.id !== book.id && b.category === book.category && b.status === 'available')
    .slice(0, 3)

  return <BookDetailClient book={book} relatedBooks={relatedBooks} />
}

// Return empty array — book pages are rendered on-demand via ISR, not at build time.
// This avoids 30+ Supabase queries per deploy.
export function generateStaticParams() {
  return []
}
