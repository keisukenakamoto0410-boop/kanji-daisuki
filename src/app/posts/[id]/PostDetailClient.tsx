'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2, User, Pencil, Trash2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PostAuthor {
  username: string
  display_name: string | null
  avatar_url: string | null
  selected_kanji_id: number | null
  kanji_char?: string | null
}

interface Post {
  id: number
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  created_at: string
  user_has_liked?: boolean
  author?: PostAuthor | null
}

interface PostDetailClientProps {
  post: Post
  currentUserId?: string
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PostDetailClient({ post, currentUserId }: PostDetailClientProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [content, setContent] = useState(post.content)

  const supabase = createClient()
  const author = post.author
  const isOwnPost = currentUserId === post.user_id

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)

    try {
      if (hasLiked) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('likes') as any)
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id)

        // Trigger will automatically update likes_count in posts table
        setLikesCount((prev) => Math.max(0, prev - 1))
        setHasLiked(false)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('likes') as any).insert({
          user_id: currentUserId,
          post_id: post.id,
        })

        // Trigger will automatically update likes_count in posts table
        setLikesCount((prev) => prev + 1)
        setHasLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleEdit = () => {
    setEditContent(content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
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

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('posts') as any)
        .delete()
        .eq('id', post.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <article className="bg-white/90 backdrop-blur-sm">
      {/* User info */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {author?.username ? (
            <Link href={`/profile/${author.username}`} className="block">
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.display_name || author.username}
                  width={48}
                  height={48}
                  className="rounded-full object-cover ring-2 ring-sakura/20"
                />
              ) : author.kanji_char ? (
                <div className="w-12 h-12 bg-sakura/10 flex items-center justify-center rounded-full ring-2 ring-sakura/20">
                  <span className="font-serif text-xl text-sakura-dark">{author.kanji_char}</span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-sakura/10 flex items-center justify-center rounded-full">
                  <User className="w-6 h-6 text-sakura" />
                </div>
              )}
            </Link>
          ) : (
            <div className="w-12 h-12 bg-sakura/10 flex items-center justify-center rounded-full">
              <User className="w-6 h-6 text-sakura" />
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          {author?.username ? (
            <Link href={`/profile/${author.username}`} className="hover:underline">
              <p className="font-bold text-foreground truncate">
                {author.display_name || author.username}
              </p>
              <p className="text-muted text-sm">@{author.username}</p>
            </Link>
          ) : (
            <p className="font-medium text-muted">Anonymous</p>
          )}
          <p className="text-muted text-sm mt-1">{formatDateTime(post.created_at)}</p>
        </div>

        {/* Kanji + edit/delete buttons */}
        <div className="flex items-start gap-2">
          {isOwnPost && !isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                className="p-2 text-muted hover:text-foreground hover:bg-sakura/10 rounded-full transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="w-14 h-14 border-2 border-sakura/20 flex items-center justify-center bg-sakura/5 rounded-xl">
            <span className="font-serif text-3xl text-sakura-dark">
              {author?.kanji_char || '?'}
            </span>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="mx-4 mb-4 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <p className="text-accent font-medium mb-3">Delete this post?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Post content */}
      <div className="px-4 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border-2 border-sakura/30 rounded-xl resize-none focus:outline-none focus:border-sakura"
              rows={4}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{editContent.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-1.5 text-muted hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sakura text-white rounded-lg hover:bg-sakura-dark disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="w-full border border-sakura/20 rounded-xl object-cover"
          />
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-3 border-t border-sakura/20 flex items-center gap-8">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={!currentUserId || isLiking}
          className={`flex items-center gap-2 text-base transition-colors ${
            hasLiked
              ? 'text-accent'
              : 'text-muted hover:text-accent'
          } ${!currentUserId ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
        >
          <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current' : ''}`} />
          <span>{likesCount} likes</span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-base text-muted hover:text-sky-dark transition-colors"
        >
          <Share2 className="w-6 h-6" />
          <span>Share</span>
        </button>
      </div>
    </article>
  )
}
