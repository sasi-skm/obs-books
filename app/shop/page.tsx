import { getBooks } from '@/lib/books-data'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const books = await getBooks()
  const availableBooks = books.filter(b => b.status === 'available')
  return <ShopClient books={availableBooks} />
}
