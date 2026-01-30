import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import { Profile, Post } from '@/types/database'

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

  const users = (usersData || []) as Profile[]

  // Fetch all posts with author info
  const { data: postsData } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const posts = (postsData || []) as Post[]

  // Get author info for posts
  const userIds = Array.from(new Set(posts.map(p => p.user_id)))
  let profilesMap: Record<string, { username: string; display_name: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profilesResult } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds)

    if (profilesResult) {
      const profiles = profilesResult as { id: string; username: string; display_name: string | null }[]
      profilesMap = Object.fromEntries(
        profiles.map(p => [p.id, { username: p.username, display_name: p.display_name }])
      )
    }
  }

  const postsWithAuthor = posts.map(post => ({
    ...post,
    author: profilesMap[post.user_id] || null
  }))

  // Stats
  const totalUsers = users.length
  const totalPosts = posts.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8 font-display">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-6 text-center">
          <p className="text-3xl font-bold text-sakura-dark">{totalUsers}</p>
          <p className="text-muted">Total Users</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-bold text-sky-dark">{totalPosts}</p>
          <p className="text-muted">Total Posts</p>
        </div>
      </div>

      <AdminDashboard
        users={users}
        posts={postsWithAuthor}
      />
    </div>
  )
}
