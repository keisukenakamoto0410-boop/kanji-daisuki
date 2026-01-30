'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, Shield, ShieldOff, Crown, ChevronLeft, ChevronRight, MessageSquare, Star } from 'lucide-react'

type User = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_paid: boolean
  is_admin: boolean
  created_at: string
  kanjis: { char: string; reading_kun: string | null } | null
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

type CommentType = {
  id: number
  post_id: number
  user_id: string
  content: string
  created_at: string
  author: { username: string; display_name: string | null } | null
  postPreview: string
}

type Props = {
  users: User[]
  posts: Post[]
  comments: CommentType[]
}

const ITEMS_PER_PAGE = 20

export default function AdminDashboard({ users: initialUsers, posts: initialPosts, comments: initialComments }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'comments'>('users')
  const [users, setUsers] = useState(initialUsers)
  const [posts, setPosts] = useState(initialPosts)
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading] = useState<string | null>(null)

  // Pagination state
  const [userPage, setUserPage] = useState(1)
  const [postPage, setPostPage] = useState(1)
  const [commentPage, setCommentPage] = useState(1)

  // Calculate pagination
  const paginatedUsers = users.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE)
  const paginatedPosts = posts.slice((postPage - 1) * ITEMS_PER_PAGE, postPage * ITEMS_PER_PAGE)
  const paginatedComments = comments.slice((commentPage - 1) * ITEMS_PER_PAGE, commentPage * ITEMS_PER_PAGE)

  const totalUserPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const totalPostPages = Math.ceil(posts.length / ITEMS_PER_PAGE)
  const totalCommentPages = Math.ceil(comments.length / ITEMS_PER_PAGE)

  const handleDeletePost = async (postId: number) => {
    if (!confirm('この投稿を削除してもよろしいですか？関連するコメントといいねも削除されます。')) return

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
      // Also remove comments related to this post
      setComments(comments.filter(c => c.post_id !== postId))
    }
    setLoading(null)
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('このコメントを削除してもよろしいですか？')) return

    setLoading(`comment-${commentId}`)
    const supabase = createClient()

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
    } else {
      setComments(comments.filter(c => c.id !== commentId))
    }
    setLoading(null)
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`ユーザー「${username}」を削除してもよろしいですか？このユーザーの投稿、コメント、いいねも全て削除されます。この操作は取り消せません。`)) return

    setLoading(`user-delete-${userId}`)
    const supabase = createClient()

    // Delete user's likes
    await supabase.from('likes').delete().eq('user_id', userId)

    // Delete user's comments
    await supabase.from('comments').delete().eq('user_id', userId)

    // Get user's posts to delete their likes and comments
    const { data: userPosts } = await supabase.from('posts').select('id').eq('user_id', userId)
    if (userPosts && userPosts.length > 0) {
      const postIds = (userPosts as { id: number }[]).map(p => p.id)
      await supabase.from('likes').delete().in('post_id', postIds)
      await supabase.from('comments').delete().in('post_id', postIds)
    }

    // Delete user's posts
    await supabase.from('posts').delete().eq('user_id', userId)

    // Delete kanji selections
    await supabase.from('kanji_selections').delete().eq('user_id', userId)

    // Delete profile
    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
    } else {
      setUsers(users.filter(u => u.id !== userId))
      setPosts(posts.filter(p => p.user_id !== userId))
      setComments(comments.filter(c => c.user_id !== userId))
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

  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'border-sakura text-sakura-dark'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'posts'
              ? 'border-sakura text-sakura-dark'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'comments'
              ? 'border-sakura text-sakura-dark'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Comments ({comments.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Kanji</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura to-sakura-dark flex items-center justify-center text-white font-bold shrink-0">
                            {user.display_name?.[0] || user.username[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.display_name || user.username}</p>
                            <p className="text-sm text-muted truncate">@{user.username}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {user.kanjis ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-serif">{user.kanjis.char}</span>
                            {user.kanjis.reading_kun && (
                              <span className="text-xs text-muted">({user.kanjis.reading_kun})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted text-sm">-</span>
                        )}
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
                      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            disabled={loading === `user-${user.id}`}
                            className={`p-2 rounded-lg transition-all ${
                              user.is_admin
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50`}
                            title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          >
                            {user.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleTogglePaid(user.id, user.is_paid)}
                            disabled={loading === `paid-${user.id}`}
                            className={`p-2 rounded-lg transition-all ${
                              user.is_paid
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50`}
                            title={user.is_paid ? 'Remove Paid' : 'Make Paid'}
                          >
                            {user.is_paid ? <Star className="w-4 h-4 fill-current" /> : <Crown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            disabled={loading === `user-delete-${user.id}`}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Author</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Content</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Stats</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {post.author?.display_name || post.author?.username || 'Unknown'}
                          </p>
                          {post.author && (
                            <p className="text-sm text-muted truncate">@{post.author.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/posts/${post.id}`} className="hover:text-sakura-dark">
                          <p className="text-sm line-clamp-2 max-w-md">{post.content}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-sm text-muted whitespace-nowrap">
                          <span>❤️ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={loading === `post-${post.id}`}
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all disabled:opacity-50"
                          title="Delete Post"
                        >
                          {loading === `post-${post.id}` ? (
                            <span className="w-4 h-4 block animate-spin">⏳</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={postPage} totalPages={totalPostPages} onPageChange={setPostPage} />
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Author</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Comment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Post</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedComments.map(comment => (
                    <tr key={comment.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {comment.author?.display_name || comment.author?.username || 'Unknown'}
                          </p>
                          {comment.author && (
                            <p className="text-sm text-muted truncate">@{comment.author.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm line-clamp-2 max-w-sm">{comment.content}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/posts/${comment.post_id}`}
                          className="flex items-center gap-1 text-sm text-muted hover:text-sakura-dark"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{comment.postPreview}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                        {formatDate(comment.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={loading === `comment-${comment.id}`}
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all disabled:opacity-50"
                          title="Delete Comment"
                        >
                          {loading === `comment-${comment.id}` ? (
                            <span className="w-4 h-4 block animate-spin">⏳</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comments.length === 0 && (
              <p className="text-center text-muted py-8">コメントがありません</p>
            )}
          </div>
          <Pagination currentPage={commentPage} totalPages={totalCommentPages} onPageChange={setCommentPage} />
        </div>
      )}
    </div>
  )
}
