import { getBooks, getFeaturedBooks } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'
import HomeClient from './HomeClient'

export const revalidate = 60

export default async function HomePage() {
  const [allBooks, featuredBooks] = await Promise.all([
    getBooks(),
    getFeaturedBooks(),
  ])

  const availableBooks = allBooks.filter(b => b.status === 'available')
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: availableBooks.filter(b => b.category === cat.id).length,
  }))

  return <HomeClient featuredBooks={featuredBooks} categoryCounts={categoryCounts} />
}
