import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bookId = formData.get('bookId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Resize large images to max 1600px before watermarking for speed
    const imageBuffer = await sharp(rawBuffer)
      .resize(1600, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer()

    const meta = await sharp(imageBuffer).metadata()
    const imageWidth = meta.width ?? 800
    const imageHeight = meta.height ?? 1200

    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-new.jpg')

    const watermarkWidth = Math.round(imageWidth * 0.6)

    // Build white watermark: negate the logo (dark ink → white), use brightness as alpha
    const { data: grayData, info } = await sharp(logoPath)
      .greyscale()
      .negate()
      .resize(watermarkWidth, null, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // RGBA buffer: RGB = white (255,255,255), A = pixel brightness × 0.25 opacity
    const rgbaData = Buffer.alloc(info.width * info.height * 4)
    for (let i = 0; i < grayData.length; i++) {
      rgbaData[i * 4]     = 255
      rgbaData[i * 4 + 1] = 255
      rgbaData[i * 4 + 2] = 255
      rgbaData[i * 4 + 3] = Math.round((grayData[i] as number) * 0.25)
    }

    const watermarkBuffer = await sharp(rgbaData, {
      raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer()

    // Composite watermark centered over image
    const processed = await sharp(imageBuffer)
      .composite([{
        input: watermarkBuffer,
        gravity: 'center',
        top: Math.round((imageHeight - info.height) / 2),
        left: Math.round((imageWidth - info.width) / 2),
      }])
      .jpeg({ quality: 92 })
      .toBuffer()

    // Upload to Supabase storage
    const prefix = bookId ? bookId + '-' : ''
    const fileName = prefix + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg'

    const { error: uploadError } = await supabaseAdmin.storage
      .from('book-images')
      .upload(fileName, processed, { contentType: 'image/jpeg' })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage.from('book-images').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Image processing failed: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    )
  }
}
