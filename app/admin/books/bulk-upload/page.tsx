'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/translations'
import { adminFetch } from '@/lib/admin-fetch'
import { supabase } from '@/lib/supabase'

const CONDITIONS = ['Like New', 'Very Good', 'Good', 'Well Read']

interface BulkBook {
  id: string
  file: File
  preview: string
  status: 'pending' | 'filling' | 'filled' | 'ai-error' | 'uploading' | 'saved' | 'save-error'
  error?: string
  title: string
  author: string
  category: string
  condition: string
  price: string
  descriptionEn: string
  descriptionTh: string
  publisher: string
  year_published: string
  pages: string
  cover_type: string
  language: string
  selected: boolean
}

// --- Image resize helpers (same as single-book page) ---

function resizeImage(file: File, maxPx: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = document.createElement('img') as HTMLImageElement
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
        else { w = Math.round(w * maxPx / h); h = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg', quality,
      )
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

function resizeDataUrlForAI(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img') as HTMLImageElement
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [books, setBooks] = useState<BulkBook[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0, running: false })
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0, running: false })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  // --- Add photos ---

  const addFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    const newBooks: BulkBook[] = await Promise.all(imageFiles.map(async (file) => {
      const preview = await readFileAsDataUrl(file)
      return {
        id: crypto.randomUUID(),
        file,
        preview,
        status: 'pending' as const,
        title: '',
        author: '',
        category: 'wildflowers',
        condition: 'Good',
        price: '',
        descriptionEn: '',
        descriptionTh: '',
        publisher: '',
        year_published: '',
        pages: '',
        cover_type: '',
        language: '',
        selected: true,
      }
    }))

    setBooks(prev => [...prev, ...newBooks])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    addFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- AI Fill all pending ---

  const runAiFill = async () => {
    const pending = books.filter(b => b.status === 'pending' && b.selected)
    if (!pending.length) return

    abortRef.current = false
    setAiProgress({ current: 0, total: pending.length, running: true })

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) break

      const book = pending[i]
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'filling' } : b))
      setAiProgress(p => ({ ...p, current: i + 1 }))

      try {
        const smallDataUrl = await resizeDataUrlForAI(book.preview)
        const res = await adminFetch('/api/admin/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: smallDataUrl }),
        })

        let data
        try {
          data = await res.json()
        } catch {
          throw new Error('Server returned invalid response')
        }

        if (data.error) throw new Error(data.error)

        setBooks(prev => prev.map(b => b.id === book.id ? {
          ...b,
          status: 'filled',
          title: data.title || '',
          author: data.author || '',
          category: data.category || 'wildflowers',
          publisher: data.publisher || '',
          year_published: data.year_published || '',
          pages: data.pages || '',
          cover_type: data.cover_type || '',
          language: data.language || '',
          descriptionEn: data.en || '',
          descriptionTh: data.th || '',
        } : b))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI Fill failed'
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'ai-error', error: msg } : b))
      }

      // Small delay between calls to be gentle on API
      if (i < pending.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    setAiProgress(p => ({ ...p, running: false }))
  }

  const stopAiFill = () => { abortRef.current = true }

  // --- Retry single AI Fill ---

  const retryAiFill = async (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (!book) return

    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'filling', error: undefined } : b))

    try {
      const smallDataUrl = await resizeDataUrlForAI(book.preview)
      const res = await adminFetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: smallDataUrl }),
      })

      let data
      try { data = await res.json() } catch { throw new Error('Server returned invalid response') }
      if (data.error) throw new Error(data.error)

      setBooks(prev => prev.map(b => b.id === bookId ? {
        ...b,
        status: 'filled',
        title: data.title || '',
        author: data.author || '',
        category: data.category || 'wildflowers',
        publisher: data.publisher || '',
        year_published: data.year_published || '',
        pages: data.pages || '',
        cover_type: data.cover_type || '',
        language: data.language || '',
        descriptionEn: data.en || '',
        descriptionTh: data.th || '',
      } : b))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Fill failed'
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'ai-error', error: msg } : b))
    }
  }

  // --- Save all ---

  const saveAll = async () => {
    const toSave = books.filter(b => b.selected && (b.status === 'filled' || b.status === 'save-error') && b.title && b.price)
    if (!toSave.length) return

    setSaveProgress({ current: 0, total: toSave.length, running: true })

    for (let i = 0; i < toSave.length; i++) {
      const book = toSave[i]
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'uploading' } : b))
      setSaveProgress(p => ({ ...p, current: i + 1 }))

      try {
        // 1. Upload image (resized client-side)
        const resized = await resizeImage(book.file, 1600, 0.9)
        const fd = new FormData()
        fd.append('file', resized)
        const uploadRes = await adminFetch('/api/admin/upload-image', { method: 'POST', body: fd })

        if (!uploadRes.ok) {
          let errMsg = 'Image upload failed'
          try { const d = await uploadRes.json(); errMsg = d.error || errMsg } catch {}
          throw new Error(errMsg)
        }

        const { url: imageUrl } = await uploadRes.json()

        // 2. Insert book to database
        const price = parseInt(book.price)
        const { error: insertError } = await supabase.from('books').insert({
          title: book.title,
          author: book.author || null,
          price,
          category: book.category,
          condition: book.condition,
          condition_prices: { [book.condition]: price },
          condition_copies: { [book.condition]: 1 },
          copies: 1,
          description: book.descriptionEn || null,
          description_en: book.descriptionEn || null,
          description_th: book.descriptionTh || null,
          publisher: book.publisher || null,
          year_published: book.year_published ? parseInt(book.year_published) : null,
          pages: book.pages ? parseInt(book.pages) : null,
          cover_type: book.cover_type || null,
          language: book.language || null,
          featured: false,
          image_url: imageUrl,
          images: [imageUrl],
          status: 'available',
        })

        if (insertError) throw new Error(insertError.message)

        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'saved' } : b))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Save failed'
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'save-error', error: msg } : b))
      }
    }

    // Revalidate storefront cache
    const categories = toSave.map(b => b.category).filter((v, i, a) => a.indexOf(v) === i)
    try {
      await adminFetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      })
    } catch {}

    setSaveProgress(p => ({ ...p, running: false }))
  }

  // --- Helpers ---

  const removeBook = (id: string) => setBooks(prev => prev.filter(b => b.id !== id))
  const toggleSelect = (id: string) => setBooks(prev => prev.map(b => b.id === id ? { ...b, selected: !b.selected } : b))
  const toggleSelectAll = () => {
    const allSelected = books.every(b => b.selected)
    setBooks(prev => prev.map(b => ({ ...b, selected: !allSelected })))
  }

  const updateBook = (id: string, field: keyof BulkBook, value: string) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const pendingCount = books.filter(b => b.status === 'pending' && b.selected).length
  const readyCount = books.filter(b => b.selected && (b.status === 'filled' || b.status === 'save-error') && b.title && b.price).length
  const savedCount = books.filter(b => b.status === 'saved').length
  const isBusy = aiProgress.running || saveProgress.running

  const statusLabel = (s: BulkBook['status']) => {
    switch (s) {
      case 'pending': return { text: 'Pending', color: 'text-ink-muted' }
      case 'filling': return { text: 'AI Filling...', color: 'text-bark' }
      case 'filled': return { text: 'Ready', color: 'text-sage' }
      case 'ai-error': return { text: 'AI Error', color: 'text-rose' }
      case 'uploading': return { text: 'Saving...', color: 'text-bark' }
      case 'saved': return { text: 'Saved', color: 'text-sage' }
      case 'save-error': return { text: 'Save Error', color: 'text-rose' }
    }
  }

  // --- Render ---

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-normal">Bulk Upload</h1>
          <p className="font-body text-xs text-ink-muted mt-1">Drop photos, AI fills the details, review and save all at once.</p>
        </div>
        <Link href="/admin/books" className="font-heading text-sm text-sage hover:underline">&larr; Back to Books</Link>
      </div>

      {/* Drop zone */}
      {!isBusy && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-8 mb-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-sage bg-sage/5' : 'border-line hover:border-sage/50'
          }`}
        >
          <p className="font-heading text-base text-ink">Drop book cover photos here</p>
          <p className="font-body text-xs text-ink-muted mt-1">or click to select files - one photo per book</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Action bar */}
      {books.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="font-body text-xs text-ink-muted">
            {books.length} photo{books.length !== 1 ? 's' : ''} &middot; {pendingCount} pending &middot; {readyCount} ready &middot; {savedCount} saved
          </span>

          <div className="flex-1" />

          {aiProgress.running ? (
            <button onClick={stopAiFill} className="px-4 py-2 border border-rose text-rose font-heading text-xs hover:bg-rose/10 transition-colors rounded">
              Stop AI Fill ({aiProgress.current}/{aiProgress.total})
            </button>
          ) : (
            <button
              onClick={runAiFill}
              disabled={!pendingCount || isBusy}
              className="px-4 py-2 bg-bark text-offwhite font-heading text-xs hover:bg-bark/80 disabled:opacity-40 transition-colors rounded"
            >
              AI Fill All ({pendingCount})
            </button>
          )}

          {saveProgress.running ? (
            <span className="font-heading text-xs text-bark">Saving {saveProgress.current}/{saveProgress.total}...</span>
          ) : (
            <button
              onClick={saveAll}
              disabled={!readyCount || isBusy}
              className="px-4 py-2 bg-sage text-offwhite font-heading text-xs hover:bg-sage-light disabled:opacity-40 transition-colors rounded"
            >
              Save All ({readyCount})
            </button>
          )}
        </div>
      )}

      {/* Book list */}
      {books.length > 0 && (
        <div className="space-y-3">
          {/* Select all header */}
          <div className="flex items-center gap-2 px-3">
            <input
              type="checkbox"
              checked={books.length > 0 && books.every(b => b.selected)}
              onChange={toggleSelectAll}
              className="accent-sage w-4 h-4"
            />
            <span className="font-heading text-xs text-ink-muted">Select all</span>
          </div>

          {books.map(book => {
            const st = statusLabel(book.status)
            const isEditable = book.status !== 'saved' && book.status !== 'uploading'

            return (
              <div key={book.id} className={`border rounded p-3 ${book.status === 'saved' ? 'border-sage/30 bg-sage/5' : 'border-line bg-offwhite'}`}>
                <div className="flex gap-3">
                  {/* Checkbox + thumbnail */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={book.selected}
                      onChange={() => toggleSelect(book.id)}
                      disabled={book.status === 'saved'}
                      className="accent-sage w-4 h-4"
                    />
                    <div className="w-16 h-20 relative rounded overflow-hidden bg-parchment">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={book.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Status + Remove */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-heading text-xs ${st.color}`}>{st.text}</span>
                      <div className="flex gap-2">
                        {(book.status === 'ai-error' || book.status === 'pending') && (
                          <button onClick={() => retryAiFill(book.id)} className="font-heading text-xs text-bark hover:underline">
                            {book.status === 'ai-error' ? 'Retry AI' : 'AI Fill'}
                          </button>
                        )}
                        {book.status !== 'saved' && book.status !== 'uploading' && (
                          <button onClick={() => removeBook(book.id)} className="font-heading text-xs text-rose hover:underline">Remove</button>
                        )}
                      </div>
                    </div>

                    {book.error && <p className="text-xs text-rose mb-2">{book.error}</p>}

                    {/* Row 2: Title + Author */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        placeholder="Title *"
                        value={book.title}
                        onChange={e => updateBook(book.id, 'title', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-2 py-1.5 border border-line bg-cream font-body text-xs outline-none focus:border-sage disabled:opacity-60"
                      />
                      <input
                        placeholder="Author"
                        value={book.author}
                        onChange={e => updateBook(book.id, 'author', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-2 py-1.5 border border-line bg-cream font-body text-xs outline-none focus:border-sage disabled:opacity-60"
                      />
                    </div>

                    {/* Row 3: Category + Condition + Price */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <select
                        value={book.category}
                        onChange={e => updateBook(book.id, 'category', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-2 py-1.5 border border-line bg-cream font-body text-xs outline-none focus:border-sage disabled:opacity-60"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.en}</option>)}
                      </select>
                      <select
                        value={book.condition}
                        onChange={e => updateBook(book.id, 'condition', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-2 py-1.5 border border-line bg-cream font-body text-xs outline-none focus:border-sage disabled:opacity-60"
                      >
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        placeholder="Price (฿) *"
                        type="number"
                        value={book.price}
                        onChange={e => updateBook(book.id, 'price', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-2 py-1.5 border border-line bg-cream font-body text-xs outline-none focus:border-sage disabled:opacity-60"
                      />
                    </div>

                    {/* Row 4: Description (collapsible) */}
                    {book.descriptionEn && (
                      <p className="font-body text-xs text-ink-muted line-clamp-2">{book.descriptionEn}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {books.length === 0 && (
        <div className="text-center py-16 text-ink-muted">
          <p className="font-heading text-base">No photos yet</p>
          <p className="font-body text-xs mt-1">Drop cover photos above to get started</p>
        </div>
      )}

      {/* Bottom action bar (fixed) */}
      {savedCount > 0 && savedCount === books.length && (
        <div className="mt-8 text-center">
          <p className="font-heading text-base text-sage mb-3">All {savedCount} books saved!</p>
          <button
            onClick={() => router.push('/admin/books')}
            className="px-6 py-2 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors rounded"
          >
            Go to Books
          </button>
        </div>
      )}
    </div>
  )
}
