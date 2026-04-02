import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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
