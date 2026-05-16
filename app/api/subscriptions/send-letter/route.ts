import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { to, name, month, year, pdfUrl } = await req.json()
    if (!to || !pdfUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { sendFlowerLetterEmail } = await import('@/lib/email')
    await sendFlowerLetterEmail({ to, name, month, year, pdfUrl })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send letter error:', err)
    return NextResponse.json({ error: 'Failed to send letter' }, { status: 500 })
  }
}
