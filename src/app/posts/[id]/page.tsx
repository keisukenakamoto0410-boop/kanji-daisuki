import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import PostDetailClient from './PostDetailClient'
import CommentSection from '@/components/CommentSection'
import { Post, Profile, Kanji, Comment } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

interface PostWithAuthor extends Post {
  user_has_liked?: boolean
  author?: {
    username: string
    display_name: string | null
    avatar_url: string | null
    selected_kanji_id: number | null
    kanji_char?: string | null
  } | null
}

interface CommentAuthor {
  username: string
  display_name: string | null
  avatar_url: string | null
  kanji_char: string | null
}

interface CommentWithAuthor extends Comment {
  author: CommentAuthor | null
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 投稿を取得
  const { data: postData, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !postData) {
    notFound()
  }

  const post = postData as Post

  // 投稿者情報を取得
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', post.user_id)
    .single()

  const profile = profileData as Profile | null

  // 投稿者の漢字情報を取得
  let kanjiChar: string | null = null
  if (profile?.selected_kanji_id) {
    const { data: kanjiData } = await supabase
      .from('kanjis')
      .select('*')
      .eq('id', profile.selected_kanji_id)
      .single()

    const kanji = kanjiData as Kanji | null
    kanjiChar = kanji?.char || null
  }

  // ユーザーがいいね済みか確認
  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .single()

    userHasLiked = !!like
  }

  // コメントを取得
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const comments = (commentsData || []) as Comment[]

  // コメント投稿者のIDを取得
  const commentUserIds = Array.from(new Set(comments.map(c => c.user_id)))

  // コメント投稿者情報を取得
  type CommentProfile = { id: string; username: string; display_name: string | null; avatar_url: string | null; selected_kanji_id: number | null }
  let commentProfilesMap: Record<string, CommentProfile> = {}
  if (commentUserIds.length > 0) {
    const { data: commentProfiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, selected_kanji_id')
      .in('id', commentUserIds)

    if (commentProfiles) {
      const profiles = commentProfiles as CommentProfile[]
      commentProfilesMap = Object.fromEntries(
        profiles.map(p => [p.id, p])
      )
    }
  }

  // 漢字情報を取得
  const kanjiIds = Object.values(commentProfilesMap)
    .map(p => p.selected_kanji_id)
    .filter((id): id is number => id !== null)

  let kanjisMap: Record<number, string> = {}
  if (kanjiIds.length > 0) {
    const { data: kanjisData } = await supabase
      .from('kanjis')
      .select('id, char')
      .in('id', kanjiIds)

    if (kanjisData) {
      const kanjis = kanjisData as { id: number; char: string }[]
      kanjisMap = Object.fromEntries(
        kanjis.map(k => [k.id, k.char])
      )
    }
  }

  // コメントに著者情報を追加
  const commentsWithAuthor: CommentWithAuthor[] = comments.map(comment => ({
    ...comment,
    author: commentProfilesMap[comment.user_id] ? {
      username: commentProfilesMap[comment.user_id].username,
      display_name: commentProfilesMap[comment.user_id].display_name,
      avatar_url: commentProfilesMap[comment.user_id].avatar_url,
      kanji_char: commentProfilesMap[comment.user_id].selected_kanji_id
        ? kanjisMap[commentProfilesMap[comment.user_id].selected_kanji_id!] || null
        : null,
    } : null,
  }))

  const postWithAuthor: PostWithAuthor = {
    ...post,
    user_has_liked: userHasLiked,
    author: profile ? {
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      selected_kanji_id: profile.selected_kanji_id,
      kanji_char: kanjiChar,
    } : null,
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="p-4 border-b border-sakura/20 glass sticky top-14 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-sakura/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-display">Post</h1>
        </div>
      </header>

      {/* Post detail */}
      <PostDetailClient
        post={postWithAuthor}
        currentUserId={user?.id}
      />

      {/* Comment section */}
      <section className="border-t border-sakura/20">
        <div className="p-4 bg-sakura/5 border-b border-sakura/20">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sakura" />
            Comments ({commentsWithAuthor.length})
          </h2>
        </div>
        <CommentSection
          postId={post.id}
          initialComments={commentsWithAuthor}
          currentUserId={user?.id}
        />
      </section>
    </div>
  )
}
