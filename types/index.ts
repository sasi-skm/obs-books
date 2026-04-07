export interface Book {
  id: string
  title: string
  author: string
  price: number
  category: string
  condition: string
  condition_prices?: Record<string, number>
  condition_copies?: Record<string, number>
  copies: number
  status: 'available' | 'sold'
  image_url: string
  images?: string[]
  video_url?: string
  description?: string
  description_en?: string
  description_th?: string
  publisher?: string
  year_published?: number
  pages?: number
  cover_type?: string
  language?: string
  height_cm?: number
  width_cm?: number
  featured: boolean
  created_at: string
  weight_grams?: number
  updated_at: string
}

export interface Category {
  id: string
  en: string
  th: string
  icon: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  shipping_address: string
  payment_method: 'promptpay' | 'transfer'
  payment_status: 'pending' | 'uploaded' | 'confirmed'
  order_status: 'new' | 'paid' | 'packing' | 'shipped' | 'delivered' | 'cancelled'
  slip_url?: string
  total_amount: number
  note?: string
  courier?: string
  tracking_number?: string
  destination_country?: string
  currency?: 'THB' | 'USD'
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  book_id: string
  title: string
  author: string
  price: number
  image_url?: string
}

export interface CartItem {
  id: string
  bookId: string
  title: string
  author: string
  price: number
  image_url: string
  category: string
  condition?: string
  weight_grams?: number
  quantity: number
  maxQuantity?: number
}

export type Lang = 'en' | 'th'
