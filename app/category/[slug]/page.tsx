import { getBooksByCategory } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'
import CategoryClient from './CategoryClient'
import { notFound } from 'next/navigation'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find(c => c.id === params.slug)
  if (!category) notFound()

  const books = await getBooksByCategory(params.slug)
  return <CategoryClient category={category} books={books} />
}

export function generateStaticParams() {
  return CATEGORIES.map(cat => ({ slug: cat.id }))
}
