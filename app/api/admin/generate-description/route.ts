import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

const CATEGORY_IDS = ['wildflowers', 'garden-roses', 'trees-plants', 'butterflies', 'wildlife-birds-animals', 'cookbooks', 'country-life', 'fairytale', 'art-illustration', 'rare-items', 'embroidery-fabric', 'sale']
const COVER_TYPES = ['Hardcover', 'Softcover', 'Paperback', 'Spiral-bound', 'Other']

export const runtime = 'nodejs'

async function callClaude(client: Anthropic, systemPrompt: string, userContent: Anthropic.MessageParam['content']) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }]
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: [{ role: 'user', content: userContent }],
  })
  const textBlocks = response.content.filter(b => b.type === 'text')
  return textBlocks[textBlocks.length - 1]?.type === 'text'
    ? (textBlocks[textBlocks.length - 1] as Anthropic.TextBlock).text.trim()
    : ''
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

export async function POST(req: NextRequest) {
  try {
    const { title, author, publisher, year_published, pages, cover_type, language, category, imageDataUrl } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    const client = new Anthropic({ apiKey })

    // Parse and resize image if provided - resize to max 1024px to keep token count manageable
    let imageBlock: Anthropic.ImageBlockParam | null = null
    if (imageDataUrl && imageDataUrl.startsWith('data:')) {
      const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        try {
          const imgBuffer = Buffer.from(match[2], 'base64')
          const resized = await sharp(imgBuffer)
            .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer()
          imageBlock = {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: resized.toString('base64') },
          }
        } catch {
          // If image processing fails, proceed without image
        }
      }
    }

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
