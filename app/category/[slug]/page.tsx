import { Metadata } from 'next'
import { getBooksByCategory } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'
import CategoryClient from './CategoryClient'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = CATEGORIES.find(c => c.id === params.slug)
  if (!category) return {}

  return {
    title: `${category.en} Books | OBS Books`,
    description: `Browse our collection of vintage ${category.en.toLowerCase()} books. Curated illustrated editions from OBS Books, Bangkok.`,
    alternates: { canonical: `https://www.obsbooks.com/category/${params.slug}` },
    openGraph: {
      title: `${category.en} Books | OBS Books`,
      description: `Vintage illustrated ${category.en.toLowerCase()} books from OBS Books, Bangkok.`,
      url: `https://www.obsbooks.com/category/${params.slug}`,
      images: [{ url: '/images/obs-display.png', alt: `${category.en} books at OBS Books` }],
    },
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find(c => c.id === params.slug)
  if (!category) notFound()

  const books = await getBooksByCategory(params.slug)
  return <CategoryClient category={category} books={books} />
}

export function generateStaticParams() {
  return CATEGORIES.map(cat => ({ slug: cat.id }))
}
