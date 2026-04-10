import { Metadata } from 'next'
import ShippingClient from './ShippingClient'

export const metadata: Metadata = {
  title: 'Shipping Information | OBS Books',
  description: 'Worldwide shipping via DHL Express from Bangkok, Thailand. Estimate shipping costs, delivery times, and learn about our shipping process.',
}

export default function ShippingPage() {
  return <ShippingClient />
}
