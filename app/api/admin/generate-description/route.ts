import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/admin-auth'

const CATEGORY_IDS = ['wildflowers', 'garden-roses', 'trees-plants', 'butterflies', 'wildlife-birds-animals', 'cookbooks', 'country-life', 'fairytale', 'art-illustration', 'rare-items', 'embroidery-fabric', 'sale']
const COVER_TYPES = ['Hardcover', 'Softcover', 'Paperback', 'Spiral-bound', 'Other']

export const runtime = 'nodejs'

async function callClaude(client: Anthropic, systemPrompt: string, userContent: Anthropic.MessageParam['content']) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }]
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages: [{ role: 'user', content: userContent }],
  })

  // Collect all text from text blocks
  const textParts: string[] = []
  for (const block of response.content) {
    if (block.type === 'text' && block.text.trim()) {
      textParts.push(block.text.trim())
    }
  }

  // If we got text, return the last text block (most likely contains the JSON)
  if (textParts.length > 0) {
    return textParts[textParts.length - 1]
  }

  // If stop_reason is end_turn but no text, the model may have only searched
  // In that case, send a follow-up message asking for the JSON
  if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
    const followUp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent },
        { role: 'assistant', content: response.content },
        { role: 'user', content: [{ type: 'text', text: 'Now return ONLY the JSON object with the book details. No other text.' }] },
      ],
    })
    const followUpText = followUp.content.filter(b => b.type === 'text')
    if (followUpText.length > 0 && followUpText[followUpText.length - 1].type === 'text') {
      return (followUpText[followUpText.length - 1] as Anthropic.TextBlock).text.trim()
    }
  }

  return ''
}

function extractJson(raw: string) {
  // Strip markdown fences
  const s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  // Try direct parse first
  try { return JSON.parse(s) } catch {}
  // Try to find a JSON object anywhere in the text
  const match = s.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }
  return null
}

async function prepareImageBlock(imageDataUrl: unknown): Promise<Anthropic.ImageBlockParam | null> {
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:')) return null
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  try {
    const imgBuffer = Buffer.from(match[2], 'base64')
    const resized = await sharp(imgBuffer)
      .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    return {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: resized.toString('base64') },
    }
  } catch {
    return null
  }
}

