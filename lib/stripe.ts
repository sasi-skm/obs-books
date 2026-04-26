import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(secretKey || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'OBS Books',
    url: 'https://www.obsbooks.com',
  },
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
