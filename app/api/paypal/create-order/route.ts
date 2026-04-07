import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD' } = await req.json()
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    const orderId = await createPayPalOrder(Number(amount), currency)
    return NextResponse.json({ id: orderId })
  } catch (err) {
    console.error('PayPal create-order error:', err)
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
  }
}
