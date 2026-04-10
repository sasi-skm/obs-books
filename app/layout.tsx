import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/layout/LanguageContext'
import { CartProvider } from '@/components/cart/CartContext'
import { AuthProvider } from '@/lib/AuthContext'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import TawktoChat from '@/components/layout/TawktoChat'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jost',
  display: 'swap',
})

const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '500'],
  variable: '--font-noto-thai',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.obsbooks.com'),
  title: 'OBS Books - The Book Itself Is a Treasure',
  description: 'Curated vintage & used illustrated books - especially flowers & nature. Based in Bangkok, Thailand.',
  keywords: ['used books', 'vintage books', 'botanical books', 'illustrated books', 'Bangkok', 'Thailand', 'OBS Books'],
  alternates: {
    canonical: 'https://www.obsbooks.com',
  },
  openGraph: {
    title: 'OBS Books - The Book Itself Is a Treasure',
    description: 'Curated vintage & used illustrated books - especially flowers & nature. Based in Bangkok, Thailand.',
    type: 'website',
    url: 'https://www.obsbooks.com',
    siteName: 'OBS Books',
    images: [
      {
        url: '/images/obs-display.png',
        width: 1200,
        height: 630,
        alt: 'OBS Books - Vintage illustrated books collection',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OBS Books - The Book Itself Is a Treasure',
    description: 'Curated vintage & used illustrated books - especially flowers & nature.',
    images: ['/images/obs-display.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${notoThai.variable}`}>
      <body className="font-body antialiased bg-cream text-ink">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <Nav />
              <CartDrawer />
              <main>{children}</main>
              <Footer />
              <TawktoChat />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
