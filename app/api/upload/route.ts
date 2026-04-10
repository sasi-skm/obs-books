import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

async function getAuthUser(req: NextRequest) {
  try {
    let token: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }

    if (!token) {
      const cookieHeader = req.headers.get('cookie') || ''
      const cookies = cookieHeader.split(';').map(c => c.trim())
      for (const cookie of cookies) {
        if (cookie.startsWith('sb-') && cookie.includes('-auth-token=')) {
          const value = cookie.split('=').slice(1).join('=')
          try {
            const parsed = JSON.parse(decodeURIComponent(value))
            if (Array.isArray(parsed) && parsed[0]) {
              token = parsed[0]
            } else if (typeof parsed === 'string') {
              token = parsed
            }
          } catch {
            token = decodeURIComponent(value)
          }
          break
        }
      }
    }

    if (!token) return null

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('order_id') as string
    const bucket = formData.get('bucket') as string || 'payment-slips'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { supabaseAdmin } = await import('@/lib/supabase-server')

      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${orderId || Date.now()}-${Date.now()}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Update order with slip URL if it's a payment slip
      if (bucket === 'payment-slips' && orderId) {
        await supabaseAdmin
          .from('orders')
          .update({ slip_url: publicUrl, payment_status: 'uploaded' })
          .eq('id', orderId)
      }

      return NextResponse.json({ url: publicUrl })
    }

    return NextResponse.json({ url: '/images/placeholder-slip.jpg', message: 'Supabase not configured, file not stored' })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
