'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { CATEGORIES } from '@/lib/translations'
import { supabase } from '@/lib/supabase'
import { SAMPLE_BOOKS } from '@/lib/books-data'

const CONDITIONS = ['Like New', 'Very Good', 'Good', 'Well Read']
const COVER_TYPES = ['Hardcover', 'Softcover', 'Paperback', 'Spiral-bound', 'Other']

type ImageSlot = { file: File | null; preview: string; existing: string }
type VideoSlot = { file: File | null; preview: string; existing: string }

export default function EditBookPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string

  const [originalCategory, setOriginalCategory] = useState('')
  const [form, setForm] = useState({
    title: '', author: '', category: 'wildflowers',
    copies: '1', weight_grams: '', featured: false, status: 'available',
    publisher: '', year_published: '', pages: '', cover_type: '', language: '',
    height_cm: '', width_cm: '',
  })
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionTh, setDescriptionTh] = useState('')
  const [descTab, setDescTab] = useState<'en' | 'th'>('en')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const [conditionPrices, setConditionPrices] = useState<Record<string, string>>({
    'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '',
  })
  const [conditionCopies, setConditionCopies] = useState<Record<string, string>>({
    'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '',
  })
  const [images, setImages] = useState<ImageSlot[]>(
    Array(9).fill(null).map(() => ({ file: null, preview: '', existing: '' }))
  )
  const [videoSlot, setVideoSlot] = useState<VideoSlot>({ file: null, preview: '', existing: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [dragOverGrid, setDragOverGrid] = useState(false)
  const dragCounterRef = useRef(0)

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

  const handleSlotDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverSlot(null)
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    readFileAsDataUrl(file).then(preview => {
      setImages(prev => {
        const next = [...prev]
        next[index] = { file, preview, existing: next[index].existing }
        return next
      })
    })
  }

  const handleGridDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setDragOverGrid(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    const loaded = await Promise.all(files.map(async f => ({ file: f, preview: await readFileAsDataUrl(f) })))
    setImages(prev => {
      const next = [...prev]
      let li = 0
      for (let i = 0; i < next.length && li < loaded.length; i++) {
        if (!next[i].preview) next[i] = { file: loaded[li].file, preview: loaded[li++].preview, existing: '' }
      }
      return next
    })
  }
  const [waitlist, setWaitlist] = useState<{ id: string; full_name?: string; email: string; created_at: string }[]>([])

  const loadWaitlist = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') return
    try {
      const { data } = await supabase
        .from('waitlists')
        .select('id, email, created_at, profiles(full_name)')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true })
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWaitlist(data.map((w: any) => ({
          id: w.id,
          email: w.email,
          created_at: w.created_at,
          full_name: Array.isArray(w.profiles) ? w.profiles[0]?.full_name : w.profiles?.full_name,
        })))
      }
    } catch {}
  }, [bookId])

  useEffect(() => { loadBook(); loadWaitlist() }, [bookId, loadWaitlist]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBook = async () => {
    let book: Book | null = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data } = await supabase.from('books').select('*').eq('id', bookId).single()
        if (data) book = data as Book
      } catch {}
    }
    if (!book) book = SAMPLE_BOOKS.find(b => b.id === bookId) || null

    if (book) {
      setForm({
        title: book.title, author: book.author, category: book.category,
        copies: String(book.copies), weight_grams: book.weight_grams ? String(book.weight_grams) : '',
        featured: book.featured, status: book.status,
        publisher: book.publisher || '',
        year_published: book.year_published ? String(book.year_published) : '',
        pages: book.pages ? String(book.pages) : '',
        cover_type: book.cover_type || '',
        language: book.language || '',
        height_cm: book.height_cm ? String(book.height_cm) : '',
        width_cm: book.width_cm ? String(book.width_cm) : '',
      })

      setOriginalCategory(book.category)
      setDescriptionEn(book.description_en || book.description || '')
      setDescriptionTh(book.description_th || '')

      if (book.video_url) {
        setVideoSlot({ file: null, preview: book.video_url, existing: book.video_url })
      }

      if (book.condition_prices && Object.keys(book.condition_prices).length > 0) {
        const prices: Record<string, string> = { 'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '' }
        for (const [cond, price] of Object.entries(book.condition_prices)) {
          if (cond in prices) prices[cond] = String(price)
        }
        setConditionPrices(prices)
      } else {
        const prices: Record<string, string> = { 'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '' }
        const legacyCond = book.condition === 'Fair' ? 'Well Read' : book.condition
        if (legacyCond in prices) prices[legacyCond] = String(book.price)
        setConditionPrices(prices)
      }

      if (book.condition_copies && Object.keys(book.condition_copies).length > 0) {
        const copies: Record<string, string> = { 'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '' }
        for (const [cond, count] of Object.entries(book.condition_copies)) {
          if (cond in copies) copies[cond] = String(count)
        }
        setConditionCopies(copies)
      }

      const slots: ImageSlot[] = Array(9).fill(null).map(() => ({ file: null, preview: '', existing: '' }))
      const imgArray = (book.images && book.images.length > 0) ? book.images : [book.image_url]
      imgArray.forEach((url, i) => {
        if (i < 9) slots[i] = { file: null, preview: url, existing: url }
      })
      setImages(slots)
    }
    setLoading(false)
  }

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file).then(preview => {
      setImages(prev => { const next = [...prev]; next[index] = { file, preview, existing: next[index].existing }; return next })
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev]
      next[index] = { file: null, preview: '', existing: '' }
      return next
    })
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoSlot({ file, preview: URL.createObjectURL(file), existing: videoSlot.existing })
  }

  const resizeImage = (file: File, maxPx: number, quality: number): Promise<File> =>
    new Promise((resolve) => {
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

  const resizeImageForAI = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
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

  const handleGenerateDescription = async () => {
    const hasCover = !!images[0]?.preview
    if (!hasCover && !form.title) { setGenError('Upload a cover photo or enter a title first'); return }
    setGenerating(true)
    setGenError('')
    try {
      // Only send base64 data URLs (newly uploaded), not existing Supabase URLs
      const rawDataUrl = images[0]?.preview?.startsWith('data:') ? images[0].preview : null
      const coverDataUrl = rawDataUrl ? await resizeImageForAI(rawDataUrl) : null
      const res = await fetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          publisher: form.publisher,
          year_published: form.year_published,
          pages: form.pages,
          cover_type: form.cover_type,
          language: form.language,
          category: form.category,
          imageDataUrl: coverDataUrl,
        }),
      })
      const data = await res.json()
      if (data.error) { setGenError(data.error); return }
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        author: data.author || f.author,
        publisher: data.publisher || f.publisher,
        year_published: data.year_published || f.year_published,
        pages: data.pages || f.pages,
        cover_type: data.cover_type || f.cover_type,
        language: data.language || f.language,
        category: data.category || f.category,
      }))
      setDescriptionEn(data.en || '')
      setDescriptionTh(data.th || '')
    } catch (err: unknown) {
      setGenError('Request failed: ' + (err instanceof Error ? err.message : String(err)))
    }
    setGenerating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) { setError('Title is required'); return }
    const filledPrices = Object.entries(conditionPrices).filter(([, v]) => v && parseInt(v) > 0)
    if (filledPrices.length === 0) { setError('Set at least one condition price'); return }

    setSaving(true)
    setError('')

    try {
      const isSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
      const finalUrls: string[] = []
      let finalVideoUrl: string | null = videoSlot.existing || null

      if (isSupabase) {
        const imageResults = await Promise.all(images.filter(s => s.preview).map(async (slot) => {
          if (!slot.file) return slot.existing || slot.preview
          const resized = await resizeImage(slot.file, 1600, 0.9)
          const fd = new FormData()
          fd.append('file', resized)
          fd.append('bookId', bookId)
          const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
          if (!res.ok) return slot.existing || slot.preview
          const { url } = await res.json()
          return (url as string | null) || slot.existing || slot.preview
        }))
        finalUrls.push(...imageResults.filter((u): u is string => !!u))

        if (videoSlot.file) {
          const fd = new FormData()
          fd.append('file', videoSlot.file)
          fd.append('bookId', bookId)
          const res = await fetch('/api/admin/upload-video', { method: 'POST', body: fd })
          if (res.ok) {
            const { url } = await res.json()
            if (url) finalVideoUrl = url
          }
        }
      }

      const conditionPricesNum: Record<string, number> = {}
      for (const [cond, val] of filledPrices) {
        conditionPricesNum[cond] = parseInt(val)
      }
      const conditionCopiesNum: Record<string, number> = {}
      for (const [cond] of filledPrices) {
        const v = conditionCopies[cond]
        conditionCopiesNum[cond] = v && parseInt(v) > 0 ? parseInt(v) : 1
      }
      const totalCopies = Object.values(conditionCopiesNum).reduce((a, b) => a + b, 0)
      const prices = Object.values(conditionPricesNum)
      const lowestPrice = Math.min(...prices)
      const primaryCondition = filledPrices[0][0]
      const imageUrl = finalUrls[0] || '/images/hero-botanical.jpeg'

      if (isSupabase) {
        const { error: updateError } = await supabase.from('books').update({
          title: form.title,
          author: form.author,
          price: lowestPrice,
          category: form.category,
          condition: primaryCondition,
          condition_prices: conditionPricesNum,
          condition_copies: conditionCopiesNum,
          copies: totalCopies,
          description: descriptionEn || null,
          description_en: descriptionEn || null,
          description_th: descriptionTh || null,
          publisher: form.publisher || null,
          year_published: form.year_published ? parseInt(form.year_published) : null,
          pages: form.pages ? parseInt(form.pages) : null,
          cover_type: form.cover_type || null,
          language: form.language || null,
          height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
          width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
          featured: form.featured,
          status: form.status,
          image_url: imageUrl,
          images: finalUrls,
          video_url: finalVideoUrl,
          weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
        }).eq('id', bookId)

        if (updateError) {
          if (updateError.message.includes('column') || updateError.code === '42703') {
            setError('Database needs updating. Go to Supabase > SQL Editor and run the migration SQL first.')
          } else {
            setError('Failed to save: ' + updateError.message)
          }
          setSaving(false)
          return
        }
      }

      // Revalidate storefront cache for affected category pages
      await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          categories: [originalCategory, form.category],
        }),
      })

      router.push('/admin/books')
    } catch (err: unknown) {
      setError('Failed to update book: ' + (err instanceof Error ? err.message : String(err)))
    }
    setSaving(false)
  }

  if (loading) return <p className="text-ink-muted">Loading...</p>

  const filledCount = images.filter(s => s.preview).length

  return (
    <div>
      <Link href="/admin/books" className="font-heading text-sm text-ink-muted hover:text-sage mb-4 inline-block">
        - Back to Books
      </Link>
      <h1 className="font-heading text-2xl font-normal mb-6">Edit Book</h1>

      <form onSubmit={handleSubmit} className="max-w-xl bg-offwhite border border-line p-6">
        {error && <div className="mb-4 p-3 bg-rose/10 border border-rose/20 text-rose text-sm">{error}</div>}

        {/* Photos + Video grid */}
        <div className="mb-6">
          <label className="block font-heading text-sm mb-1">
            Photos & Video <span className="text-ink-muted font-body text-xs">(up to 9 photos + 1 video - first photo is the cover - click or drag &amp; drop)</span>
          </label>
          <div
            className={`grid grid-cols-3 gap-2 rounded transition-colors ${dragOverGrid ? 'ring-2 ring-sage/40 bg-sage/5' : ''}`}
            onDragEnter={() => { dragCounterRef.current++; setDragOverGrid(true) }}
            onDragLeave={() => { dragCounterRef.current--; if (dragCounterRef.current === 0) setDragOverGrid(false) }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleGridDrop}
          >
            {images.map((slot, i) => (
              <label
                key={i}
                className={`relative aspect-square border border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-cream
                  ${dragOverSlot === i ? 'border-sage bg-sage/10 scale-[1.02]' : 'border-line hover:border-sage'}`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverSlot(i) }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={e => handleSlotDrop(i, e)}
              >
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(i, e)} />
                {slot.preview ? (
                  <>
                    <Image src={slot.preview} alt="" fill className="object-cover" sizes="120px" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-sage text-white text-[9px] px-1 py-0.5 font-heading">COVER</span>}
                    <button type="button" onClick={e => { e.preventDefault(); removeImage(i) }}
                      className="absolute top-1 right-1 bg-rose text-white w-5 h-5 flex items-center justify-center text-xs">x</button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-ink-muted text-2xl">{dragOverSlot === i ? '📷' : '+'}</span>
                    {dragOverSlot === i && <span className="text-[9px] text-sage font-heading">Drop here</span>}
                  </div>
                )}
              </label>
            ))}
            <label className="relative aspect-square border border-dashed border-sage/40 flex flex-col items-center justify-center cursor-pointer hover:border-sage transition-colors overflow-hidden bg-cream">
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              {videoSlot.preview ? (
                <>
                  <video src={videoSlot.preview} className="absolute inset-0 w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                  <button type="button" onClick={e => { e.preventDefault(); setVideoSlot({ file: null, preview: '', existing: '' }) }}
                    className="absolute top-1 right-1 bg-rose text-white w-5 h-5 flex items-center justify-center text-xs z-10">x</button>
                </>
              ) : (
                <>
                  <span className="text-2xl mb-1">🎥</span>
                  <span className="text-[10px] text-ink-muted font-heading">VIDEO</span>
                </>
              )}
            </label>
          </div>
          <p className="text-xs text-ink-muted mt-1">{filledCount}/9 photos · {videoSlot.preview ? '1' : '0'}/1 video</p>
        </div>

        {/* AI Fill All Fields */}
        <div className="mb-5 p-3 bg-sage/5 border border-sage/20 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-sm text-ink">AI Fill All Fields</p>
              <p className="font-body text-xs text-ink-muted mt-0.5">
                {images[0]?.preview && !images[0].preview.startsWith('data:')
                  ? 'Uses title/author + web search to refresh all fields and descriptions.'
                  : images[0]?.preview
                  ? 'Uses cover photo + web search to fill all fields and descriptions.'
                  : 'Upload a new cover photo or use existing title to auto-fill.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-sage text-offwhite font-heading text-xs hover:bg-sage-light transition-colors disabled:opacity-50 rounded shrink-0 ml-3"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-offwhite border-t-transparent rounded-full" />
                  Searching...
                </>
              ) : (
                <><span>✨</span> AI Fill</>
              )}
            </button>
          </div>
          {genError && <p className="text-xs text-rose mt-2">{genError}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Title *</label>
          <input className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Author</label>
          <input className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
            value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-2">Condition, Price (฿) and Copies *</label>
          <p className="text-xs text-ink-muted mb-2">Leave price blank if that condition is not available</p>
          <div className="border border-line divide-y divide-line">
            <div className="flex items-center px-3 py-1.5 bg-parchment gap-3">
              <span className="font-heading text-xs text-ink-muted w-24 shrink-0">Condition</span>
              <span className="font-heading text-xs text-ink-muted w-28 shrink-0">Price (฿)</span>
              <span className="font-heading text-xs text-ink-muted">Copies</span>
            </div>
            {CONDITIONS.map(cond => (
              <div key={cond} className="flex items-center px-3 py-2.5 bg-cream gap-3">
                <span className="font-heading text-sm w-24 shrink-0">{cond}</span>
                <div className="flex items-center gap-1 w-28 shrink-0">
                  <span className="text-ink-muted text-sm">฿</span>
                  <input type="number" min="0" placeholder="—"
                    className="w-full bg-transparent font-body text-sm outline-none"
                    value={conditionPrices[cond]}
                    onChange={e => setConditionPrices(prev => ({ ...prev, [cond]: e.target.value }))} />
                </div>
                <input type="number" min="0" placeholder="1"
                  className="w-16 bg-transparent font-body text-sm outline-none border-b border-line/50"
                  value={conditionCopies[cond]}
                  onChange={e => setConditionCopies(prev => ({ ...prev, [cond]: e.target.value }))}
                  disabled={!conditionPrices[cond]} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Category</label>
          <select className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
            value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.en}</option>)}
          </select>
        </div>

        {/* Book Details */}
        <div className="mb-4 border border-line p-4 bg-cream">
          <p className="font-heading text-sm mb-3 text-ink-light">Book Details <span className="font-body text-xs">(optional - shown on product page)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Publisher</label>
              <input className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} placeholder="e.g. Dorling Kindersley" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Year Published</label>
              <input type="number" min="1800" max="2100" className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.year_published} onChange={e => setForm({ ...form, year_published: e.target.value })} placeholder="e.g. 1987" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Pages</label>
              <input type="number" min="1" className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="e.g. 256" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Cover Type</label>
              <select className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.cover_type} onChange={e => setForm({ ...form, cover_type: e.target.value })}>
                <option value="">Select...</option>
                {COVER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Language</label>
              <input className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="e.g. English" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Weight (grams)</label>
              <input type="number" min="0" className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.weight_grams} onChange={e => setForm({ ...form, weight_grams: e.target.value })} placeholder="e.g. 450" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Height (cm)</label>
              <input type="number" step="0.1" min="0" className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} placeholder="e.g. 28.5" />
            </div>
            <div>
              <label className="block font-heading text-xs mb-1 text-ink-muted">Width (cm)</label>
              <input type="number" step="0.1" min="0" className="w-full px-2 py-2 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage"
                value={form.width_cm} onChange={e => setForm({ ...form, width_cm: e.target.value })} placeholder="e.g. 21.5" />
            </div>
          </div>
        </div>

        {/* Description with EN/TH tabs */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="font-heading text-sm">Description</label>
          </div>
          <div className="flex border-b border-line mb-2">
            <button type="button"
              onClick={() => setDescTab('en')}
              className={'px-4 py-2 font-heading text-xs transition-colors border-b-2 ' +
                (descTab === 'en' ? 'border-sage text-sage' : 'border-transparent text-ink-muted hover:text-ink')}>
              English
            </button>
            <button type="button"
              onClick={() => setDescTab('th')}
              className={'px-4 py-2 font-heading text-xs transition-colors border-b-2 ' +
                (descTab === 'th' ? 'border-sage text-sage' : 'border-transparent text-ink-muted hover:text-ink')}>
              Thai
            </button>
          </div>
          {descTab === 'en' ? (
            <textarea
              className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[100px] resize-y"
              value={descriptionEn}
              onChange={e => setDescriptionEn(e.target.value)}
              placeholder="English description..."
            />
          ) : (
            <textarea
              className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[100px] resize-y"
              value={descriptionTh}
              onChange={e => setDescriptionTh(e.target.value)}
              placeholder="Thai description..."
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Status</label>
          <select className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
            value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-sage w-4 h-4" />
            <span className="font-heading text-sm">Featured book</span>
          </label>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Update Book'}
        </button>
      </form>

      {/* Waitlist section */}
      <div className="max-w-xl mt-8">
        <h2 className="font-heading text-lg font-normal mb-3">Waitlist</h2>
        {waitlist.length === 0 ? (
          <p className="text-sm text-ink-muted italic">No one on the waitlist for this title</p>
        ) : (
          <table className="w-full text-sm border border-line">
            <thead>
              <tr className="bg-parchment border-b border-line">
                <th className="text-left px-3 py-2 font-heading font-normal text-ink-light">Customer</th>
                <th className="text-left px-3 py-2 font-heading font-normal text-ink-light">Email</th>
                <th className="text-left px-3 py-2 font-heading font-normal text-ink-light">Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w, i) => (
                <tr key={w.id} className={i % 2 === 0 ? 'bg-offwhite' : 'bg-cream'}>
                  <td className="px-3 py-2 text-ink">{w.full_name || '-'}</td>
                  <td className="px-3 py-2 text-ink-light">{w.email}</td>
                  <td className="px-3 py-2 text-ink-muted">
                    {new Date(w.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
