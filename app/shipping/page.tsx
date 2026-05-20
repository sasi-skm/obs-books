import { Metadata } from 'next'
import ShippingClient from './ShippingClient'

export const metadata: Metadata = {
  title: 'Shipping Information | OBS Books',
  description: 'Worldwide shipping via DHL Express from Bangkok, Thailand. Estimate shipping costs, delivery times, and learn about our shipping process.',
  alternates: { canonical: 'https://www.obsbooks.com/shipping' },
  openGraph: {
    title: 'Shipping Information | OBS Books',
    description: 'Worldwide shipping via DHL Express from Bangkok, Thailand. Estimate shipping costs, delivery times, and learn about our shipping process.',
    url: 'https://www.obsbooks.com/shipping',
    siteName: 'OBS Books',
    type: 'website',
    images: [{ url: '/images/obs-display.jpg', alt: 'OBS Books collection' }],
  },
}

export default function ShippingPage() {
  return <ShippingClient />
}
