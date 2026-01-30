'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PostWithAuthor } from '@/types/database'
import { formatRelativeTime } from '@/utils/japanese'

interface PostCardProps {
  post: PostWithAuthor
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const supabase = createClient()

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
    const url = `${window.location.origin}/post/${post.id}`
    const text = `${post.profiles.kanjis?.char || ''} ${post.profiles.username}さんの投稿`

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('リンクをコピーしました')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  const kanjiChar = post.profiles.kanjis?.char || '?'

  return (
    <>
      <article className="p-4 border-b border-border">
        <div className="flex gap-3">
          <Link
            href={`/profile/${post.profiles.username}`}
            className="flex-shrink-0"
          >
            <div className="w-10 h-10 border border-border flex items-center justify-center bg-background hover:bg-border transition-colors">
              <span className="font-serif text-xl">{kanjiChar}</span>
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${post.profiles.username}`}
                className="font-medium hover:underline truncate"
              >
                {post.profiles.display_name || post.profiles.username}
              </Link>
              <span className="text-muted text-sm">
                @{post.profiles.username}
              </span>
              <span className="text-muted-foreground text-sm">
                · {formatRelativeTime(post.created_at)}
              </span>
            </div>

            <p className="post-content mb-3">{post.content}</p>

            {post.image_url && (
              <div className="mb-3">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="block w-full"
                >
                  <Image
                    src={post.image_url}
                    alt="投稿画像"
                    width={500}
                    height={300}
                    className="w-full max-h-80 object-cover border border-border"
                  />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={`
                  flex items-center gap-1 text-sm transition-colors
                  ${hasLiked
                    ? 'text-destructive'
                    : 'text-muted hover:text-destructive'
                  }
                  ${!currentUserId ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <Heart
                  className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`}
                />
                <span>{likesCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {showImageModal && post.image_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <Image
            src={post.image_url}
            alt="投稿画像"
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
