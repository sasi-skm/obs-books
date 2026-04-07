import { getBooks } from '@/lib/books-data'
import ShopClient from './ShopClient'

export const revalidate = 600

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { author?: string }
}) {
  const books = await getBooks()
  const availableBooks = books.filter(b => b.status === 'available')
  return (
    <ShopClient
      books={availableBooks}
      initialAuthorFilter={searchParams.author}
    />
  )
}
