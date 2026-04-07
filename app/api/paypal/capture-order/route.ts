import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json()
    if (!orderID) return NextResponse.json({ error: 'orderID required' }, { status: 400 })
    const result = await capturePayPalOrder(orderID)
    return NextResponse.json(result)
  } catch (err) {
    console.error('PayPal capture error:', err)
    return NextResponse.json({ error: 'Failed to capture PayPal order' }, { status: 500 })
  }
}
