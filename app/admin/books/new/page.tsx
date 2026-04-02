'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/translations'
import { supabase } from '@/lib/supabase'

const CONDITIONS = ['Like New', 'Very Good', 'Good', 'Well Read']

type ImageSlot = { file: File | null; preview: string }
type VideoSlot = { file: File | null; preview: string }

export default function NewBookPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', author: '', category: 'wildflowers',
    copies: '1', weight_grams: '', description: '', featured: false,
  })
  const [conditionPrices, setConditionPrices] = useState<Record<string, string>>({
    'Like New': '', 'Very Good': '', 'Good': '', 'Well Read': '',
  })
  const [images, setImages] = useState<ImageSlot[]>(
    Array(9).fill(null).map(() => ({ file: null, preview: '' }))
  )
  const [videoSlot, setVideoSlot] = useState<VideoSlot>({ file: null, preview: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImages(prev => {
        const next = [...prev]
        next[index] = { file, preview: ev.target?.result as string }
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev]
      next[index] = { file: null, preview: '' }
      return next
    })
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoSlot({ file, preview: URL.createObjectURL(file) })
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
      const uploadedUrls: string[] = []
      let uploadedVideoUrl: string | null = null

      if (isSupabase) {
        // Upload all images in parallel
        const imageSlots = images.filter(s => s.file)
        const imageResults = await Promise.all(imageSlots.map(async (slot) => {
          const ext = slot.file!.name.split('.').pop() || 'jpg'
          const fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
          const { error: uploadError } = await supabase.storage
            .from('book-images').upload(fileName, slot.file!, { contentType: slot.file!.type })
          if (uploadError) return null
          const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName)
          return publicUrl
        }))
        uploadedUrls.push(...imageResults.filter((u): u is string => u !== null))

        // Upload video
        if (videoSlot.file) {
          const ext = videoSlot.file.name.split('.').pop() || 'mp4'
          const fileName = 'video-' + Date.now() + '.' + ext
          const { error: vidError } = await supabase.storage
            .from('book-images').upload(fileName, videoSlot.file, { contentType: videoSlot.file.type })
          if (!vidError) {
            const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName)
            uploadedVideoUrl = publicUrl
          }
        }
      }

      const conditionPricesNum: Record<string, number> = {}
      for (const [cond, val] of filledPrices) {
        conditionPricesNum[cond] = parseInt(val)
      }
      const prices = Object.values(conditionPricesNum)
      const lowestPrice = Math.min(...prices)
      const primaryCondition = filledPrices[0][0]
      const imageUrl = uploadedUrls[0] || '/images/hero-botanical.jpeg'

      if (isSupabase) {
        const { error: insertError } = await supabase.from('books').insert({
          title: form.title,
          author: form.author,
          price: lowestPrice,
          category: form.category,
          condition: primaryCondition,
          condition_prices: conditionPricesNum,
          copies: parseInt(form.copies) || 1,
          description: form.description || null,
          featured: form.featured,
          image_url: imageUrl,
          images: uploadedUrls,
          video_url: uploadedVideoUrl,
          weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
          status: 'available',
        })

        if (insertError) {
          if (insertError.message.includes('column') || insertError.code === '42703') {
            setError('Database needs updating. Go to Supabase > SQL Editor and run the migration SQL first.')
          } else {
            setError('Failed to save: ' + insertError.message)
          }
          setSaving(false)
          return
        }
      }

      router.push('/admin/books')
    } catch (err: unknown) {
      setError('Failed to save book: ' + (err instanceof Error ? err.message : String(err)))
    }
    setSaving(false)
  }

  const filledCount = images.filter(s => s.preview).length

  return (
    <div>
      <Link href="/admin/books" className="font-heading text-sm text-ink-muted hover:text-sage mb-4 inline-block">
        - Back to Books
      </Link>
      <h1 className="font-heading text-2xl font-normal mb-6">Add New Book</h1>

      <form onSubmit={handleSubmit} className="max-w-xl bg-offwhite border border-line p-6">
        {error && <div className="mb-4 p-3 bg-rose/10 border border-rose/20 text-rose text-sm">{error}</div>}

        {/* Photos + Video grid */}
        <div className="mb-6">
          <label className="block font-heading text-sm mb-1">
            Photos & Video <span className="text-ink-muted font-body text-xs">(up to 9 photos + 1 video - first photo is the cover)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* 9 photo slots */}
            {images.map((slot, i) => (
              <label key={i} className="relative aspect-square border border-dashed border-line flex items-center justify-center cursor-pointer hover:border-sage transition-colors overflow-hidden bg-cream">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(i, e)} />
                {slot.preview ? (
                  <>
                    <Image src={slot.preview} alt="" fill className="object-cover" sizes="120px" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-sage text-white text-[9px] px-1 py-0.5 font-heading">COVER</span>}
                    <button type="button" onClick={e => { e.preventDefault(); removeImage(i) }}
                      className="absolute top-1 right-1 bg-rose text-white w-5 h-5 flex items-center justify-center text-xs">x</button>
                  </>
                ) : (
                  <span className="text-ink-muted text-2xl">+</span>
                )}
              </label>
            ))}

            {/* Video slot (10th) */}
            <label className="relative aspect-square border border-dashed border-sage/40 flex flex-col items-center justify-center cursor-pointer hover:border-sage transition-colors overflow-hidden bg-cream">
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              {videoSlot.preview ? (
                <>
                  <video src={videoSlot.preview} className="absolute inset-0 w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                  <button type="button" onClick={e => { e.preventDefault(); setVideoSlot({ file: null, preview: '' }) }}
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
          <p className="text-xs text-ink-muted mt-1">{filledCount}/9 photos · {videoSlot.file ? '1' : '0'}/1 video</p>
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
          <label className="block font-heading text-sm mb-2">Condition and Price (฿) *</label>
          <p className="text-xs text-ink-muted mb-2">Leave blank if that condition is not available for this book</p>
          <div className="border border-line divide-y divide-line">
            {CONDITIONS.map(cond => (
              <div key={cond} className="flex items-center px-3 py-2.5 bg-cream gap-3">
                <span className="font-heading text-sm w-24 shrink-0">{cond}</span>
                <span className="text-ink-muted text-sm">฿</span>
                <input type="number" min="0" placeholder="Leave blank = unavailable"
                  className="flex-1 bg-transparent font-body text-sm outline-none"
                  value={conditionPrices[cond]}
                  onChange={e => setConditionPrices(prev => ({ ...prev, [cond]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-heading text-sm mb-1">Category</label>
            <select className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.en}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-heading text-sm mb-1">Copies in stock</label>
            <input type="number" min="1"
              className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              value={form.copies} onChange={e => setForm({ ...form, copies: e.target.value })} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Weight (grams)</label>
          <input type="number" min="0" placeholder="e.g. 450 - used for shipping estimates"
            className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
            value={form.weight_grams} onChange={e => setForm({ ...form, weight_grams: e.target.value })} />
        </div>

        <div className="mb-4">
          <label className="block font-heading text-sm mb-1">Description (optional)</label>
          <textarea className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[80px] resize-y"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-sage w-4 h-4" />
            <span className="font-heading text-sm">Featured book (show on homepage)</span>
          </label>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50">
          {saving ? `Uploading ${filledCount} photo${filledCount !== 1 ? 's' : ''}...` : 'Save Book'}
        </button>
      </form>
    </div>
  )
}
