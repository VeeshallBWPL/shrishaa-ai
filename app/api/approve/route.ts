import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  let postId: string
  let action: 'approve' | 'reject'

  try {
    const body = await request.json()
    postId = body?.postId
    action = body?.action
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!postId || typeof postId !== 'string') {
    return NextResponse.json({ error: '"postId" is required' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: '"action" must be "approve" or "reject"' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('posts')
    .update({ status: newStatus })
    .eq('id', postId)

  if (error) {
    console.error('[/api/approve] Supabase error:', error.message)
    return NextResponse.json({ error: 'Failed to update post', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
