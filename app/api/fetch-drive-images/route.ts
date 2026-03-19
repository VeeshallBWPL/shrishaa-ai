import { NextResponse } from 'next/server'

const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY
const RAW_FOLDER_ID = process.env.GOOGLE_DRIVE_RAW_FOLDER
const MODEL_FOLDER_ID = process.env.GOOGLE_DRIVE_MODEL_FOLDER

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

interface DriveFile {
  id: string
  name: string
  url: string
}

interface DriveApiFile {
  id: string
  name: string
  mimeType: string
}

async function fetchImagesFromFolder(folderId: string): Promise<DriveFile[]> {
  const mimeQuery = IMAGE_MIME_TYPES
    .map((m) => `mimeType='${m}'`)
    .join(' or ')

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and (${mimeQuery}) and trashed=false`,
    fields: 'files(id,name,mimeType)',
    key: DRIVE_API_KEY!,
    pageSize: '200',
  })

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Drive API error (${res.status}) for folder ${folderId}: ${body}`)
  }

  const json = await res.json()
  const files: DriveApiFile[] = json.files ?? []

  return files.map((file) => ({
    id: file.id,
    name: file.name,
    url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${DRIVE_API_KEY}`,
  }))
}

export async function GET() {
  if (!DRIVE_API_KEY) {
    console.error('[/api/fetch-drive-images] GOOGLE_DRIVE_API_KEY is not set')
    return NextResponse.json({ error: 'Server misconfiguration: missing API key' }, { status: 500 })
  }
  if (!RAW_FOLDER_ID) {
    console.error('[/api/fetch-drive-images] GOOGLE_DRIVE_RAW_FOLDER is not set')
    return NextResponse.json({ error: 'Server misconfiguration: missing RAW folder ID' }, { status: 500 })
  }
  if (!MODEL_FOLDER_ID) {
    console.error('[/api/fetch-drive-images] GOOGLE_DRIVE_MODEL_FOLDER is not set')
    return NextResponse.json({ error: 'Server misconfiguration: missing MODEL folder ID' }, { status: 500 })
  }

  const [garmentsResult, modelsResult] = await Promise.allSettled([
    fetchImagesFromFolder(RAW_FOLDER_ID),
    fetchImagesFromFolder(MODEL_FOLDER_ID),
  ])

  if (garmentsResult.status === 'rejected') {
    console.error('[/api/fetch-drive-images] Failed to fetch garments:', garmentsResult.reason)
    return NextResponse.json({ error: 'Failed to fetch garment images' }, { status: 502 })
  }

  if (modelsResult.status === 'rejected') {
    console.error('[/api/fetch-drive-images] Failed to fetch models:', modelsResult.reason)
    return NextResponse.json({ error: 'Failed to fetch model images' }, { status: 502 })
  }

  return NextResponse.json({
    garments: garmentsResult.value,
    models: modelsResult.value,
  })
}
