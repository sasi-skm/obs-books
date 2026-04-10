import { Metadata } from 'next'
import { getBooks } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'
import HomeClient from './HomeClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'OBS Books - Vintage Illustrated Books | Bangkok, Thailand',
  description: 'OBS Books is a curated used bookshop in Bangkok selling vintage illustrated books on flowers, nature, butterflies, cookbooks, and fairy tales. Ships worldwide every Monday.',
  alternates: { canonical: 'https://www.obsbooks.com' },
  openGraph: {
    title: 'OBS Books - Vintage Illustrated Books | Bangkok',
    description: 'Curated vintage & used illustrated books - flowers, nature, cookbooks & more. Ships worldwide from Bangkok.',
    url: 'https://www.obsbooks.com',
    images: [{ url: '/images/obs-display.png', width: 1200, height: 630, alt: 'OBS Books collection' }],
  },
}

export default async function HomePage() {
  const books = await getBooks()
  const featuredBooks = books.filter(b => b.featured)
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: books.filter(b => b.category === cat.id).length,
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BookStore',
      name: 'OBS Books',
      description: 'Curated vintage and used illustrated books - especially flowers, nature, cookbooks, and fairy tales.',
      url: 'https://www.obsbooks.com',
      logo: 'https://www.obsbooks.com/images/obs-logo.png',
      image: 'https://www.obsbooks.com/images/obs-display.png',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bangkok',
        addressCountry: 'TH',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'obsbooksstore@gmail.com',
        contactType: 'customer service',
      },
      sameAs: [
        'https://www.instagram.com/obs_books',
        'https://www.facebook.com/obsbooks',
        'https://www.tiktok.com/@obs_books',
      ],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
      priceRange: '฿500 - ฿2000',
      currenciesAccepted: 'THB',
      paymentAccepted: 'PromptPay, Bank Transfer',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'OBS Books',
      url: 'https://www.obsbooks.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.obsbooks.com/shop?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient featuredBooks={featuredBooks} categoryCounts={categoryCounts} />
    </>
  )
}
