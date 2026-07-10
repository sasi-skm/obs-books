#!/usr/bin/env node
/**
 * Repair books whose image_url / images[] hold base64 data URIs.
 *
 * WHY
 * ---
 * The admin edit form used to fall back to the browser's base64 preview when
 * a storage upload failed. "The Illustrated Cider with Rosie" ended up with
 * nine base64 JPEGs (~12 MB) in a single row. Next.js inlines that into the
 * HTML and again into the RSC payload, so:
 *
 *   /shop                 2.9 MB   (2.6 MB of it one book's cover, twice)
 *   /book/<that book>    36.8 MB   (the data URI appears 27 times)
 *
 * The leak is fixed in app/admin/books/[id]/page.tsx, and lib/books-data.ts
 * now serves a placeholder rather than shipping base64. This script fixes the
 * underlying data: it decodes each data URI, uploads it to the book-images
 * bucket, and rewrites the row to point at real URLs.
 *
 * SAFETY
 * ------
 * Dry run by default. It prints exactly what it would do and writes nothing.
 * Pass --apply to actually upload and update. Requires SUPABASE_SERVICE_ROLE_KEY.
 *
 *   node scripts/migrate-data-uri-images.mjs            # dry run
 *   node scripts/migrate-data-uri-images.mjs --apply    # writes to the DB
 *
 * Run it against a restored copy of the database before running it on
 * production. The original base64 is the ONLY copy of these photos, so the
 * script never clears a column until the corresponding upload has succeeded.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const BUCKET = 'book-images'

// Load .env.local without adding a dotenv dependency.
function loadEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {
    /* env may come from the shell instead */
  }
}
loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const db = createClient(url, serviceKey)

const isDataUri = (s) => typeof s === 'string' && s.startsWith('data:')

/** "data:image/jpeg;base64,AAA..." -> { buffer, ext, contentType } */
function decodeDataUri(uri) {
  const m = uri.match(/^data:([^;]+);base64,(.*)$/s)
  if (!m) throw new Error('Unrecognised data URI')
  const contentType = m[1]
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  return { buffer: Buffer.from(m[2], 'base64'), ext, contentType }
}

async function uploadOne(bookId, index, uri) {
  const { buffer, ext, contentType } = decodeDataUri(uri)
  const path = `${bookId}/migrated-${index}.${ext}`
  const kb = Math.round(buffer.length / 1024)

  if (!APPLY) {
    console.log(`      would upload ${path} (${kb} KB, ${contentType})`)
    return `DRY-RUN:${path}`
  }

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw new Error(`upload ${path} failed: ${error.message}`)

  const { data } = db.storage.from(BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error(`no public URL for ${path}`)
  console.log(`      uploaded ${path} (${kb} KB)`)
  return data.publicUrl
}

async function main() {
  console.log(APPLY ? '=== APPLY: will write ===' : '=== DRY RUN: no writes ===\n')

  const { data: books, error } = await db
    .from('books')
    .select('id, title, image_url, images')
  if (error) throw new Error(error.message)

  const affected = books.filter(
    (b) => isDataUri(b.image_url) || (Array.isArray(b.images) && b.images.some(isDataUri)),
  )

  if (affected.length === 0) {
    console.log('No books store base64 images. Nothing to do.')
    return
  }

  console.log(`${affected.length} book(s) affected:\n`)

  for (const book of affected) {
    const gallery = Array.isArray(book.images) ? book.images : []
    const bytes =
      (isDataUri(book.image_url) ? book.image_url.length : 0) +
      gallery.reduce((n, u) => n + (isDataUri(u) ? u.length : 0), 0)
    console.log(`  ${book.title} (${book.id})`)
    console.log(`    ~${Math.round(bytes / 1024)} KB of base64 across ${gallery.length} image(s)`)

    // Rebuild the gallery, uploading only the data URIs and leaving real
    // URLs alone. Position is preserved: images[0] is the cover.
    const newGallery = []
    for (let i = 0; i < gallery.length; i++) {
      const entry = gallery[i]
      newGallery.push(isDataUri(entry) ? await uploadOne(book.id, i, entry) : entry)
    }

    let newCover = book.image_url
    if (isDataUri(newCover)) {
      // The cover is normally images[0]. Reuse that upload rather than
      // storing the same bytes twice.
      newCover =
        newGallery[0] && !isDataUri(newGallery[0])
          ? newGallery[0]
          : await uploadOne(book.id, 'cover', book.image_url)
    }

    if (!APPLY) {
      console.log('      would update row: image_url + images[]\n')
      continue
    }

    if (isDataUri(newCover) || newGallery.some(isDataUri)) {
      throw new Error(`refusing to write base64 back for ${book.id}`)
    }

    const { error: updErr } = await db
      .from('books')
      .update({ image_url: newCover, images: newGallery })
      .eq('id', book.id)
    if (updErr) throw new Error(`update ${book.id} failed: ${updErr.message}`)
    console.log('      row updated\n')
  }

  console.log(
    APPLY
      ? 'Done. Purge the storefront cache (/api/admin/revalidate) and re-check page sizes.'
      : '\nDry run complete. Re-run with --apply to write.',
  )
}

main().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
