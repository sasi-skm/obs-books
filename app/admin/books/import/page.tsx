'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface CsvRow {
  title: string
  author: string
  price: string
  category: string
  condition: string
  copies: string
  weight_grams: string
  description_en: string
  description_th: string
  publisher: string
  year_published: string
  pages: string
  cover_type: string
  language: string
  height_cm: string
  width_cm: string
  featured: string
}

interface PreviewRow extends CsvRow {
  _valid: boolean
  _errors: string[]
}

const REQUIRED_COLUMNS = ['title', 'price', 'category', 'condition']
const VALID_CONDITIONS = ['Like New', 'Very Good', 'Good', 'Well Read', 'Fine', 'Fair', 'Reading Copy']
const VALID_CATEGORIES = [
  'wildflowers', 'garden-roses', 'trees-plants', 'butterflies',
  'wildlife-birds-animals', 'cookbooks', 'country-life', 'fairytale', 'art-illustration', 'rare-items',
  'embroidery-fabric', 'sale',
]

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'))

  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(current.trim()); current = '' }
      else { current += ch }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row as unknown as CsvRow
  })
}

function validateRow(row: CsvRow, index: number): PreviewRow {
  const errors: string[] = []

  for (const col of REQUIRED_COLUMNS) {
    if (!row[col as keyof CsvRow]?.trim()) {
      errors.push(`Missing ${col}`)
    }
  }

  const price = parseFloat(row.price)
  if (isNaN(price) || price < 0) errors.push('Invalid price')

  const copies = parseInt(row.copies)
  if (row.copies && (isNaN(copies) || copies < 0)) errors.push('Invalid copies')

  const weight = parseInt(row.weight_grams)
  if (row.weight_grams && (isNaN(weight) || weight < 0)) errors.push('Invalid weight_grams')

  if (row.condition && !VALID_CONDITIONS.includes(row.condition)) {
    errors.push(`Condition must be one of: ${VALID_CONDITIONS.join(', ')}`)
  }

  if (row.category && !VALID_CATEGORIES.includes(row.category)) {
    errors.push(`Unknown category: ${row.category}`)
  }

  void index

  return { ...row, _valid: errors.length === 0, _errors: errors }
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ inserted: number; failed: number } | null>(null)
  const [fileName, setFileName] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      const validated = rows.map((row, i) => validateRow(row, i))
      setPreview(validated)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = preview.filter(r => r._valid)
    if (validRows.length === 0) return

    setImporting(true)
    let inserted = 0
    let failed = 0

    const books = validRows.map(r => ({
      title: r.title.trim(),
      author: r.author?.trim() || null,
      price: parseFloat(r.price),
      category: r.category.trim(),
      condition: r.condition.trim(),
      copies: parseInt(r.copies) || 1,
      weight_grams: r.weight_grams ? parseInt(r.weight_grams) : null,
      description: r.description_en?.trim() || null,
      description_en: r.description_en?.trim() || null,
      description_th: r.description_th?.trim() || null,
      publisher: r.publisher?.trim() || null,
      year_published: r.year_published ? parseInt(r.year_published) : null,
      pages: r.pages ? parseInt(r.pages) : null,
      cover_type: r.cover_type?.trim() || null,
      language: r.language?.trim() || null,
      height_cm: r.height_cm ? parseFloat(r.height_cm) : null,
      width_cm: r.width_cm ? parseFloat(r.width_cm) : null,
      featured: r.featured?.toLowerCase() === 'true' || r.featured === '1',
      status: 'available',
    }))

    for (let i = 0; i < books.length; i += 50) {
      const batch = books.slice(i, i + 50)
      const { error } = await supabase.from('books').insert(batch)
      if (error) {
        failed += batch.length
      } else {
        inserted += batch.length
      }
    }

    setResult({ inserted, failed })
    setImporting(false)
  }

  const validCount = preview.filter(r => r._valid).length
  const invalidCount = preview.filter(r => !r._valid).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-normal text-ink">Import Books from CSV</h1>
          <p className="font-body text-sm text-ink-muted mt-1">Upload a CSV file to bulk-add books to the store</p>
        </div>
        <Link href="/admin/books" className="font-heading text-sm text-ink-muted hover:text-sage">
          - Back to Books
        </Link>
      </div>

      {/* Instructions */}
      <div className="bg-parchment border border-line p-4 mb-6">
        <p className="font-heading text-sm text-ink mb-2">CSV column format:</p>
        <code className="text-xs text-ink-light block font-mono mb-3">
          title, author, price, category, condition, copies, weight_grams, description_en, description_th, publisher, year_published, pages, cover_type, language, height_cm, width_cm, featured
        </code>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-ink-muted font-body">
          <div><span className="font-heading text-ink-light">category:</span> wildflowers, garden-roses, trees-plants, butterflies, cookbooks, tea-country, fairytale, art-nature, rare-items</div>
          <div><span className="font-heading text-ink-light">condition:</span> Like New, Very Good, Good, Well Read</div>
          <div><span className="font-heading text-ink-light">copies:</span> number (default 1)</div>
          <div><span className="font-heading text-ink-light">featured:</span> true / false</div>
          <div><span className="font-heading text-ink-light">weight_grams:</span> number in grams</div>
          <div><span className="font-heading text-ink-light">year_published / pages / height_cm / width_cm:</span> numbers</div>
          <div><span className="font-heading text-ink-light">Required:</span> title, price, category, condition</div>
          <div><span className="font-heading text-ink-light">cover_type:</span> Hardcover, Softcover, Paperback, etc.</div>
        </div>
      </div>

      {/* File upload */}
      <div
        className="border-2 border-dashed border-line rounded p-8 text-center mb-6 cursor-pointer hover:border-sage transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        <p className="font-body text-sm text-ink-muted">
          {fileName ? (
            <span className="font-heading text-ink">{fileName}</span>
          ) : (
            <>Click to upload a <span className="font-heading">.csv</span> file</>
          )}
        </p>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4 text-sm font-body">
              <span className="text-ink-muted">{preview.length} rows total</span>
              <span className="text-moss">{validCount} valid</span>
              {invalidCount > 0 && <span className="text-rose">{invalidCount} with errors</span>}
            </div>
            {result ? (
              <div className="text-sm font-body">
                <span className="text-moss font-heading">{result.inserted} inserted</span>
                {result.failed > 0 && <span className="text-rose ml-3">{result.failed} failed</span>}
              </div>
            ) : (
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="px-5 py-2 bg-sage text-offwhite font-heading text-sm rounded hover:bg-sage-light disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : `Import ${validCount} books`}
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-line">
            <table className="min-w-full text-xs font-body">
              <thead className="bg-parchment">
                <tr>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Status</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Title</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Author</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Price</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Category</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Condition</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Copies</th>
                  <th className="px-3 py-2 text-left text-ink-muted font-heading font-normal">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.map((row, i) => (
                  <tr key={i} className={row._valid ? 'bg-offwhite' : 'bg-rose/5'}>
                    <td className="px-3 py-2">
                      {row._valid ? (
                        <span className="text-moss font-heading">OK</span>
                      ) : (
                        <span className="text-rose font-heading">Error</span>
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate text-ink">{row.title}</td>
                    <td className="px-3 py-2 text-ink-muted">{row.author}</td>
                    <td className="px-3 py-2">฿{row.price}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.condition}</td>
                    <td className="px-3 py-2">{row.copies || 1}</td>
                    <td className="px-3 py-2 text-rose">{row._errors.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && result.inserted > 0 && (
            <div className="mt-4 p-4 bg-parchment border border-line">
              <p className="text-ink font-heading text-sm">
                Successfully imported {result.inserted} book{result.inserted !== 1 ? 's' : ''}.
              </p>
              <Link href="/admin/books" className="text-sage font-body text-sm underline mt-1 inline-block">
                View all books
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
