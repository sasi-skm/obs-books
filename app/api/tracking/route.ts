import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const trackingNumber = req.nextUrl.searchParams.get('tracking_number')
  if (!trackingNumber) {
    return NextResponse.json({ error: 'Missing tracking_number' }, { status: 400 })
  }

  try {
    const { getThailandPostTracking } = await import('@/lib/thailand-post')
    const events = await getThailandPostTracking(trackingNumber)
    return NextResponse.json({ events: events || [] })
  } catch {
    return NextResponse.json({ events: [] })
  }
}
