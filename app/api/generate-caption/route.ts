import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a senior creative copywriter for a luxury Indian fashion brand — think the editorial voice of Sabyasachi, the accessibility of Zara, the cool minimalism of H&M premium.

You write Instagram captions and hashtag sets that feel intentional, never generic.

You MUST respond with ONLY a valid JSON object — no markdown, no backticks, no commentary outside the JSON.

Response schema:
{
  "caption": string,
  "hashtags": string
}

Caption rules:
- Luxury fashion tone — evocative, confident, understated
- Short to medium length (1–4 lines max)
- 1–2 emojis maximum, placed naturally — never forced
- No generic phrases: banned phrases include "step into style", "embrace your inner", "make a statement", "slay", "boss babe", "look stunning"
- Reads like a premium brand campaign line — aspirational but not cold
- May reference fabric, occasion, or mood — never lists product specs
- No hashtags inside the caption

Hashtag rules:
- Return as a single space-separated string of 20–25 tags (each starting with #)
- Mix three tiers:
    1. Niche / community tags  → e.g. #sareelovers #kurtilove #ethnicwear
    2. Trending / broad tags   → e.g. #ootd #fashionstyle #reels
    3. Category / search tags  → e.g. #womenswear #indianfashion #designerwear
- No spam tags (#follow4follow, #like4like, #viral)
- No repeated concepts (do not include both #fashion and #fashionista and #fashionblogger unless genuinely distinct)
- Relevance over volume — every tag must relate to the garment or its context`

interface GarmentInput {
  garment_type?: string
  color?: string
  fabric?: string
  style?: string
}

interface CaptionResult {
  caption: string
  hashtags: string
}

function parseJsonResponse(raw: string): CaptionResult {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  if (typeof parsed.caption !== 'string' || !parsed.caption.trim()) {
    throw new Error('Missing or empty "caption" field')
  }
  if (typeof parsed.hashtags !== 'string' || !parsed.hashtags.trim()) {
    throw new Error('Missing or empty "hashtags" field')
  }

  return {
    caption: parsed.caption.trim(),
    hashtags: parsed.hashtags.trim(),
  }
}

function buildUserMessage(garment: GarmentInput, prompt: string): string {
  const attrs = [
    garment.garment_type && `Garment type: ${garment.garment_type}`,
    garment.color        && `Color: ${garment.color}`,
    garment.fabric       && `Fabric: ${garment.fabric}`,
    garment.style        && `Style/occasion: ${garment.style}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `${attrs}\n\nAdditional context: ${prompt}\n\nWrite the Instagram caption and hashtag set.`
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[/api/generate-caption] OPENAI_API_KEY is not set')
    return NextResponse.json(
      { error: 'Server misconfiguration: missing OpenAI API key' },
      { status: 500 }
    )
  }

  let garment: GarmentInput
  let prompt: string

  try {
    const body = await request.json()
    garment = body?.garment ?? {}
    prompt  = body?.prompt
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: '"prompt" is required' }, { status: 400 })
  }
  if (!garment || typeof garment !== 'object') {
    return NextResponse.json({ error: '"garment" must be an object' }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      temperature: 0.75,         // creative but not unpredictable
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserMessage(garment, prompt) },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from OpenAI')

    const result = parseJsonResponse(raw)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate-caption] Error:', message)

    if (message.includes('Missing') || message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Failed to parse structured response from model', detail: message },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'Caption generation failed', detail: message },
      { status: 500 }
    )
  }
}
