import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a professional fashion analyst and luxury brand creative director.

Given a garment image, you will:
1. Extract structured fashion attributes from the garment
2. Write a cinematic image generation prompt for a high-fashion editorial shoot

You MUST respond with ONLY a valid JSON object — no markdown, no backticks, no explanation outside the JSON.

Response schema:
{
  "garment": {
    "garment_type": string,  // e.g. saree, kurti, lehenga, dress, co-ord set, top, etc.
    "color": string,         // primary color(s), e.g. "ivory white", "deep burgundy"
    "fabric": string,        // e.g. silk, cotton, chiffon, georgette, velvet, linen
    "pattern": string,       // e.g. solid, printed, embroidered, bandhani, block print, geometric
    "style": string,         // e.g. casual, festive, wedding, indo-western, bohemian, minimalist
    "fit": string            // e.g. loose, fitted, flowy, structured, relaxed
  },
  "prompt": string           // cinematic image generation prompt (see requirements below)
}

Cinematic prompt requirements:
- High fashion editorial photography, shot by a luxury brand
- Realistic studio or natural outdoor lighting (golden hour, diffused softbox, etc.)
- Specific camera details: 85mm lens, f/1.8 aperture, shallow depth of field
- Professional female model wearing the garment naturally
- Background: clean seamless studio, or an aesthetic complementary location (palace courtyard, rooftop, minimalist interior)
- Mood and atmosphere that matches the garment's style
- Photorealistic, not illustrated or AI-looking
- Ultra-detailed fabric texture visible
- End the prompt with: "shot on Sony A7R V, 85mm, f/1.8, natural light, ultra-detailed, 8K"
`

interface GarmentAttributes {
  garment_type: string
  color: string
  fabric: string
  pattern: string
  style: string
  fit: string
}

interface AnalysisResult {
  garment: GarmentAttributes
  prompt: string
}

function parseJsonResponse(raw: string): AnalysisResult {
  // Strip markdown code fences if the model wraps the output anyway
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  const { garment, prompt } = parsed

  if (!garment || typeof garment !== 'object') throw new Error('Missing "garment" field')
  if (typeof prompt !== 'string' || !prompt) throw new Error('Missing "prompt" field')

  const requiredFields: (keyof GarmentAttributes)[] = [
    'garment_type', 'color', 'fabric', 'pattern', 'style', 'fit',
  ]
  for (const field of requiredFields) {
    if (typeof garment[field] !== 'string') {
      throw new Error(`Missing or invalid garment field: "${field}"`)
    }
  }

  return { garment, prompt }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[/api/analyze-garment] OPENAI_API_KEY is not set')
    return NextResponse.json(
      { error: 'Server misconfiguration: missing OpenAI API key' },
      { status: 500 }
    )
  }

  let imageUrl: string
  try {
    const body = await request.json()
    imageUrl = body?.imageUrl
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: '"imageUrl" is required and must be a string' }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Analyze this garment and return the JSON response as specified.',
            },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from OpenAI')

    const result = parseJsonResponse(raw)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/analyze-garment] Error:', message)

    // Surface JSON parse failures separately so they're easier to debug
    if (message.includes('JSON') || message.includes('Missing')) {
      return NextResponse.json(
        { error: 'Failed to parse structured response from model', detail: message },
        { status: 502 }
      )
    }

    return NextResponse.json({ error: 'Garment analysis failed', detail: message }, { status: 500 })
  }
}
