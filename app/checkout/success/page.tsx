import { stripe } from '@/lib/stripe'
import SuccessClient from './SuccessClient'

// Server component: fetches the Stripe Checkout Session using the
// session_id Stripe appended to the success_url, then hands the
// resulting payload to the bilingual client component.
//
// We deliberately do NOT update the order's payment_status / order_status
// here. The webhook owns that transition (see app/api/webhooks/stripe/
// route.ts handleSessionCompleted). This page is read-only confirmation.

export const dynamic = 'force-dynamic'

type Search = { session_id?: string | string[] }

export type SuccessLineItem = {
  description: string
  amountCents: number
  imageUrl: string | null
}

export type SuccessPayload =
  | {
      kind: 'paid'
      orderNumber: string
      customerName: string
      customerEmail: string | null
      totalCents: number
      currency: string
      items: SuccessLineItem[]
    }
  | {
      kind: 'processing'
      orderNumber: string | null
      customerEmail: string | null
    }
  | {
      kind: 'not_found'
    }

export default async function SuccessPage({ searchParams }: { searchParams: Search }) {
  const rawId = searchParams.session_id
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId

  let payload: SuccessPayload

  if (!sessionId || !sessionId.startsWith('cs_')) {
    payload = { kind: 'not_found' }
  } else {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'line_items.data.price.product', 'customer_details'],
      })
      const orderNumber =
        (session.metadata?.order_number as string | undefined) ||
        (session.metadata?.order_id as string | undefined) ||
        null
      const customerEmail =
        session.customer_details?.email || session.customer_email || null
      const customerName = session.customer_details?.name || ''

      if (session.payment_status === 'paid' && orderNumber) {
        const items: SuccessLineItem[] = (session.line_items?.data || []).map(li => {
          const product =
            typeof li.price?.product === 'object' && li.price?.product && !('deleted' in li.price.product)
              ? li.price.product
              : null
          const imageUrl = product?.images?.[0] || null
          return {
            description: li.description || product?.name || 'Item',
            amountCents: li.amount_total || 0,
            imageUrl,
          }
        })
        payload = {
          kind: 'paid',
          orderNumber,
          customerName,
          customerEmail,
          totalCents: session.amount_total || 0,
          currency: (session.currency || 'usd').toUpperCase(),
          items,
        }
      } else {
        // Webhook hasn't fired yet, or session is in some intermediate
        // state. Show the processing fallback — the email + DB flip will
        // happen as soon as the webhook lands.
        payload = { kind: 'processing', orderNumber, customerEmail }
      }
    } catch (err) {
      console.error('[checkout/success] stripe session fetch failed:', err)
      payload = { kind: 'not_found' }
    }
  }

  return <SuccessClient payload={payload} />
}
