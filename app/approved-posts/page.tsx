import PostCard from '@/components/PostCard'
import type { Post } from '@/lib/supabase'

const approvedPosts: Post[] = [
  {
    id: '3',
    garment_image_url: null,
    generated_image_url: null,
    caption: 'Bold prints, timeless silhouettes. This season\'s must-have piece for every wardrobe.',
    hashtags: '#boldprints #timeless #fashion #womenswear #shrishaa',
    status: 'approved',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: '4',
    garment_image_url: null,
    generated_image_url: null,
    caption: 'Crafted with precision, worn with pride. Introducing our artisan embroidery line.',
    hashtags: '#embroidery #artisan #handcrafted #luxuryfashion #shrishaa',
    status: 'posted',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

export default function ApprovedPostsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Approved Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Posts ready to schedule or already posted</p>
        </div>
        <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Schedule All
        </button>
      </div>

      {approvedPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 text-sm">No approved posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {approvedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