async function generateTextile(
  client: Anthropic,
  body: { title?: string; material?: string; technique?: string; imageDataUrl?: string; extraImageDataUrls?: string[] },
) {
  const systemPrompt = `You are writing product listings for OBS Books, a Bangkok-based vintage shop specialising in illustrated books and vintage textiles. The brand voice is warm, knowledgeable, and appreciative of craftsmanship and history.

You are describing a vintage embroidered textile (tablecloth, runner, napkin, doily, etc). Based on the photos and any known info, produce a complete product listing.

Return ONLY a JSON object, no other text, no markdown fences:
{
  "title": string (short, evocative English product title, 3-7 words, e.g. "Floral Corner Embroidered Tablecloth" or "Blue Kalocsa Folk Runner". Describe the dominant motif and form),
  "material": one of ["Linen", "Cotton", "Linen blend", "Cotton blend", "Silk", "Other"] (best guess from the photo - texture, weave, sheen),
  "technique": one of ["Hand embroidery", "Cross-stitch", "Crewel work", "Cutwork / Richelieu", "Drawn thread work", "Machine embroidery", "Mixed techniques"] (best guess - look at stitches, regularity, texture),
  "description_en": string (2-3 short paragraphs, 60-120 words total. First paragraph: visual appearance - colours, motifs, embroidery style, overall aesthetic. Second paragraph: how it could be used or displayed, evoke the feeling or era. Warm and appreciative tone, not salesy),
  "description_th": string (same content as English, naturally translated into Thai - not literal. Use appropriate Thai terms for embroidery and textiles),
  "condition_note_en": string (1-2 sentences of honest condition observations YOU CAN SEE IN THE PHOTOS - stains, fold lines, fading, repairs, fabric crispness. Do NOT invent flaws that are not visible. If the piece looks pristine in the photos, say so),
  "condition_note_th": string (natural Thai translation of condition_note_en),
  "era": string | null (decade range like "1960s-1970s" OR broader period like "Mid-20th century". If genuinely uncertain, return null - do not guess),
  "era_reasoning": string (one short sentence explaining the era estimate, or why it's null)
}

Era-dating hints: Kalocsa/Hungarian folk motifs = 1950s-70s; Art Deco geometric = 1920s-40s; bright saturated synthetic-dye colours = 1960s-70s; hand-rolled hems often pre-1960s; crewel wool work often 1940s-60s.`

  const imageBlock = await prepareImageBlock(body.imageDataUrl)
  const extraImages: Anthropic.ImageBlockParam[] = []
  if (Array.isArray(body.extraImageDataUrls)) {
    for (const url of body.extraImageDataUrls.slice(0, 3)) {
      const blk = await prepareImageBlock(url)
      if (blk) extraImages.push(blk)
    }
  }

  const knownFields = [
    body.title ? `Title / working name: ${body.title}` : '',
    body.material ? `Material: ${body.material}` : '',
    body.technique ? `Technique: ${body.technique}` : '',
  ].filter(Boolean).join('\n')

  const content: Anthropic.MessageParam['content'] = []
  if (imageBlock) content.push(imageBlock)
  for (const img of extraImages) content.push(img)
  content.push({
    type: 'text',
    text: (imageBlock || extraImages.length)
      ? `Describe this vintage textile based on the photo(s).${knownFields ? `\n\nKnown info:\n${knownFields}` : ''}\n\nReturn JSON only.`
      : `Describe a vintage textile with this info:\n${knownFields || '(no details)'}\n\nReturn JSON only.`,
  })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  })

  const textParts: string[] = []
  for (const block of response.content) {
    if (block.type === 'text' && block.text.trim()) textParts.push(block.text.trim())
  }
  const raw = textParts[textParts.length - 1] || ''
  const parsed = extractJson(raw)
  if (!parsed || !parsed.description_en) {
    throw new Error('Could not parse textile description from response')
  }

  const MATERIALS = ['Linen', 'Cotton', 'Linen blend', 'Cotton blend', 'Silk', 'Other']
  const TECHNIQUES = [
    'Hand embroidery', 'Cross-stitch', 'Crewel work',
    'Cutwork / Richelieu', 'Drawn thread work', 'Machine embroidery', 'Mixed techniques',
  ]

  return {
    title: parsed.title ? String(parsed.title) : null,
    material: MATERIALS.includes(parsed.material) ? parsed.material : null,
    technique: TECHNIQUES.includes(parsed.technique) ? parsed.technique : null,
    description_en: String(parsed.description_en),
    description_th: parsed.description_th ? String(parsed.description_th) : '',
    condition_note_en: parsed.condition_note_en ? String(parsed.condition_note_en) : '',
    condition_note_th: parsed.condition_note_th ? String(parsed.condition_note_th) : '',
    era: parsed.era ? String(parsed.era) : null,
    era_reasoning: parsed.era_reasoning ? String(parsed.era_reasoning) : null,
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, author, publisher, year_published, pages, cover_type, language, category, imageDataUrl, productType } = body

    // Accept either the correct spelling or the historical typo in Vercel env ("ANTROPIC")
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    const client = new Anthropic({ apiKey })

    // Textile branch - returns { description_en, description_th, era, era_reasoning }
    if (productType === 'textile') {
      const result = await generateTextile(client, {
        title,
        material: body.material,
        technique: body.technique,
        imageDataUrl,
        extraImageDataUrls: body.extraImageDataUrls,
      })
      return NextResponse.json(result)
    }

    // Parse and resize image if provided - resize to max 1024px to keep token count manageable
    const imageBlock = await prepareImageBlock(imageDataUrl)

    const knownFields = [
      title ? `Title: ${title}` : '',
      author ? `Author: ${author}` : '',
      publisher ? `Publisher: ${publisher}` : '',
      year_published ? `Year published: ${year_published}` : '',
      pages ? `Pages: ${pages}` : '',
      cover_type ? `Cover type: ${cover_type}` : '',
      language ? `Language: ${language}` : '',
      category ? `Category hint: ${category}` : '',
    ].filter(Boolean).join('\n')

    const systemPrompt = `You are a book research assistant for OBS Books, a used bookstore in Bangkok specialising in vintage illustrated books about flowers, nature, cookbooks, and fairy tales.

Use web_search to find accurate details. Return ONLY a JSON object, no other text:
{
  "title": string,
  "author": string | null,
  "publisher": string | null,
  "year_published": number | null,
  "pages": number | null,
  "cover_type": "Hardcover" | "Softcover" | "Paperback" | "Spiral-bound" | "Other" | null,
  "language": string | null,
  "category": one of [${CATEGORY_IDS.map(c => `"${c}"`).join(', ')}],
  "en": string (evocative English description, 40-70 words, warm tone),
  "th": string (natural Thai translation)
}
Categories: wildflowers/garden-flowers/trees-ferns/orchids/fruits-vegetables/birds-insects=botanical; cookbooks=food; nature-science=animals/science; fairy-tales=children/fantasy; art-culture=art/history; other=anything else.`

    const buildContent = (withImage: boolean): Anthropic.MessageParam['content'] => {
      const content: Anthropic.MessageParam['content'] = []
      if (withImage && imageBlock) content.push(imageBlock)
      content.push({
        type: 'text',
        text: withImage && imageBlock
          ? `Identify this book from the cover image.${knownFields ? ` Known info:\n${knownFields}` : ''}\nSearch for details and return JSON only.`
          : `Find info about this book:\n${knownFields || '(no details - make a general description)'}\nReturn JSON only.`,
      })
      return content
    }

    // Try with image first, fall back to text-only if it fails
    let raw = ''
    let parsed = null

    if (imageBlock) {
      try {
        raw = await callClaude(client, systemPrompt, buildContent(true))
        parsed = extractJson(raw)
      } catch {
        // fall through to text-only
      }
    }

    // Fallback: try without image
    if (!parsed) {
      raw = await callClaude(client, systemPrompt, buildContent(false))
      parsed = extractJson(raw)
    }

    if (!parsed || !parsed.en) throw new Error('Could not parse book details from response')

    return NextResponse.json({
      title: parsed.title || null,
      author: parsed.author || null,
      publisher: parsed.publisher || null,
      year_published: parsed.year_published ? String(parsed.year_published) : null,
      pages: parsed.pages ? String(parsed.pages) : null,
      cover_type: COVER_TYPES.includes(parsed.cover_type) ? parsed.cover_type : null,
      language: parsed.language || null,
      category: CATEGORY_IDS.includes(parsed.category) ? parsed.category : null,
      en: parsed.en,
      th: parsed.th || '',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Failed to generate: ' + message }, { status: 500 })
  }
}
