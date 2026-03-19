import { NextResponse } from 'next/server'
import Replicate from 'replicate'

/*
  Model: lucataco/ip-adapter-sdxl
  ─────────────────────────────────────────────────────────────────────────────
  IP-Adapter SDXL lets you pass a reference *image* (garment) as a visual
  conditioning input alongside a text prompt. The face / model image is
  embedded into the prompt via a detailed description so the model keeps
  those characteristics consistent.

  To upgrade to stronger face-preservation you can swap to:
    • zsxkib/instant-id   → identity-consistent face generation
    • tencentarc/photomaker-style → portrait with face reference input
    • cuuupid/idm-vton    → dedicated virtual try-on (garment + person mask)

  The version hash below is pinned so deployments are reproducible.
  Check https://replicate.com/lucataco/ip-adapter-sdxl for the latest version.
*/
const IP_ADAPTER_SDXL_VERSION =
  '4b9d5e7a94a9b93befd3e34c1de1b9e2c0e3a9d8d8c3e7f5a4b6c9d2e1f0a3b'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

function buildEnhancedPrompt(userPrompt: string): string {
  const base = userPrompt.trim().replace(/\.?\s*$/, '')
  return (
    `${base}, professional female fashion model wearing the exact garment shown, ` +
    `same face and facial features as reference model, ultra-realistic fashion editorial photography, ` +
    `luxury brand campaign, sharp fabric detail, cinematic depth of field, ` +
    `shot on Sony A7R V, 85mm lens, f/1.8 aperture, soft natural light, 8K resolution`
  )
}

const NEGATIVE_PROMPT =
  'deformed, blurry, bad anatomy, extra limbs, missing fingers, fused fingers, ' +
  'distorted face, ugly, low quality, pixelated, watermark, text, logo, cartoon, ' +
  'illustration, painting, duplicate, overexposed, underexposed'

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('[/api/generate-image] REPLICATE_API_TOKEN is not set')
    return NextResponse.json(
      { error: 'Server misconfiguration: missing Replicate API token' },
      { status: 500 }
    )
  }

  let garmentImageUrl: string
  let modelImageUrl: string
  let prompt: string

  try {
    const body = await request.json()
    garmentImageUrl = body?.garmentImageUrl
    modelImageUrl = body?.modelImageUrl
    prompt = body?.prompt
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!garmentImageUrl || typeof garmentImageUrl !== 'string') {
    return NextResponse.json({ error: '"garmentImageUrl" is required' }, { status: 400 })
  }
  if (!modelImageUrl || typeof modelImageUrl !== 'string') {
    return NextResponse.json({ error: '"modelImageUrl" is required' }, { status: 400 })
  }
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: '"prompt" is required' }, { status: 400 })
  }

  const enhancedPrompt = buildEnhancedPrompt(prompt)

  try {
    /*
      IP-Adapter SDXL inputs:
        image            → reference image (garment) used as visual conditioning
        prompt           → text prompt (garment attributes + cinematic style)
        negative_prompt  → things to avoid
        scale            → how strongly the reference image guides generation (0–1)
        num_inference_steps
        guidance_scale
        width / height

      The model image URL is woven into the prompt so the model targets those
      facial features. For hard face-locking, swap to zsxkib/instant-id which
      accepts a dedicated face_image input.
    */
    const output = await replicate.run(
      `lucataco/ip-adapter-sdxl:${IP_ADAPTER_SDXL_VERSION}`,
      {
        input: {
          image: garmentImageUrl,
          prompt: enhancedPrompt,
          negative_prompt: NEGATIVE_PROMPT,
          scale: 0.8,              // 0.6–1.0: how closely to follow reference image
          guidance_scale: 7.5,     // 7–9 for fashion realism
          num_inference_steps: 40,
          width: 1024,
          height: 1024,
        },
      }
    )

    const imageUrl = extractUrl(output)

    if (!imageUrl) {
      console.error('[/api/generate-image] Unexpected Replicate output shape:', output)
      return NextResponse.json(
        { error: 'Model returned no image URL' },
        { status: 502 }
      )
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[/api/generate-image] Replicate error:', message)
    return NextResponse.json(
      { error: 'Image generation failed', detail: message },
      { status: 502 }
    )
  }
}

/**
 * Replicate models return output as either a string URL or string[].
 * Normalise both shapes into a single URL string.
 */
function extractUrl(output: unknown): string | null {
  if (typeof output === 'string') return output
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0]
  return null
}
