export interface Book {
  id: string
  title: string
  author: string
  price: number
  category: string
  condition: string
  condition_prices?: Record<string, number>
  copies: number
  status: 'available' | 'sold'
  image_url: string
  images?: string[]
  video_url?: string
  description?: string
  featured: boolean
  created_at: string
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
  order_status: 'new' | 'paid' | 'packing' | 'shipped' | 'delivered'
  slip_url?: string
  total_amount: number
  note?: string
  courier?: string
  tracking_number?: string
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
  title: string
  author: string
  price: number
  image_url: string
  category: string
  condition?: string
}

export type Lang = 'en' | 'th'
