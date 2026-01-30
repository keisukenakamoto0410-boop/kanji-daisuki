'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type User = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_paid: boolean
  is_admin: boolean
  created_at: string
}

type Post = {
  id: number
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  author: { username: string; display_name: string | null } | null
}

type Props = {
  users: User[]
  posts: Post[]
}

export default function AdminDashboard({ users: initialUsers, posts: initialPosts }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users')
  const [users, setUsers] = useState(initialUsers)
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState<string | null>(null)

  const handleDeletePost = async (postId: number) => {
    if (!confirm('この投稿を削除してもよろしいですか？')) return

    setLoading(`post-${postId}`)
    const supabase = createClient()

    // Delete likes first
    await supabase.from('likes').delete().eq('post_id', postId)

    // Delete comments
    await supabase.from('comments').delete().eq('post_id', postId)

    // Delete the post
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
    } else {
      setPosts(posts.filter(p => p.id !== postId))
    }
    setLoading(null)
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(currentIsAdmin ? '管理者権限を削除しますか？' : '管理者権限を付与しますか？')) return

    setLoading(`user-${userId}`)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update({ is_admin: !currentIsAdmin })
      .eq('id', userId)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u))
    }
    setLoading(null)
  }

  const handleTogglePaid = async (userId: string, currentIsPaid: boolean) => {
    if (!confirm(currentIsPaid ? '有料会員を解除しますか？' : '有料会員に設定しますか？')) return

    setLoading(`paid-${userId}`)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update({ is_paid: !currentIsPaid })
      .eq('id', userId)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, is_paid: !currentIsPaid } : u))
    }
    setLoading(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-sakura text-white'
              : 'bg-card hover:bg-muted'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'posts'
              ? 'bg-sakura text-white'
              : 'bg-card hover:bg-muted'
          }`}
        >
          Posts ({posts.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura to-sakura-dark flex items-center justify-center text-white font-bold">
                          {user.display_name?.[0] || user.username[0]}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || user.username}</p>
                          <p className="text-sm text-muted">@{user.username}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.is_admin && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Admin</span>
                        )}
                        {user.is_paid && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Paid</span>
                        )}
                        {!user.is_admin && !user.is_paid && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={loading === `user-${user.id}`}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                            user.is_admin
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {loading === `user-${user.id}` ? '...' : user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleTogglePaid(user.id, user.is_paid)}
                          disabled={loading === `paid-${user.id}`}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                            user.is_paid
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {loading === `paid-${user.id}` ? '...' : user.is_paid ? 'Remove Paid' : 'Make Paid'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="card p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {post.author?.display_name || post.author?.username || 'Unknown'}
                    </span>
                    {post.author && (
                      <span className="text-sm text-muted">@{post.author.username}</span>
                    )}
                    <span className="text-sm text-muted">・{formatDate(post.created_at)}</span>
                  </div>
                  <p className="text-sm mb-2 line-clamp-3">{post.content}</p>
                  <div className="flex gap-4 text-sm text-muted">
                    <span>{post.likes_count} likes</span>
                    <span>{post.comments_count} comments</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={loading === `post-${post.id}`}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 shrink-0"
                >
                  {loading === `post-${post.id}` ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-center text-muted py-8">投稿がありません</p>
          )}
        </div>
      )}
    </div>
  )
}
