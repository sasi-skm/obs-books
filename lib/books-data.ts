import { cache } from 'react'
import { Book } from '@/types'

// Sample book data - matches the prototype's 32 books
// Used as fallback when Supabase is not configured
export const SAMPLE_BOOKS: Book[] = [
  { id: '1', title: 'The Concise British Flora in Colour', author: 'W. Keble Martin', price: 1200, category: 'wildflowers', condition: 'Very Good', copies: 3, status: 'available', image_url: '/images/british-flora.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '2', title: 'Wild Flowers by Colour', author: 'Marjorie Blamey', price: 950, category: 'wildflowers', condition: 'Good', copies: 2, status: 'available', image_url: '/images/blamey-guides.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '3', title: 'Wild Flowers of the Mediterranean', author: 'Marjorie Blamey', price: 1100, category: 'wildflowers', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/wildflower-guide.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '4', title: 'The Illustrated Book of Wild Flowers', author: 'Various', price: 850, category: 'wildflowers', condition: 'Good', copies: 1, status: 'available', image_url: '/images/wildflower-plate.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '5', title: 'Painting Flowers', author: 'Marjorie Blamey', price: 950, category: 'garden-roses', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/painting-flowers.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '6', title: 'Old Cottage Garden Flowers', author: 'Roger Banks', price: 780, category: 'garden-roses', condition: 'Good', copies: 1, status: 'available', image_url: '/images/roses-collection.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '7', title: 'Garden Flowers - A Concise Guide', author: 'Various', price: 650, category: 'garden-roses', condition: 'Good', copies: 2, status: 'available', image_url: '/images/garden-flowers.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '8', title: 'Garden Plants in Colour', author: 'Various', price: 700, category: 'garden-roses', condition: 'Good', copies: 1, status: 'available', image_url: '/images/garden-plants.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '9', title: 'The Trees of Britain & N. Europe', author: 'Alan Mitchell', price: 680, category: 'trees-plants', condition: 'Good', copies: 5, status: 'available', image_url: '/images/trees-collection.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '10', title: 'Living in a Wild Garden', author: 'Roger Banks', price: 750, category: 'trees-plants', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/wild-garden.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '11', title: 'Dragonfly, Beetle, Butterfly, Bee', author: 'Maryjo Koch', price: 890, category: 'butterflies', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/butterfly-book.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '12', title: 'A Field Guide to Butterflies & Moths', author: 'David Carter', price: 750, category: 'butterflies', condition: 'Good', copies: 2, status: 'available', image_url: '/images/pantry-butterflies.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '13', title: 'A Basket of Berries', author: 'Val Archer', price: 850, category: 'cookbooks', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/berries-book.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '14', title: 'A Basket of Apples', author: 'Val Archer', price: 850, category: 'cookbooks', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/apples-book.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '15', title: 'Recipes to Relish', author: 'Joan Wolfenden', price: 750, category: 'cookbooks', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/summer-recipes.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '16', title: 'A Table in Tuscany', author: 'Various', price: 680, category: 'cookbooks', condition: 'Good', copies: 1, status: 'available', image_url: '/images/tuscan-soup.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '17', title: 'Summer Pudding & Country Recipes', author: 'Various', price: 620, category: 'cookbooks', condition: 'Good', copies: 1, status: 'available', image_url: '/images/summer-pudding.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '18', title: 'Time for Tea', author: 'Mary Engelbreit', price: 550, category: 'country-life', condition: 'Good', copies: 1, status: 'available', image_url: '/images/teatime-books.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '19', title: 'The English Book of Teas', author: 'Rosa Mashiter', price: 480, category: 'country-life', condition: 'Good', copies: 1, status: 'available', image_url: '/images/cookbook-spread.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '20', title: 'The Secret Book of Gnomes', author: 'David the Gnome', price: 550, category: 'fairytale', condition: 'Good', copies: 1, status: 'available', image_url: '/images/fairytale-gnomes.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '21', title: 'Art Forms in Nature', author: 'Ernst Haeckel - TASCHEN', price: 1500, category: 'art-illustration', condition: 'Very Good', copies: 2, status: 'available', image_url: '/images/haeckel-art.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '22', title: "Janet Marsh's Nature Diary", author: 'Janet Marsh', price: 650, category: 'art-illustration', condition: 'Good', copies: 1, status: 'available', image_url: '/images/nature-diary.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '23', title: 'Island - Diary of a Year', author: 'Garth & Vicky Waite', price: 580, category: 'art-illustration', condition: 'Good', copies: 1, status: 'available', image_url: '/images/island-diary.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '24', title: 'A Contemplation upon Flowers', author: 'Henry King', price: 720, category: 'art-illustration', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/flower-poetry.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '25', title: 'Flos Solis Maior - Botanical Prints', author: 'Historical Plates', price: 1800, category: 'art-illustration', condition: 'Like New', copies: 1, status: 'available', image_url: '/images/hero-botanical.jpeg', featured: true, created_at: '', updated_at: '' },
  { id: '26', title: 'Blackberry Muffins & Country Baking', author: 'Val Archer', price: 620, category: 'cookbooks', condition: 'Good', copies: 1, status: 'available', image_url: '/images/blackberry-muffins.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '27', title: 'Flora - An Illustrated History', author: 'Brent Elliott', price: 980, category: 'trees-plants', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/nature-field-guides.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '28', title: "Richard Bell's Britain", author: 'Richard Bell', price: 550, category: 'art-illustration', condition: 'Good', copies: 1, status: 'available', image_url: '/images/cornflowers.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '29', title: 'Poppies, Tulips & Pansies', author: 'W. Keble Martin', price: 1100, category: 'wildflowers', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/poppy-tulips.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '30', title: 'Pansies & Dahlias', author: 'Various', price: 750, category: 'garden-roses', condition: 'Good', copies: 1, status: 'available', image_url: '/images/pansies-dahlias.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '31', title: 'Strawberries, Pears & Crab Apples', author: 'Marjorie Blamey', price: 950, category: 'trees-plants', condition: 'Very Good', copies: 1, status: 'available', image_url: '/images/strawberry-detail.jpeg', featured: false, created_at: '', updated_at: '' },
  { id: '32', title: 'Recording & Painting Flowers', author: 'Marjorie Blamey', price: 880, category: 'art-illustration', condition: 'Good', copies: 1, status: 'available', image_url: '/images/painting-flowers.jpeg', featured: false, created_at: '', updated_at: '' },
]

const TIMEOUT = 15000
const timeout = () => new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT))

// React cache() deduplicates calls within a single render pass.
// All pages that call getBooks() during one ISR cycle share ONE Supabase query.
export const getBooks = cache(async (): Promise<Book[]> => {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    try {
      const { supabase } = await import('./supabase')
      const result = await Promise.race([
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        timeout(),
      ])
      if (result && 'data' in result && !result.error && result.data && result.data.length > 0) return result.data as Book[]
    } catch {}
  }
  return SAMPLE_BOOKS
})

export async function getBookById(id: string): Promise<Book | null> {
  // Use the cached getBooks() instead of a separate query
  const books = await getBooks()
  return books.find(b => b.id === id) || null
}

export async function getBooksByCategory(category: string): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.category === category && b.status === 'available')
}

export async function getFeaturedBooks(): Promise<Book[]> {
  const books = await getBooks()
  return books.filter(b => b.featured && b.status === 'available')
}
