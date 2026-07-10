#!/usr/bin/env node
/**
 * Recompress the static photos in public/images to web weight.
 *
 * WHY
 * ---
 * next.config.mjs sets images.unoptimized (deliberately: the Hobby plan's
 * optimizer quota 402s once exceeded and breaks photos site-wide), so every
 * byte in public/images ships to customers as-is. Most of these are phone
 * photos at 3-4000px / 600-900 KB, displayed at <=1600px. Resizing the
 * long edge to 1600px and re-encoding JPEG at q78 is visually identical
 * at display sizes and cuts ~75-85% of the weight.
 *
 * SAFETY
 * ------
 * - Never touches promptpay-qr.jpg (recompression artifacts could make a
 *   bank app fail to scan it; that image is money-path critical).
 * - Only writes a file when the recompressed version is SMALLER.
 * - Keeps filenames and formats, so no code references change.
 * - Idempotent: already-small files come out within a few KB and are
 *   skipped on the size check.
 *
 * Usage: node scripts/compress-public-images.mjs [--dry-run]
 */

import sharp from 'sharp'
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const DIR = 'public/images'
const MAX_EDGE = 1600
const JPEG_QUALITY = 78
const DRY = process.argv.includes('--dry-run')
const SKIP = new Set(['promptpay-qr.jpg'])

const files = readdirSync(DIR).filter(f => {
  const ext = extname(f).toLowerCase()
  return ['.jpg', '.jpeg', '.png'].includes(ext) && !SKIP.has(f)
})

let totalBefore = 0
let totalAfter = 0

for (const f of files) {
  const path = join(DIR, f)
  const before = statSync(path).size
  const isPng = extname(f).toLowerCase() === '.png'

  const input = readFileSync(path)
  const img = sharp(input, { failOn: 'none' }).rotate() // bake EXIF orientation
  const meta = await img.metadata()

  let pipeline = img
  if ((meta.width ?? 0) > MAX_EDGE || (meta.height ?? 0) > MAX_EDGE) {
    pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  }
  const out = isPng
    ? await pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer()
    : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()

  totalBefore += before
  if (out.length < before) {
    totalAfter += out.length
    if (!DRY) writeFileSync(path, out)
    console.log(`${f}: ${(before / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB`)
  } else {
    totalAfter += before
    console.log(`${f}: ${(before / 1024).toFixed(0)} KB (kept, recompress not smaller)`)
  }
}

console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)} MB -> ${(totalAfter / 1024 / 1024).toFixed(1)} MB${DRY ? ' (dry run, nothing written)' : ''}`)
