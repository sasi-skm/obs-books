/**
 * One-time backfill: convert existing book-images originals to optimized
 * <base>.webp (display) + <base>-thumb.webp (thumbnail), and repoint the
 * books table to the .webp display URLs. Idempotent. Originals are left in
 * storage (NOT deleted) so this is fully reversible.
 *
 * Usage (from a clean non-OneDrive checkout with deps installed + .env.local):
 *   node scripts/backfill-book-images.mjs --dry     # report only, no writes
 *   node scripts/backfill-book-images.mjs           # perform backfill
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from env/.env.local.
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DRY = process.argv.includes('--dry')
const BUCKET = 'book-images'

// --- env (process.env first, then .env.local) ---------------------------------
function loadEnv() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    try {
      const txt = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)=(.*)$/)
        if (!m) continue
        const v = m[2].trim().replace(/^["']|["']$/g, '')
        if (m[1] === 'NEXT_PUBLIC_SUPABASE_URL' && !url) url = v
        if (m[1] === 'SUPABASE_SERVICE_ROLE_KEY' && !key) key = v
      }
    } catch {}
  }
  if (!url || !key) { console.error('Missing Supabase env'); process.exit(1) }
  return { url, key }
}

const { url: SUPA_URL, key: SRK } = loadEnv()
const sb = createClient(SUPA_URL, SRK, { auth: { persistSession: false } })
const PUBLIC_PREFIX = `${SUPA_URL}/storage/v1/object/public/${BUCKET}/`

// A storage object name we own (inside book-images public path), else null.
function objectName(u) {
  if (typeof u !== 'string' || !u.startsWith(PUBLIC_PREFIX)) return null
  return decodeURIComponent(u.slice(PUBLIC_PREFIX.length).split('?')[0])
}
const baseOf = (name) => name.replace(/\.[^/.]+$/, '')
const publicUrl = (name) => sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl

async function exists(name) {
  const { data } = await sb.storage.from(BUCKET).list('', { search: name, limit: 100 })
  return !!data?.some((o) => o.name === name)
}

// Process one image URL -> returns the display .webp URL (or original on skip/fail).
async function processUrl(u, stats) {
  const name = objectName(u)
  if (!name) { stats.skippedExternal++; return u } // external/placeholder/data: -> leave as-is
  const base = baseOf(name)
  const dispName = `${base}.webp`
  const thumbName = `${base}-thumb.webp`

  const haveDisp = name.endsWith('.webp') || (await exists(dispName))
  const haveThumb = await exists(thumbName)
  if (haveDisp && haveThumb) { stats.alreadyDone++; return publicUrl(dispName) }

  const { data: blob, error: dlErr } = await sb.storage.from(BUCKET).download(name)
  if (dlErr || !blob) { stats.errors.push(`download ${name}: ${dlErr?.message}`); return u }
  const input = Buffer.from(await blob.arrayBuffer())

  try {
    const pipe = sharp(input).rotate()
    if (!haveDisp) {
      const disp = await pipe.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      if (!DRY) { const { error } = await sb.storage.from(BUCKET).upload(dispName, disp, { contentType: 'image/webp', upsert: true }); if (error) throw error }
      stats.dispBytesBefore += input.length; stats.dispBytesAfter += disp.length
    }
    if (!haveThumb) {
      const th = await pipe.clone().resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()
      if (!DRY) { const { error } = await sb.storage.from(BUCKET).upload(thumbName, th, { contentType: 'image/webp', upsert: true }); if (error) throw error }
      stats.thumbCount++
    }
    stats.processed++
    return publicUrl(dispName)
  } catch (e) {
    stats.errors.push(`sharp ${name}: ${e.message}`)
    return u // leave row pointing at the still-valid original
  }
}

async function main() {
  console.log(`backfill ${DRY ? '(DRY RUN)' : '(LIVE)'} bucket=${BUCKET}`)
  const { data: books, error } = await sb.from('books').select('id, image_url, images')
  if (error) { console.error('books fetch failed', error); process.exit(1) }

  // Backup BEFORE any write.
  const bkDir = resolve(process.cwd(), '_backfill-backup')
  if (!existsSync(bkDir)) mkdirSync(bkDir, { recursive: true })
  const bkFile = resolve(bkDir, `books-image-urls-${Date.now()}.json`)
  writeFileSync(bkFile, JSON.stringify(books, null, 2))
  console.log(`backed up ${books.length} book rows -> ${bkFile}`)

  const stats = { processed: 0, alreadyDone: 0, skippedExternal: 0, thumbCount: 0, rowsUpdated: 0, dispBytesBefore: 0, dispBytesAfter: 0, errors: [] }

  for (const b of books) {
    const newCover = b.image_url ? await processUrl(b.image_url, stats) : b.image_url
    let newImages = b.images
    if (Array.isArray(b.images)) {
      newImages = []
      for (const im of b.images) newImages.push(typeof im === 'string' ? await processUrl(im, stats) : im)
    }
    const coverChanged = newCover !== b.image_url
    const imagesChanged = JSON.stringify(newImages) !== JSON.stringify(b.images)
    if (coverChanged || imagesChanged) {
      stats.rowsUpdated++
      if (!DRY) {
        const { error: upErr } = await sb.from('books').update({ image_url: newCover, images: newImages }).eq('id', b.id)
        if (upErr) stats.errors.push(`update book ${b.id}: ${upErr.message}`)
      }
    }
  }

  console.log(JSON.stringify({
    books: books.length,
    processed: stats.processed,
    thumbsCreated: stats.thumbCount,
    alreadyDone: stats.alreadyDone,
    skippedExternal: stats.skippedExternal,
    rowsUpdated: stats.rowsUpdated,
    displayMBBefore: +(stats.dispBytesBefore / 1048576).toFixed(1),
    displayMBAfter: +(stats.dispBytesAfter / 1048576).toFixed(1),
    errorCount: stats.errors.length,
  }, null, 2))
  if (stats.errors.length) console.log('errors:\n' + stats.errors.slice(0, 25).join('\n'))
}

main().catch((e) => { console.error(e); process.exit(1) })
