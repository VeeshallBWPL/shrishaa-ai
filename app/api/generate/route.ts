import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─── helpers ────────────────────────────────────────────────────────────────

function baseUrl(): string {
  // In production (Vercel) VERCEL_URL is set automatically.
  // Locally, fall back to localhost.
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  return host
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function callInternal<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${baseUrl()}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error ?? `${path} returned ${res.status}`)
  }
  return json as T
}

// ─── types ───────────────────────────────────────────────────────────────────

interface DriveImage { id: string; name: string; url: string }

interface FetchDriveResult {
  garments: DriveImage[]
  models: DriveImage[]
}

interface GarmentAttributes {
  garment_type: string
  color: string
  fabric: string
  pattern: string
  style: string
  fit: string
}

interface AnalyzeResult {
  garment: GarmentAttributes
  prompt: string
}

interface GenerateImageResult { imageUrl: string }
interface GenerateCaptionResult { caption: string; hashtags: string }

// ─── pipeline ────────────────────────────────────────────────────────────────

export async function POST() {
  const log = (step: string, msg: string) =>
    console.log(`[/api/generate] [${step}] ${msg}`)

  // ── Step 1: Fetch images from Google Drive ────────────────────────────────
  log('1/5', 'Fetching images from Google Drive...')
  let garmentImage: DriveImage
  let modelImage: DriveImage

  try {
    const { garments, models } = await fetch(`${baseUrl()}/api/fetch-drive-images`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? `fetch-drive-images returned ${res.status}`)
        return json as FetchDriveResult
      })

    if (!garments.length) throw new Error('No garment images found in RAW folder')
    if (!models.length)   throw new Error('No model images found in MODEL folder')

    garmentImage = randomItem(garments)
    modelImage   = randomItem(models)

    log('1/5', `Garment: "${garmentImage.name}" | Model: "${modelImage.name}"`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate] Step 1 failed:', message)
    return NextResponse.json({ error: 'Failed to fetch images from Drive', detail: message }, { status: 502 })
  }

  // ── Step 2: Analyze garment ───────────────────────────────────────────────
  log('2/5', 'Analyzing garment with GPT-4o Vision...')
  let analysis: AnalyzeResult

  try {
    analysis = await callInternal<AnalyzeResult>('/api/analyze-garment', {
      imageUrl: garmentImage.url,
    })
    log('2/5', `Type: ${analysis.garment.garment_type} | Style: ${analysis.garment.style}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate] Step 2 failed:', message)
    return NextResponse.json({ error: 'Garment analysis failed', detail: message }, { status: 502 })
  }

  // ── Step 3: Generate image ────────────────────────────────────────────────
  log('3/5', 'Generating fashion image with Replicate...')
  let generatedImageUrl: string

  try {
    const result = await callInternal<GenerateImageResult>('/api/generate-image', {
      garmentImageUrl: garmentImage.url,
      modelImageUrl:   modelImage.url,
      prompt:          analysis.prompt,
    })
    generatedImageUrl = result.imageUrl
    log('3/5', `Generated image URL: ${generatedImageUrl}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate] Step 3 failed:', message)
    return NextResponse.json({ error: 'Image generation failed', detail: message }, { status: 502 })
  }

  // ── Step 4: Generate caption + hashtags ───────────────────────────────────
  log('4/5', 'Generating caption and hashtags with GPT-4o...')
  let caption: string
  let hashtags: string

  try {
    const result = await callInternal<GenerateCaptionResult>('/api/generate-caption', {
      garment: {
        garment_type: analysis.garment.garment_type,
        color:        analysis.garment.color,
        fabric:       analysis.garment.fabric,
        style:        analysis.garment.style,
      },
      prompt: analysis.prompt,
    })
    caption  = result.caption
    hashtags = result.hashtags
    log('4/5', `Caption: "${caption.slice(0, 60)}..."`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate] Step 4 failed:', message)
    return NextResponse.json({ error: 'Caption generation failed', detail: message }, { status: 502 })
  }

  // ── Step 5: Save to Supabase ──────────────────────────────────────────────
  log('5/5', 'Saving post to Supabase...')

  const { data: post, error: dbError } = await supabase
    .from('posts')
    .insert({
      garment_image_url:   garmentImage.url,
      generated_image_url: generatedImageUrl,
      caption,
      hashtags,
      status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    console.error('[/api/generate] Step 5 failed:', dbError.message)
    return NextResponse.json({ error: 'Failed to save post', detail: dbError.message }, { status: 500 })
  }

  log('5/5', `Post saved — id: ${post.id}`)

  return NextResponse.json({ success: true, post })
}
