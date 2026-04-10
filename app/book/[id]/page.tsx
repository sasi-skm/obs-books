import { Metadata } from 'next'
import { getBookById, getBooks } from '@/lib/books-data'
import BookDetailClient from './BookDetailClient'
import { notFound } from 'next/navigation'

// ISR: regenerate every 60 seconds. Cached pages survive temporary Supabase outages.
export const revalidate = 60
export const dynamicParams = true

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const book = await getBookById(params.id)
  if (!book) return {}

  const description = (book.description_en || book.description || '').slice(0, 160)

  return {
    title: `${book.title} - by ${book.author} | OBS Books`,
    description,
    alternates: { canonical: `https://www.obsbooks.com/book/${params.id}` },
    openGraph: {
      type: 'website',
      title: `${book.title} - by ${book.author} | OBS Books`,
      description,
      url: `https://www.obsbooks.com/book/${params.id}`,
      images: book.image_url ? [{ url: book.image_url, alt: book.title }] : [{ url: '/images/obs-display.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} | OBS Books`,
      description,
      images: book.image_url ? [book.image_url] : ['/images/obs-display.png'],
    },
  }
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBookById(params.id)
  if (!book) notFound()

  // getBooks() is deduplicated by React cache() — no extra Supabase call
  const allBooks = await getBooks()
  const isTextile = book.product_type === 'textile'
  const sameType = (b: typeof book) => (b.product_type === 'textile') === isTextile
  const relatedBooks = allBooks
    .filter(b => b.id !== book.id && b.category === book.category && sameType(b))
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: book.author },
    image: book.image_url,
    description: book.description_en || book.description,
    publisher: book.publisher ? { '@type': 'Organization', name: book.publisher } : undefined,
    datePublished: book.year_published ? String(book.year_published) : undefined,
    numberOfPages: book.pages || undefined,
    bookFormat: book.cover_type === 'Hardcover' ? 'https://schema.org/Hardcover' : 'https://schema.org/Paperback',
    inLanguage: book.language || 'en',
    url: `https://www.obsbooks.com/book/${book.id}`,
    offers: {
      '@type': 'Offer',
      price: book.price,
      priceCurrency: 'THB',
      availability: book.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      url: `https://www.obsbooks.com/book/${book.id}`,
      seller: { '@type': 'Organization', name: 'OBS Books', url: 'https://www.obsbooks.com' },
      itemCondition: 'https://schema.org/UsedCondition',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailClient book={book} relatedBooks={relatedBooks} />
    </>
  )
}

