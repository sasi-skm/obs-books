import { getBooks } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'
import HomeClient from './HomeClient'

export const revalidate = 600

export default async function HomePage() {
  const allBooks = await getBooks()
  const availableBooks = allBooks.filter(b => b.status === 'available')
  const featuredBooks = availableBooks.filter(b => b.featured)
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: availableBooks.filter(b => b.category === cat.id).length,
  }))

  return <HomeClient featuredBooks={featuredBooks} categoryCounts={categoryCounts} />
}
