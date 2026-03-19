'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import type { Post } from '@/lib/supabase'

interface PostCardProps {
  post: Post
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  showActions?: boolean
}

const statusConfig: Record<Post['status'], { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200',       icon: Ban },
  posted:   { label: 'Posted',   color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: CheckCircle },
}

export default function PostCard({ post, onApprove, onReject, showActions = false }: PostCardProps) {
  const status = statusConfig[post.status]
  const StatusIcon = status.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Images */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="aspect-square bg-gray-50 relative">
          {post.garment_image_url ? (
            <Image src={post.garment_image_url} alt="Garment" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-gray-400">No image</p>
            </div>
          )}
          <span className="absolute top-2 left-2 text-[10px] font-medium bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-gray-500">
            Original
          </span>
        </div>
        <div className="aspect-square bg-gray-50 relative">
          {post.generated_image_url ? (
            <Image src={post.generated_image_url} alt="Generated" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-gray-400">No image</p>
            </div>
          )}
          <span className="absolute top-2 left-2 text-[10px] font-medium bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-gray-500">
            Generated
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{post.caption}</p>
        )}

        {/* Hashtags */}
        {post.hashtags && (
          <p className="text-xs text-blue-500 line-clamp-1">{post.hashtags}</p>
        )}

        {/* Actions */}
        {showActions && post.status === 'pending' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onApprove?.(post.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => onReject?.(post.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
