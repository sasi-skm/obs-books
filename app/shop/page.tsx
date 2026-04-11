import { Metadata } from 'next'
import { getBooks } from '@/lib/books-data'
import ShopClient from './ShopClient'

export const revalidate = 60
export const maxDuration = 10

export const metadata: Metadata = {
  title: 'Shop All Books | OBS Books Bangkok',
  description: 'Browse our curated collection of vintage illustrated books about flowers, nature, cookbooks, fairy tales, and more. Based in Bangkok, Thailand. Ships worldwide.',
  alternates: { canonical: 'https://www.obsbooks.com/shop' },
  openGraph: {
    title: 'Shop Vintage Illustrated Books | OBS Books Bangkok',
    description: 'Curated collection of vintage illustrated books - flowers, nature, cookbooks, fairy tales & more.',
    url: 'https://www.obsbooks.com/shop',
    images: [{ url: '/images/obs-display.png', alt: 'OBS Books collection' }],
  },
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { author?: string }
}) {
  const books = await getBooks()
  return (
    <ShopClient
      books={books}
      initialAuthorFilter={searchParams.author}
    />
  )
}
