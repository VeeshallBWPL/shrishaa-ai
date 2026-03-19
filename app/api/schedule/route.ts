import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postId, scheduledAt } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    // TODO: Validate postId exists and has status 'approved'
    // const { data: post } = await supabase
    //   .from('posts')
    //   .select()
    //   .eq('id', postId)
    //   .single()
    // if (!post || post.status !== 'approved') {
    //   return NextResponse.json({ error: 'Post not found or not approved' }, { status: 404 })
    // }

    // TODO: Schedule via Instagram Graph API / queue system
    // await scheduleInstagramPost({ post, scheduledAt })

    // TODO: Update status in Supabase
    // await supabase.from('posts').update({ status: 'posted' }).eq('id', postId)

    return NextResponse.json({
      success: true,
      postId,
      scheduledAt: scheduledAt ?? new Date().toISOString(),
      status: 'posted',
    })
  } catch (error) {
    console.error('[/api/schedule]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
