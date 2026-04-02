import { getBookById, getBooks } from '@/lib/books-data'
import BookDetailClient from './BookDetailClient'
import { notFound } from 'next/navigation'

export const revalidate = 60
export const dynamicParams = true

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBookById(params.id)
  if (!book) notFound()
  return <BookDetailClient book={book} />
}

export async function generateStaticParams() {
  const books = await getBooks()
  return books.map(b => ({ id: b.id }))
}
