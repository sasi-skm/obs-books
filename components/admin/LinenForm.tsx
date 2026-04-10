'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Book, TextileMaterial, TextileTechnique, TextileConditionGrade } from '@/types'
import { adminFetch } from '@/lib/admin-fetch'
import { supabase } from '@/lib/supabase'

const LINEN_CATEGORY = 'embroidery-fabric'

const MATERIALS: TextileMaterial[] = [
  'Linen', 'Cotton', 'Linen blend', 'Cotton blend', 'Silk', 'Other',
]

const TECHNIQUES: TextileTechnique[] = [
  'Hand embroidery',
  'Cross-stitch',
  'Crewel work',
  'Cutwork / Richelieu',
  'Drawn thread work',
  'Machine embroidery',
  'Mixed techniques',
]

const CONDITION_GRADES: TextileConditionGrade[] = [
  'Like New', 'Very Good', 'Good', 'Well Loved',
]

const QUICK_FILL_NOTES: { label: string; en: string; th: string }[] = [
  {
    label: 'Like New',
    en: 'Excellent condition. Appears unused with no stains, holes, or repairs. Colors remain vibrant and fabric is crisp.',
    th: 'สภาพดีเยี่ยม ดูเหมือนไม่เคยใช้งาน ไม่มีรอยเปื้อน รู หรือการซ่อมแซม สียังคงสดใสและเนื้อผ้าเรียบกรอบ',
  },
  {
    label: 'Very Good',
    en: 'Very good condition with light signs of age. Minor fading consistent with vintage piece. May have gentle storage fold lines. No stains, holes, or repairs.',
    th: 'สภาพดีมาก มีร่องรอยตามอายุเล็กน้อย สีซีดจางเล็กน้อยตามธรรมชาติของของวินเทจ อาจมีรอยพับจากการเก็บรักษา ไม่มีรอยเปื้อน รู หรือการซ่อมแซม',
  },
  {
    label: 'Good',
    en: 'Good vintage condition. [Describe flaw] as shown in photos. Does not detract from overall beauty.',
    th: 'สภาพวินเทจดี [อธิบายตำหนิ] ตามที่แสดงในรูปภาพ ไม่ลดทอนความงามโดยรวม',
  },
  {
    label: 'Well Loved',
    en: 'Well loved with visible wear. [Describe flaws]. Ideal for crafting, framing, or display. Priced to reflect condition.',
    th: 'ผ่านการใช้งานและทะนุถนอม มีร่องรอยการใช้งานชัดเจน [อธิบายตำหนิ] เหมาะสำหรับงานคราฟต์ ใส่กรอบ หรือตกแต่ง ราคาสะท้อนสภาพสินค้า',
  },
  {
    label: 'Has fold lines',
    en: 'Some original fold lines from storage. Will relax with gentle steaming or washing.',
    th: 'มีรอยพับจากการเก็บรักษา สามารถคลายออกได้ด้วยการรีดด้วยไอน้ำหรือซักเบาๆ',
  },
]

type ImageSlot = { file: File | null; preview: string; existing: string }

