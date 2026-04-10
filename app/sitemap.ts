import { MetadataRoute } from 'next'
import { getBooks } from '@/lib/books-data'
import { CATEGORIES } from '@/lib/translations'

const BASE_URL = 'https://www.obsbooks.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getBooks()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/category/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const bookPages: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${BASE_URL}/book/${book.id}`,
    lastModified: new Date(book.updated_at || book.created_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...bookPages]
}
