import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Settings, Calendar, User, Globe, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PostCardClient from '@/components/PostCardClient'
import { Profile, Kanji, KanjiSelection, Post } from '@/types/database'

const COUNTRY_LABELS: Record<string, string> = {
  japan: 'Japan',
  usa: 'United States',
  china: 'China',
  korea: 'South Korea',
  taiwan: 'Taiwan',
  uk: 'United Kingdom',
  france: 'France',
  germany: 'Germany',
  brazil: 'Brazil',
  canada: 'Canada',
  australia: 'Australia',
  other: 'Other',
}

const AGE_GROUP_LABELS: Record<string, string> = {
  '10s': '10s',
  '20s': '20s',
  '30s': '30s',
  '40s': '40s',
  '50+': '50+',
}

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

type ProfileWithKanji = Profile & {
  kanjis: Kanji | null
  kanji_selections: KanjiSelection[]
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

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profileResult } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profileResult) {
    notFound()
  }

  const profile = profileResult as Profile

  // Fetch kanji info
  let kanjiData: Kanji | null = null
  if (profile.selected_kanji_id) {
    const { data: kanji } = await supabase
      .from('kanjis')
      .select('*')
      .eq('id', profile.selected_kanji_id)
      .single()
    kanjiData = kanji as Kanji | null
  }

  // Fetch kanji selection history
  const { data: kanjiSelectionsResult } = await supabase
    .from('kanji_selections')
    .select('*')
    .eq('user_id', profile.id)

  const kanjiSelections = (kanjiSelectionsResult || []) as KanjiSelection[]

  const profileData: ProfileWithKanji = {
    ...profile,
    kanjis: kanjiData,
    kanji_selections: kanjiSelections,
  }

  const isOwnProfile = user?.id === profileData.id

  // Fetch user's posts
  const { data: postsResult } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profileData.id)
    .order('created_at', { ascending: false })

  const posts = (postsResult || []) as Post[]

  // Add author info to posts
  let postsWithAuthor: PostWithAuthor[] = posts.map(post => ({
    ...post,
    author: {
      username: profileData.username,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      selected_kanji_id: profileData.selected_kanji_id,
      kanji_char: profileData.kanjis?.char || null,
    }
  }))

  // Add like info if logged in
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

  const kanjiChar = profileData.kanjis?.char || '?'
  const activeSelection = profileData.kanji_selections?.find((s) => s.is_active)
  const joinDate = new Date(profileData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <section className="p-6 bg-white/90 backdrop-blur-sm rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar or Kanji */}
            {profileData.avatar_url ? (
              <Image
                src={profileData.avatar_url}
                alt={profileData.display_name || profileData.username}
                width={88}
                height={88}
                className="rounded-full object-cover ring-4 ring-sakura/20"
              />
            ) : (
              <div className="w-22 h-22 bg-sakura/10 flex items-center justify-center rounded-full ring-4 ring-sakura/20">
                {kanjiChar !== '?' ? (
                  <span className="font-serif text-5xl text-sakura-dark">{kanjiChar}</span>
                ) : (
                  <User className="w-12 h-12 text-sakura" />
                )}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold font-display">
                {profileData.display_name || profileData.username}
              </h1>
              <p className="text-muted">@{profileData.username}</p>
            </div>
          </div>

          {isOwnProfile && (
            <Link href="/settings" className="btn-secondary text-sm py-2 px-4">
              <Settings className="w-4 h-4 inline mr-1" />
              Settings
            </Link>
          )}
        </div>

        {profileData.bio && (
          <p className="mb-4 whitespace-pre-wrap text-foreground">{profileData.bio}</p>
        )}

        {/* Kanji info */}
        {profileData.kanjis && (
          <div className="card p-4 mb-4 bg-sakura/5 border-sakura/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-sakura/20 rounded-xl flex items-center justify-center">
                <span className="font-serif text-4xl text-sakura-dark">{kanjiChar}</span>
              </div>
              <div>
                <p className="font-bold text-lg">{profileData.kanjis.meaning_en}</p>
                <p className="text-sm text-muted">
                  {profileData.kanjis.reading_kun || profileData.kanjis.reading_on}
                </p>
              </div>
            </div>
            {activeSelection?.reason && (
              <p className="mt-3 text-sm text-muted italic">
                &ldquo;{activeSelection.reason}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <span className="font-medium">{postsWithAuthor.length} posts</span>
          {profileData.country && (
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {COUNTRY_LABELS[profileData.country] || profileData.country}
            </span>
          )}
          {profileData.age_group && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {AGE_GROUP_LABELS[profileData.age_group] || profileData.age_group}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {joinDate}
          </span>
        </div>
      </section>

      {/* Posts */}
      <section className="mt-4 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sakura/10">
          <h2 className="font-bold text-lg">Posts</h2>
        </div>
        {postsWithAuthor.length > 0 ? (
          postsWithAuthor.map((post) => (
            <PostCardClient
              key={post.id}
              post={post}
              currentUserId={user?.id}
            />
          ))
        ) : (
          <div className="p-8 text-center text-muted">
            No posts yet
          </div>
        )}
      </section>
    </div>
  )
}
