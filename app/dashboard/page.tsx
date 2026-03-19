import { Activity, Clock, ImageIcon, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

const statusConfig: Record<Post['status'], { label: string; dot: string; badge: string }> = {
  pending:  { label: 'Pending',  dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', dot: 'bg-red-400',   badge: 'bg-red-50 text-red-700' },
  posted:   { label: 'Posted',   dot: 'bg-blue-400',  badge: 'bg-blue-50 text-blue-700' },
}

export default async function DashboardPage() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Dashboard] Failed to fetch posts:', error.message)
  }

  const allPosts: Post[] = posts ?? []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const generatedToday = allPosts.filter(
    (p) => new Date(p.created_at) >= todayStart
  ).length

  const approvedCount = allPosts.filter(
    (p) => p.status === 'approved' || p.status === 'posted'
  ).length

  const pendingCount = allPosts.filter((p) => p.status === 'pending').length

  const lastPost = allPosts[0]
  const lastRunLabel = lastPost
    ? formatRelative(new Date(lastPost.created_at))
    : 'Never'

  const stats = [
    {
      label: 'System Status',
      value: error ? 'Degraded' : 'Operational',
      sub: error ? 'Could not reach Supabase' : 'All systems running',
      icon: Activity,
      iconColor: error ? 'text-red-500' : 'text-green-500',
      iconBg: error ? 'bg-red-50' : 'bg-green-50',
      valueColor: error ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'Last Run',
      value: lastRunLabel,
      sub: lastPost
        ? new Date(lastPost.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'No posts yet',
      icon: Clock,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      valueColor: 'text-gray-900',
    },
    {
      label: 'Posts Generated Today',
      value: String(generatedToday),
      sub: `${allPosts.length} total`,
      icon: ImageIcon,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50',
      valueColor: 'text-gray-900',
    },
    {
      label: 'Posts Approved',
      value: String(approvedCount),
      sub: `${pendingCount} pending review`,
      icon: CheckCircle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      valueColor: 'text-gray-900',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your AI content pipeline</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, sub, icon: Icon, iconColor, iconBg, valueColor }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-semibold ${valueColor} mb-1`}>{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Recent Posts</h2>

        {allPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No posts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Garment</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Generated</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allPosts.map((post) => {
                  const s = statusConfig[post.status]
                  return (
                    <tr key={post.id} className="group">
                      <td className="py-3 pr-4">
                        <ImageCell url={post.garment_image_url} alt="Garment" />
                      </td>
                      <td className="py-3 pr-4">
                        <ImageCell url={post.generated_image_url} alt="Generated" />
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(post.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ImageCell({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <span className="text-[9px] text-gray-400">None</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="w-10 h-10 rounded-lg object-cover border border-gray-100"
    />
  )
}

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
