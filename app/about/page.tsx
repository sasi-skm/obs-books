import type { Metadata } from 'next'
import AboutPageClient from './AboutPageClient'

export const metadata: Metadata = {
  title: 'About — OBS Books',
  description: 'OBS Books is a small Bangkok bookshop specialising in illustrated books about the natural world.',
}

export default function AboutPage() {
  return <AboutPageClient />
}
