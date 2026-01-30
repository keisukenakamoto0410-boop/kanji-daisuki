'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, User, Pencil, Trash2, X, Check, MoreHorizontal, MessageCircle, Link2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PostAuthor {
  username: string
  display_name: string | null
  avatar_url: string | null
  selected_kanji_id: number | null
  kanji_char?: string | null
  kanji_reading?: string | null
}

interface Post {
  id: number
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count?: number
  created_at: string
  user_has_liked?: boolean
  author?: PostAuthor | null
}

interface PostCardClientProps {
  post: Post
  currentUserId?: string
}

function formatJapaneseDateTime(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

export default function PostCardClient({ post, currentUserId }: PostCardClientProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [content, setContent] = useState(post.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  const supabase = createClient()
  const author = post.author
  const isOwnPost = currentUserId === post.user_id

  // 匿名ユーザーのいいね状態を初期化
  useEffect(() => {
    if (!currentUserId) {
      const likedPosts = JSON.parse(localStorage.getItem('anonymousLikes') || '[]') as number[]
      if (likedPosts.includes(post.id)) {
        setHasLiked(true)
      }
    }
  }, [currentUserId, post.id])

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button') || target.closest('textarea')) {
      return
    }
    if (isEditing || showDeleteConfirm) return
    router.push(`/posts/${post.id}`)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLiking) return

    setIsLiking(true)

    try {
      if (currentUserId) {
        // ログインユーザーの場合はDBに保存（トリガーが自動でlikes_countを更新）
        if (hasLiked) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('likes') as any)
            .delete()
            .eq('user_id', currentUserId)
            .eq('post_id', post.id)

          setLikesCount((prev) => Math.max(0, prev - 1))
          setHasLiked(false)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('likes') as any).insert({
            user_id: currentUserId,
            post_id: post.id,
          })

          setLikesCount((prev) => prev + 1)
          setHasLiked(true)
        }
      } else {
        // 未ログインユーザーの場合はローカルストレージで管理
        const likedPosts = JSON.parse(localStorage.getItem('anonymousLikes') || '[]') as number[]

        if (hasLiked) {
          // いいね解除
          const newLikedPosts = likedPosts.filter(id => id !== post.id)
          localStorage.setItem('anonymousLikes', JSON.stringify(newLikedPosts))

          // Update likes_count in posts table (anonymous likes need manual update)
          const newCount = Math.max(0, likesCount - 1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any)
            .update({ likes_count: newCount })
            .eq('id', post.id)

          setLikesCount(newCount)
          setHasLiked(false)
        } else {
          // いいね追加
          likedPosts.push(post.id)
          localStorage.setItem('anonymousLikes', JSON.stringify(likedPosts))

          // Update likes_count in posts table (anonymous likes need manual update)
          const newCount = likesCount + 1
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any)
            .update({ likes_count: newCount })
            .eq('id', post.id)

          setLikesCount(newCount)
          setHasLiked(true)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    alert('Coming soon!')
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/posts/${post.id}`

    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleShareX = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/posts/${post.id}`
    const text = content.slice(0, 100) + (content.length > 100 ? '...' : '')
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/posts/${post.id}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/posts/${post.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kanji Daisuki',
          text: content.slice(0, 100),
          url: url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditContent(content)
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditContent(content)
    setIsEditing(false)
  }

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!editContent.trim() || isUpdating) return

    setIsUpdating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('posts') as any)
        .update({ content: editContent.trim() })
        .eq('id', post.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      setContent(editContent.trim())
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
    setShowMenu(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDeleting) return

    setIsDeleting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('posts') as any)
        .delete()
        .eq('id', post.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      setIsDeleted(true)
      router.refresh()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  if (isDeleted) {
    return null
  }

  return (
    <article
      onClick={handleCardClick}
      className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer mb-4"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        {/* Left: Avatar + Username + Date */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {author?.username ? (
            <Link
              href={`/profile/${author.username}`}
              className="block flex-shrink-0"
            >
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.display_name || author.username}
                  width={48}
                  height={48}
                  className="rounded-full object-cover ring-2 ring-sakura/20"
                />
              ) : author.kanji_char ? (
                <div className="w-12 h-12 bg-gradient-to-br from-sakura/20 to-sakura/30 flex items-center justify-center rounded-full">
                  <span className="font-serif text-xl text-sakura-dark">{author.kanji_char}</span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-full">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </Link>
          ) : (
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-full">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}

          {/* Username + Date */}
          <div>
            {author?.username ? (
              <Link
                href={`/profile/${author.username}`}
                className="font-bold text-foreground hover:underline block"
              >
                {author.display_name || author.username}
              </Link>
            ) : (
              <span className="font-medium text-muted">Anonymous</span>
            )}
            <p className="text-sm text-muted">{formatJapaneseDateTime(post.created_at)}</p>
          </div>
        </div>

        {/* Right: Kanji Badge + Follow + Menu */}
        <div className="flex items-center gap-2">
          {/* Kanji Badge */}
          {author?.kanji_char && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sakura/10 rounded-full">
              <span className="font-serif text-lg text-sakura-dark">{author.kanji_char}</span>
              {author.kanji_reading && (
                <span className="text-xs text-sakura-dark">{author.kanji_reading}</span>
              )}
            </div>
          )}

          {/* Follow Button (not own post, logged in) */}
          {currentUserId && !isOwnPost && (
            <button
              onClick={handleFollow}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky text-white text-xs font-medium rounded-full hover:bg-sky-dark transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Follow
            </button>
          )}

          {/* Menu Button (own post) */}
          {isOwnPost && !isEditing && !showDeleteConfirm && (
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[120px] overflow-hidden">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-2.5 text-left text-sm text-accent hover:bg-accent/5 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <p className="text-accent text-sm font-medium mb-3">Delete this post?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Post Content */}
      {isEditing ? (
        <div className="mb-4 space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full p-4 border-2 border-sakura/30 rounded-xl resize-none focus:outline-none focus:border-sakura text-base"
            rows={4}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{editContent.length}/500</span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="flex items-center gap-1 px-4 py-2 text-sm text-muted hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating || !editContent.trim()}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-sakura text-white rounded-lg hover:bg-sakura-dark disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Footer: Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Left: Like + Comment counts */}
        <div className="flex items-center gap-4">
          {/* Comment count */}
          <div className="flex items-center gap-1.5 text-muted">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </div>

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasLiked
                ? 'text-accent'
                : 'text-muted hover:text-accent'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </button>
        </div>

        {/* Right: Share buttons */}
        <div className="flex items-center gap-1">
          {/* X (Twitter) */}
          <button
            onClick={handleShareX}
            className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-full transition-colors"
            title="Share on X"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* Facebook */}
          <button
            onClick={handleShareFacebook}
            className="p-2 text-muted hover:text-[#1877F2] hover:bg-blue-50 rounded-full transition-colors"
            title="Share on Facebook"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-full transition-colors"
            title="Copy link"
          >
            <Link2 className="w-4 h-4" />
          </button>

          {/* Native Share (mobile) */}
          <button
            onClick={handleNativeShare}
            className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-full transition-colors"
            title="Share"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
