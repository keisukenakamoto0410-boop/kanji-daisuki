'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CommentAuthor {
  username: string
  display_name: string | null
  avatar_url: string | null
  kanji_char: string | null
}

interface CommentData {
  id: number
  post_id: number
  user_id: string
  content: string
  created_at: string
  author: CommentAuthor | null
}

interface CommentSectionProps {
  postId: number
  initialComments: CommentData[]
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

  if (diffSec < 60) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}d`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CommentSection({ postId, initialComments, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !currentUserId || isSubmitting) return

    setIsSubmitting(true)

    try {
      // Post comment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('comments') as any)
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Fetch user info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, selected_kanji_id')
        .eq('id', currentUserId)
        .single()

      let kanjiChar: string | null = null
      if (profileData?.selected_kanji_id) {
        const { data: kanjiData } = await supabase
          .from('kanjis')
          .select('char')
          .eq('id', profileData.selected_kanji_id)
          .single()
        kanjiChar = kanjiData?.char || null
      }

      const newCommentData: CommentData = {
        ...data,
        author: profileData ? {
          username: profileData.username,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          kanji_char: kanjiChar,
        } : null,
      }

      setComments([...comments, newCommentData])
      setNewComment('')
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm">
      {/* Comment list */}
      <div className="divide-y divide-sakura/10">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="p-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.author?.username ? (
                    <Link href={`/profile/${comment.author.username}`} className="block">
                      {comment.author.avatar_url ? (
                        <Image
                          src={comment.author.avatar_url}
                          alt={comment.author.display_name || comment.author.username}
                          width={36}
                          height={36}
                          className="rounded-full object-cover ring-2 ring-sakura/20"
                        />
                      ) : comment.author.kanji_char ? (
                        <div className="w-9 h-9 bg-sakura/10 flex items-center justify-center rounded-full ring-2 ring-sakura/20">
                          <span className="font-serif text-sm text-sakura-dark">{comment.author.kanji_char}</span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 bg-sakura/10 flex items-center justify-center rounded-full">
                          <User className="w-4 h-4 text-sakura" />
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="w-9 h-9 bg-sakura/10 flex items-center justify-center rounded-full">
                      <User className="w-4 h-4 text-sakura" />
                    </div>
                  )}
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.author?.username ? (
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="font-bold text-sm text-foreground hover:underline truncate"
                      >
                        {comment.author.display_name || comment.author.username}
                      </Link>
                    ) : (
                      <span className="font-medium text-sm text-muted">Anonymous</span>
                    )}
                    <span className="text-muted text-xs">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <p className="text-foreground text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Kanji */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 border-2 border-sakura/20 flex items-center justify-center bg-sakura/5 rounded-lg">
                    <span className="font-serif text-lg text-sakura-dark">
                      {comment.author?.kanji_char || '?'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted text-sm">
            No comments yet
          </div>
        )}
      </div>

      {/* Comment input form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-sakura/20">
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-3 border-2 border-sakura/20 rounded-xl resize-none focus:outline-none focus:border-sakura text-sm bg-white/80"
              rows={2}
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 bg-sakura text-white rounded-xl hover:bg-sakura-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted mt-2">{newComment.length}/300</p>
        </form>
      ) : (
        <div className="p-4 border-t border-sakura/20 text-center">
          <p className="text-sm text-muted">
            <Link href="/login" className="text-sakura-dark font-medium hover:underline">
              Login
            </Link>
            {' '}to leave a comment
          </p>
        </div>
      )}
    </div>
  )
}
