import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// API version pinned to the SDK's latest known version. The Stripe SDK's
// types intentionally accept only this literal so application code stays
// in sync with the type definitions; downgrading would require an
// `as any` cast and surface bugs from drift.
export const stripe = new Stripe(secretKey || 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
  appInfo: {
    name: 'OBS Books',
    url: 'https://www.obsbooks.com',
  },
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
