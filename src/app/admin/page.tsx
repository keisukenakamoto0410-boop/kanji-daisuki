import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import { Profile, Post, Comment, Kanji } from '@/types/database'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile as { is_admin: boolean } | null)?.is_admin || false

  if (!isAdmin) {
    redirect('/')
  }

  // Fetch all users
  const { data: usersData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const profiles = (usersData || []) as Profile[]

  // Fetch kanjis for users who have selected one
  const kanjiIds = profiles
    .map(p => p.selected_kanji_id)
    .filter((id): id is number => id !== null)

  let kanjisMap: Record<number, Kanji> = {}
  if (kanjiIds.length > 0) {
    const { data: kanjisData } = await supabase
      .from('kanjis')
      .select('*')
      .in('id', kanjiIds)

    if (kanjisData) {
      kanjisMap = Object.fromEntries(
        (kanjisData as Kanji[]).map(k => [k.id, k])
      )
    }
  }

  // Combine profiles with kanjis
  const users = profiles.map(profile => ({
    ...profile,
    kanjis: profile.selected_kanji_id ? kanjisMap[profile.selected_kanji_id] || null : null
  })) as (Profile & { kanjis: Kanji | null })[]

  // Fetch all posts
  const { data: postsData } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const posts = (postsData || []) as Post[]

  // Fetch all comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })

  const comments = (commentsData || []) as Comment[]

  // Get all user IDs from posts and comments
  const postUserIds = posts.map(p => p.user_id)
  const commentUserIds = comments.map(c => c.user_id)
  const allUserIds = Array.from(new Set([...postUserIds, ...commentUserIds]))

  let profilesMap: Record<string, { username: string; display_name: string | null }> = {}

  if (allUserIds.length > 0) {
    const { data: profilesResult } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', allUserIds)

    if (profilesResult) {
      const profiles = profilesResult as { id: string; username: string; display_name: string | null }[]
      profilesMap = Object.fromEntries(
        profiles.map(p => [p.id, { username: p.username, display_name: p.display_name }])
      )
    }
  }

  // Map posts with author
  const postsWithAuthor = posts.map(post => ({
    ...post,
    author: profilesMap[post.user_id] || null
  }))

  // Map comments with author and post info
  const postTitlesMap: Record<number, string> = {}
  posts.forEach(p => {
    postTitlesMap[p.id] = p.content.substring(0, 30) + (p.content.length > 30 ? '...' : '')
  })

  const commentsWithInfo = comments.map(comment => ({
    ...comment,
    author: profilesMap[comment.user_id] || null,
    postPreview: postTitlesMap[comment.post_id] || 'Deleted Post'
  }))

  // Stats
  const totalUsers = users.length
  const totalPosts = posts.length
  const totalComments = comments.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8 font-display">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-6 text-center">
          <p className="text-3xl font-bold text-sakura-dark">{totalUsers}</p>
          <p className="text-muted">Users</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-bold text-sky-dark">{totalPosts}</p>
          <p className="text-muted">Posts</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{totalComments}</p>
          <p className="text-muted">Comments</p>
        </div>
      </div>

      <AdminDashboard
        users={users}
        posts={postsWithAuthor}
        comments={commentsWithInfo}
      />
    </div>
  )
}
