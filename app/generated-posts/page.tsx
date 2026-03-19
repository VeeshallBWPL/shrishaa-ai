'use client'

import { useState } from 'react'
import PostCard from '@/components/PostCard'
import type { Post } from '@/lib/supabase'

// Placeholder data
const mockPosts: Post[] = [
  {
    id: '1',
    garment_image_url: null,
    generated_image_url: null,
    caption: 'Elevate your style with our latest summer collection. Effortlessly chic, endlessly versatile. ✨',
    hashtags: '#fashion #style #ootd #summercollection #shrishaa',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    garment_image_url: null,
    generated_image_url: null,
    caption: 'Where comfort meets elegance. Our new drape collection is here to transform your wardrobe.',
    hashtags: '#drape #elegance #indianfashion #designer #shrishaa',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
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

export default function GeneratedPostsPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [filter, setFilter] = useState<'all' | Post['status']>('all')

  const handleApprove = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' as const } : p))
  }

  const handleReject = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const filters: { label: string; value: 'all' | Post['status'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Posted', value: 'posted' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Generated Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} posts total</p>
        </div>
        <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Generate New
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 text-sm">No posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions
            />
          ))}
        </div>
      )}
    </div>
  )
}
