'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: number
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    kanjis: { char: string } | null
  } | null
  user_has_liked?: boolean
}

interface SimplePostCardProps {
  post: Post
  currentUserId?: string
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`

  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function SimplePostCard({ post, currentUserId }: SimplePostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

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

    if (navigator.share) {
      try {
        await navigator.share({ url })
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

  const username = post.profiles?.username || 'unknown'
  const displayName = post.profiles?.display_name || username
  const kanjiChar = post.profiles?.kanjis?.char

  return (
    <article className="bg-white border-b border-gray-200">
      <div className="p-4">
        <div className="flex gap-3">
          {/* アイコン */}
          <Link href={`/profile/${username}`} className="flex-shrink-0">
            <div className="w-10 h-10 border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
              {kanjiChar ? (
                <span className="font-serif text-xl font-bold text-black">{kanjiChar}</span>
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </Link>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            {/* ユーザー情報 */}
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/profile/${username}`} className="font-medium text-black hover:underline">
                {displayName}
              </Link>
              <span className="text-gray-500 text-sm">@{username}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-500 text-sm">{formatRelativeTime(post.created_at)}</span>
            </div>

            {/* 投稿内容 */}
            <p className="text-black text-base leading-relaxed mb-3 whitespace-pre-wrap break-words">
              {post.content}
            </p>

            {/* 画像 */}
            {post.image_url && (
              <div className="mb-3">
                <Image
                  src={post.image_url}
                  alt="投稿画像"
                  width={500}
                  height={300}
                  className="w-full max-h-80 object-cover border border-gray-200 rounded"
                />
              </div>
            )}

            {/* アクション */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  hasLiked
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                } ${!currentUserId ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
