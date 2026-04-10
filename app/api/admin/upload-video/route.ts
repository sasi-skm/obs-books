import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { writeFile, unlink, readFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const inputPath = path.join(tmpdir(), `obs-vid-in-${Date.now()}`)
  const outputPath = path.join(tmpdir(), `obs-vid-out-${Date.now()}.mp4`)

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bookId = formData.get('bookId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase()
    const inputPathWithExt = inputPath + '.' + ext

    await writeFile(inputPathWithExt, buffer)

    if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic)

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPathWithExt)
        .outputOptions([
          '-an',                  // strip all audio
          '-c:v libx264',         // H.264 codec for max browser compatibility
          '-crf 0',               // lossless quality
          '-preset ultrafast',    // fast encoding (lossless with ultrafast is still fine)
          '-movflags +faststart', // moov atom at front for instant playback
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    const outputBuffer = await readFile(outputPath)

    // Cleanup temp files
    await Promise.allSettled([unlink(inputPathWithExt), unlink(outputPath)])

    // Upload processed mp4 to Supabase
    const prefix = bookId ? 'video-' + bookId + '-' : 'video-'
    const fileName = prefix + Date.now() + '.mp4'

    const { error: uploadError } = await supabaseAdmin.storage
      .from('book-images')
      .upload(fileName, outputBuffer, { contentType: 'video/mp4' })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage.from('book-images').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    await Promise.allSettled([unlink(inputPath).catch(() => {}), unlink(outputPath).catch(() => {})])
    return NextResponse.json(
      { error: 'Video processing failed: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    )
  }
}
