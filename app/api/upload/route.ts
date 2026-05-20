import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

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

const ALLOWED_BUCKETS = ['payment-slips', 'book-images'] as const
type AllowedBucket = typeof ALLOWED_BUCKETS[number]

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { id: 'upload', limit: 10, windowMs: 60000 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('order_id') as string
    const rawBucket = formData.get('bucket') as string || 'payment-slips'

    // Strict whitelist: reject any bucket not explicitly allowed.
    if (!(ALLOWED_BUCKETS as readonly string[]).includes(rawBucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }
    const bucket: AllowedBucket = rawBucket as AllowedBucket

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { supabaseAdmin } = await import('@/lib/supabase-server')

      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${orderId || Date.now()}-${Date.now()}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const inputBuffer = Buffer.from(arrayBuffer)

      // ---------------------------------------------------------------
      // book-images: auto-orient + resize to webp (display + thumb)
      // payment-slips: original buffer, original contentType, unchanged
      // ---------------------------------------------------------------
      if (bucket === 'book-images') {
        const base = `${orderId || Date.now()}-${Date.now()}`
        let displayBuffer: Buffer
        let thumbBuffer: Buffer
        let processedOk = false

        try {
          const sharp = (await import('sharp')).default
          const pipeline = sharp(inputBuffer).rotate() // auto-orient from EXIF (critical for iPhone/HEIC)
          displayBuffer = await pipeline.clone()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()
          thumbBuffer = await pipeline.clone()
            .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 72 })
            .toBuffer()
          processedOk = true
        } catch (sharpErr) {
          console.error('sharp processing failed, falling back to original upload:', sharpErr)
        }

        if (processedOk!) {
          // Upload display image
          const displayName = `${base}.webp`
          const { error: displayUploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(displayName, displayBuffer!, { contentType: 'image/webp', upsert: true })
          if (displayUploadError) throw displayUploadError

          // Upload thumbnail
          const thumbName = `${base}-thumb.webp`
          const { error: thumbUploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(thumbName, thumbBuffer!, { contentType: 'image/webp', upsert: true })
          if (thumbUploadError) throw thumbUploadError

          const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(displayName)

          return NextResponse.json({ url: publicUrl })
        }

        // Graceful fallback: sharp failed - upload original so owner never sees an error
        const { error: fallbackUploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, inputBuffer, { contentType: file.type, upsert: true })
        if (fallbackUploadError) throw fallbackUploadError

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(fileName)

        return NextResponse.json({ url: publicUrl })
      }

      // ---------------------------------------------------------------
      // payment-slips (and any future whitelisted bucket): original path
      // pixel-faithful - no sharp processing
      // ---------------------------------------------------------------
      const buffer = inputBuffer

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