export default function LinenForm({ linen }: { linen?: Book | null }) {
  const router = useRouter()
  const isEdit = !!linen
  const linenId = linen?.id

  const [title, setTitle] = useState(linen?.title || '')
  const [width, setWidth] = useState(linen?.dimensions_width ? String(linen.dimensions_width) : '')
  const [length, setLength] = useState(linen?.dimensions_length ? String(linen.dimensions_length) : '')
  const [material, setMaterial] = useState<string>(linen?.material || '')
  const [technique, setTechnique] = useState<string>(linen?.technique || '')
  const [era, setEra] = useState(linen?.era || '')
  const [price, setPrice] = useState(linen?.price ? String(linen.price) : '')
  const [conditionGrade, setConditionGrade] = useState<string>(linen?.condition || 'Very Good')
  const [conditionNoteEn, setConditionNoteEn] = useState(linen?.condition_note || '')
  const [conditionNoteTh, setConditionNoteTh] = useState(linen?.condition_note_th || '')
  const [conditionTab, setConditionTab] = useState<'en' | 'th'>('en')
  const [descriptionEn, setDescriptionEn] = useState(linen?.description_en || linen?.description || '')
  const [descriptionTh, setDescriptionTh] = useState(linen?.description_th || '')

  const [images, setImages] = useState<ImageSlot[]>(
    Array(9).fill(null).map(() => ({ file: null, preview: '', existing: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [dragOverGrid, setDragOverGrid] = useState(false)
  const dragCounterRef = useRef(0)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [eraReasoning, setEraReasoning] = useState('')

  // Hydrate existing images on edit
  useEffect(() => {
    if (!linen) return
    const slots: ImageSlot[] = Array(9).fill(null).map(() => ({ file: null, preview: '', existing: '' }))
    const imgArray = linen.images && linen.images.length > 0 ? linen.images : linen.image_url ? [linen.image_url] : []
    imgArray.forEach((url, i) => {
      if (i < 9) slots[i] = { file: null, preview: url, existing: url }
    })
    setImages(slots)
  }, [linen])

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file).then(preview => {
      setImages(prev => {
        const next = [...prev]
        next[index] = { file, preview, existing: next[index].existing }
        return next
      })
    })
  }

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
    const loaded = await Promise.all(
      files.map(async f => ({ file: f, preview: await readFileAsDataUrl(f) }))
    )
    setImages(prev => {
      const next = [...prev]
      let li = 0
      for (let i = 0; i < next.length && li < loaded.length; i++) {
        if (!next[i].preview) next[i] = { file: loaded[li].file, preview: loaded[li++].preview, existing: '' }
      }
      return next
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev]
      next[index] = { file: null, preview: '', existing: '' }
      return next
    })
  }

  const resizeImage = (file: File, maxPx: number, quality: number): Promise<File> =>
    new Promise(resolve => {
      const img = document.createElement('img') as HTMLImageElement
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxPx || h > maxPx) {
          if (w > h) {
            h = Math.round((h * maxPx) / w)
            w = maxPx
          } else {
            w = Math.round((w * maxPx) / h)
            h = maxPx
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
          'image/jpeg',
          quality,
        )
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })

  const applyQuickFill = (en: string, th: string) => {
    setConditionNoteEn(prev => (prev ? prev.trimEnd() + '\n' + en : en))
    setConditionNoteTh(prev => (prev ? prev.trimEnd() + '\n' + th : th))
  }

  const resizeImageForAI = (dataUrl: string): Promise<string> =>
    new Promise(resolve => {
      const img = document.createElement('img') as HTMLImageElement
      img.onload = () => {
        const MAX = 800
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w)
            w = MAX
          } else {
            w = Math.round((w * MAX) / h)
            h = MAX
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })

  const slotAsDataUrl = async (slot: ImageSlot): Promise<string | null> => {
    // Prefer an in-memory data URL from a newly-selected file
    if (slot.preview && slot.preview.startsWith('data:')) {
      return resizeImageForAI(slot.preview)
    }
    // Otherwise try to fetch an existing remote URL and convert
    const url = slot.existing || slot.preview
    if (!url || url.startsWith('data:')) return null
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const dataUrl: string = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target?.result as string)
        reader.readAsDataURL(blob)
      })
      return resizeImageForAI(dataUrl)
    } catch {
      return null
    }
  }

  const handleGenerate = async () => {
    const hasPhoto = images.some(s => s.preview)
    if (!hasPhoto) {
      setAiError('Upload at least one photo first')
      return
    }
    setAiLoading(true)
    setAiError('')
    setEraReasoning('')
    try {
      const cover = images.find(s => s.preview)
      const coverDataUrl = cover ? await slotAsDataUrl(cover) : null

      // Send up to 3 additional photos for better context
      const extras: string[] = []
      for (const slot of images) {
        if (slot === cover || !slot.preview) continue
        const d = await slotAsDataUrl(slot)
        if (d) extras.push(d)
        if (extras.length >= 3) break
      }

      const res = await adminFetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'textile',
          title,
          material,
          technique,
          imageDataUrl: coverDataUrl,
          extraImageDataUrls: extras,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError(data.error)
        return
      }
      // Only populate empty fields for title/material/technique so we don't
      // overwrite what the user already typed. Descriptions and condition
      // notes always overwrite since they come as a pair.
      if (data.title && !title) setTitle(data.title)
      if (data.material && !material) setMaterial(data.material)
      if (data.technique && !technique) setTechnique(data.technique)
      if (data.description_en) setDescriptionEn(data.description_en)
      if (data.description_th) setDescriptionTh(data.description_th)
      if (data.condition_note_en) setConditionNoteEn(data.condition_note_en)
      if (data.condition_note_th) setConditionNoteTh(data.condition_note_th)
      if (data.era) setEra(data.era)
      if (data.era_reasoning) setEraReasoning(data.era_reasoning)
    } catch (err: unknown) {
      setAiError('Request failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setAiLoading(false)
    }
  }

  const validate = (requireImages: boolean): string | null => {
    if (!title.trim()) return 'Title is required'
    const w = parseInt(width)
    const l = parseInt(length)
    if (!w || !l) return 'Dimensions are required'
    if (w < 50 || w > 300 || l < 50 || l > 300) return 'Dimensions must be between 50 and 300 cm'
    const p = parseInt(price)
    if (!p || p < 490) return 'Price must be at least ฿490'
    if (!conditionGrade) return 'Condition grade is required'
    if (requireImages) {
      const hasImage = images.some(s => s.preview)
      if (!hasImage) return 'Add at least one photo'
    }
    return null
  }

  const handleSave = async (publish: boolean) => {
    const requireImages = publish
    const err = validate(requireImages)
    if (err) {
      setError(err)
      return
    }

    setSaving(true)
    setError('')

    try {
      const isSupabase =
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

      const finalUrls: string[] = []

      if (isSupabase) {
        const activeSlots = images.filter(s => s.preview)
        for (const slot of activeSlots) {
          if (!slot.file) {
            // Existing image — keep its URL
            const existingUrl = slot.existing || slot.preview
            if (existingUrl) finalUrls.push(existingUrl)
          } else {
            try {
              const resized = await resizeImage(slot.file, 1600, 0.9)
              const fd = new FormData()
              fd.append('file', resized)
              if (linenId) fd.append('bookId', linenId)
              const res = await adminFetch('/api/admin/upload-image', { method: 'POST', body: fd })
              if (res.ok) {
                const { url } = await res.json()
                if (url) finalUrls.push(url)
                else if (slot.existing) finalUrls.push(slot.existing)
              } else if (slot.existing) {
                finalUrls.push(slot.existing)
              }
            } catch {
              if (slot.existing) finalUrls.push(slot.existing)
            }
          }
        }
      }

      const imageUrl = finalUrls[0] || linen?.image_url || '/images/hero-botanical.jpeg'
      const status = publish ? 'available' : 'draft'

      const payload = {
        title: title.trim(),
        author: '',
        price: parseInt(price),
        category: LINEN_CATEGORY,
        product_type: 'textile' as const,
        condition: conditionGrade,
        condition_note: conditionNoteEn || null,
        condition_note_th: conditionNoteTh || null,
        copies: 1,
        status,
        dimensions_width: parseInt(width),
        dimensions_length: parseInt(length),
        material: material || null,
        technique: technique || null,
        era: era || null,
        description: descriptionEn || null,
        description_en: descriptionEn || null,
        description_th: descriptionTh || null,
        image_url: imageUrl,
        images: finalUrls,
        featured: false,
      }

      if (isSupabase) {
        if (isEdit && linenId) {
          const { error: updateError } = await supabase
            .from('books')
            .update(payload)
            .eq('id', linenId)
          if (updateError) {
            setError(humanizeDbError(updateError.message, updateError.code))
            setSaving(false)
            return
          }
        } else {
          const { error: insertError } = await supabase.from('books').insert(payload)
          if (insertError) {
            setError(humanizeDbError(insertError.message, insertError.code))
            setSaving(false)
            return
          }
        }
      }

      await adminFetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: [LINEN_CATEGORY] }),
      })

      router.push('/admin/linens')
    } catch (err: unknown) {
      setError('Failed to save: ' + (err instanceof Error ? err.message : String(err)))
      setSaving(false)
    }
  }

  const filledCount = images.filter(s => s.preview).length

  return (
    <div>
      <Link href="/admin/linens" className="font-heading text-sm text-ink-muted hover:text-sage mb-4 inline-block">
        - Back to Linens
      </Link>
      <h1 className="font-heading text-2xl font-normal mb-6">{isEdit ? 'Edit Linen' : 'Add New Linen'}</h1>

      <form
        onSubmit={e => {
          e.preventDefault()
          handleSave(true)
        }}
        className="bg-offwhite border border-line p-6 max-w-5xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-rose/10 border border-rose/20 text-rose text-sm">{error}</div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Floral Corner Embroidered Tablecloth"
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Dimensions *</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min={50}
                    max={300}
                    value={width}
                    onChange={e => setWidth(e.target.value)}
                    placeholder="Width"
                    className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">Width (cm)</p>
                </div>
                <span className="font-heading text-ink-muted text-lg">×</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min={50}
                    max={300}
                    value={length}
                    onChange={e => setLength(e.target.value)}
                    placeholder="Length"
                    className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">Length (cm)</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Material</label>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              >
                <option value="">Select material...</option>
                {MATERIALS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Technique</label>
              <select
                value={technique}
                onChange={e => setTechnique(e.target.value)}
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
              >
                <option value="">Select technique...</option>
                {TECHNIQUES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Era</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={era}
                  onChange={e => setEra(e.target.value)}
                  placeholder="e.g., 1960s-1970s"
                  className="flex-1 px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="px-3 py-2 border border-sage text-sage font-heading text-xs whitespace-nowrap hover:bg-sage/10 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? 'Analyzing...' : '✨ AI estimate'}
                </button>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Based on photos - you can edit or leave blank
              </p>
              {eraReasoning && (
                <p className="text-[11px] text-sage mt-1 italic">AI detected: {eraReasoning}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Price (THB) *</label>
              <div className="flex items-center border border-line bg-cream focus-within:border-sage">
                <span className="pl-3 pr-1 text-ink-muted">฿</span>
                <input
                  type="number"
                  min={490}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="490"
                  className="flex-1 px-2 py-3 bg-transparent font-body text-sm outline-none"
                  required
                />
              </div>
              <p className="text-[11px] text-ink-muted mt-1">Minimum ฿490</p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">
                Photos * <span className="text-ink-muted font-body text-xs">(first photo is the cover)</span>
              </label>
              <div
                className={`grid grid-cols-3 gap-2 rounded transition-colors ${
                  dragOverGrid ? 'ring-2 ring-sage/40 bg-sage/5' : ''
                }`}
                onDragEnter={() => {
                  dragCounterRef.current++
                  setDragOverGrid(true)
                }}
                onDragLeave={() => {
                  dragCounterRef.current--
                  if (dragCounterRef.current === 0) setDragOverGrid(false)
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={handleGridDrop}
              >
                {images.map((slot, i) => (
                  <label
                    key={i}
                    className={`relative aspect-square border border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-cream
                      ${dragOverSlot === i ? 'border-sage bg-sage/10 scale-[1.02]' : 'border-line hover:border-sage'}`}
                    onDragOver={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOverSlot(i)
                    }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={e => handleSlotDrop(i, e)}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageChange(i, e)}
                    />
                    {slot.preview ? (
                      <>
                        <Image src={slot.preview} alt="" fill className="object-cover" sizes="120px" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-sage text-white text-[9px] px-1 py-0.5 font-heading">
                            COVER
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault()
                            removeImage(i)
                          }}
                          className="absolute top-1 right-1 bg-rose text-white w-5 h-5 flex items-center justify-center text-xs"
                        >
                          x
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-ink-muted text-2xl">{dragOverSlot === i ? '📷' : '+'}</span>
                        {dragOverSlot === i && (
                          <span className="text-[9px] text-sage font-heading">Drop here</span>
                        )}
                      </div>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-ink-muted mt-1">
                {filledCount}/9 photos - drag &amp; drop or click to upload
              </p>
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Condition *</label>
              <select
                value={conditionGrade}
                onChange={e => setConditionGrade(e.target.value)}
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage mb-2"
              >
                {CONDITION_GRADES.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* EN / TH tabs for condition note */}
              <div className="flex border-b border-line">
                <button
                  type="button"
                  onClick={() => setConditionTab('en')}
                  className={'px-3 py-1.5 font-heading text-xs border-b-2 ' +
                    (conditionTab === 'en' ? 'border-sage text-sage' : 'border-transparent text-ink-muted hover:text-ink')}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setConditionTab('th')}
                  className={'px-3 py-1.5 font-heading text-xs border-b-2 ' +
                    (conditionTab === 'th' ? 'border-sage text-sage' : 'border-transparent text-ink-muted hover:text-ink')}
                >
                  Thai
                </button>
              </div>
              {conditionTab === 'en' ? (
                <textarea
                  value={conditionNoteEn}
                  onChange={e => setConditionNoteEn(e.target.value)}
                  placeholder="Describe the condition in detail..."
                  className="w-full px-3 py-3 border border-line border-t-0 bg-cream font-body text-sm outline-none focus:border-sage min-h-[80px] resize-y"
                />
              ) : (
                <textarea
                  value={conditionNoteTh}
                  onChange={e => setConditionNoteTh(e.target.value)}
                  placeholder="อธิบายสภาพสินค้าโดยละเอียด..."
                  className="w-full px-3 py-3 border border-line border-t-0 bg-cream font-body text-sm outline-none focus:border-sage min-h-[80px] resize-y"
                />
              )}

              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-ink-muted font-heading self-center mr-1">Quick fill (EN + TH):</span>
                {QUICK_FILL_NOTES.map(qf => (
                  <button
                    key={qf.label}
                    type="button"
                    onClick={() => applyQuickFill(qf.en, qf.th)}
                    className="text-[11px] px-2 py-1 border border-sage/40 text-sage font-heading hover:bg-sage/10 transition-colors"
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 p-3 bg-sage/5 border border-sage/20 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-sm text-ink">AI Generate Description</p>
                  <p className="font-body text-xs text-ink-muted mt-0.5">
                    Uses photos to write EN + TH descriptions and estimate the era.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sage text-offwhite font-heading text-xs hover:bg-sage-light transition-colors disabled:opacity-50 rounded shrink-0 ml-3"
                >
                  {aiLoading ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border border-offwhite border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <><span>✨</span> Generate</>
                  )}
                </button>
              </div>
              {aiError && <p className="text-xs text-rose mt-2">{aiError}</p>}
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Description (English)</label>
              <textarea
                value={descriptionEn}
                onChange={e => setDescriptionEn(e.target.value)}
                placeholder="Describe this piece..."
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[100px] resize-y"
              />
            </div>

            <div className="mb-4">
              <label className="block font-heading text-sm mb-1">Description (Thai)</label>
              <textarea
                value={descriptionTh}
                onChange={e => setDescriptionTh(e.target.value)}
                placeholder="รายละเอียดสินค้า..."
                className="w-full px-3 py-3 border border-line bg-cream font-body text-sm outline-none focus:border-sage min-h-[100px] resize-y"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-line">
          <Link
            href="/admin/linens"
            className="px-4 py-2.5 border border-line text-ink font-heading text-sm hover:bg-parchment transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-4 py-2.5 border border-bark text-bark font-heading text-sm hover:bg-bark/10 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as draft'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Publishing...' : isEdit ? 'Save changes' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}

function humanizeDbError(message: string, code?: string): string {
  if (code === '42703' || message.includes('column')) {
    return 'Database needs updating. Run migration 003_add_condition_note.sql in Supabase SQL Editor.'
  }
  return 'Failed to save: ' + message
}
