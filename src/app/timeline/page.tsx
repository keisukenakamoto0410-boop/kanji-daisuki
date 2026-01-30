import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Profile, Kanji, Post } from '@/types/database'
import PostCardClient from '@/components/PostCardClient'
import { PenLine, Sparkles } from 'lucide-react'

export const revalidate = 0

type ProfileWithKanji = Profile & { kanjis: Kanji | null }

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

export default async function TimelinePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile: ProfileWithKanji | null = null
  if (user) {
    const { data: profileResult } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const profileData = profileResult as Profile | null

    if (profileData) {
      let kanjiData: Kanji | null = null
      if (profileData.selected_kanji_id) {
        const { data: kanji } = await supabase
          .from('kanjis')
          .select('*')
          .eq('id', profileData.selected_kanji_id)
          .single()
        kanjiData = kanji as Kanji | null
      }
      profile = { ...profileData, kanjis: kanjiData }
    }
  }

  // Fetch posts
  const { data: postsData } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (postsData || []) as Post[]

  // Get user IDs
  const userIds = Array.from(new Set(posts.map(p => p.user_id)))

  // Fetch author info
  type ProfileWithKanjiChar = Profile & { kanji_char: string | null }
  let profilesMap: Record<string, ProfileWithKanjiChar> = {}
  if (userIds.length > 0) {
    const { data: profilesResult } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profiles = (profilesResult || []) as Profile[]

    if (profiles.length > 0) {
      const kanjiIds = profiles
        .map(p => p.selected_kanji_id)
        .filter((id): id is number => id !== null)

      let kanjisMap: Record<number, Kanji> = {}
      if (kanjiIds.length > 0) {
        const { data: kanjisResult } = await supabase
          .from('kanjis')
          .select('*')
          .in('id', kanjiIds)

        const fetchedKanjis = (kanjisResult || []) as Kanji[]
        kanjisMap = Object.fromEntries(
          fetchedKanjis.map(k => [k.id, k])
        )
      }

      profilesMap = Object.fromEntries(
        profiles.map(p => [
          p.id,
          {
            ...p,
            kanji_char: p.selected_kanji_id ? kanjisMap[p.selected_kanji_id]?.char || null : null
          }
        ])
      )
    }
  }

  let postsWithAuthor: PostWithAuthor[] = posts.map(post => ({
    ...post,
    author: profilesMap[post.user_id] ? {
      username: profilesMap[post.user_id].username,
      display_name: profilesMap[post.user_id].display_name,
      avatar_url: profilesMap[post.user_id].avatar_url,
      selected_kanji_id: profilesMap[post.user_id].selected_kanji_id,
      kanji_char: profilesMap[post.user_id].kanji_char,
    } : null
  }))

  if (user && posts.length > 0) {
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)

    const likedPostIds = new Set((likes || []).map((l: { post_id: number }) => l.post_id))

    postsWithAuthor = postsWithAuthor.map(post => ({
      ...post,
      user_has_liked: likedPostIds.has(post.id),
    }))
  }

  const isLoggedIn = !!user
  const hasKanji = !!profile?.selected_kanji_id

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-4 glass sticky top-14 z-40 border-b border-sakura/20">
        <h1 className="text-2xl font-bold font-display">Timeline</h1>
        <p className="text-sm text-muted">See what the community is sharing</p>
      </div>

      {/* CTA for non-logged in users */}
      {!isLoggedIn && (
        <section className="p-8 bg-gradient-to-r from-sakura/20 to-sky/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-sakura/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-sakura-dark" />
            </div>
            <h2 className="text-xl font-bold mb-2">Join the Community!</h2>
            <p className="text-muted mb-6">
              Sign up to post, like, and comment
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/signup" className="btn-primary">
                Sign Up
              </Link>
              <Link href="/login" className="btn-secondary">
                Login
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA for logged in users without kanji */}
      {isLoggedIn && !hasKanji && (
        <section className="p-8 bg-gradient-to-r from-sakura/20 to-sky/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-sakura/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-sakura-dark" />
            </div>
            <h2 className="text-xl font-bold mb-2">Welcome to Kanji Daisuki!</h2>
            <p className="text-muted mb-6">
              First, choose your favorite kanji to get started
            </p>
            <Link href="/select" className="btn-primary">
              Choose Your Kanji
            </Link>
          </div>
        </section>
      )}

      {/* Post CTA for users with kanji */}
      {isLoggedIn && hasKanji && (
        <section className="p-6 bg-white/80 backdrop-blur-sm border-b border-sakura/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sakura/20 rounded-xl flex items-center justify-center">
                <span className="font-serif text-2xl text-sakura-dark">{profile?.kanjis?.char}</span>
              </div>
              <div>
                <p className="font-medium">Ready to share?</p>
                <p className="text-sm text-muted">Post in Japanese</p>
              </div>
            </div>
            <Link href="/post" className="btn-primary py-2 px-6">
              Post
            </Link>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="px-4 py-4">
        {postsWithAuthor.length > 0 ? (
          <div className="space-y-4">
            {postsWithAuthor.map((post) => (
              <PostCardClient
                key={post.id}
                post={post}
                currentUserId={user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-sakura/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PenLine className="w-8 h-8 text-sakura-dark" />
            </div>
            <p className="text-muted mb-4">No posts yet</p>
            {isLoggedIn && hasKanji && (
              <Link href="/post" className="btn-primary">
                Create First Post
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
