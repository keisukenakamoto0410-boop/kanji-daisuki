import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Kanji } from '@/types/database'
import PostForm from './PostForm'

type ProfileWithKanji = Profile & { kanjis: Kanji | null }

export default async function PostPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('profiles')
    .select('*, kanjis(*)')
    .eq('id', user.id)
    .single()

  const profile = data as ProfileWithKanji | null

  // 開発中: ログイン済みなら誰でも投稿可能
  // プロフィールがない場合はデフォルト値を使用
  const defaultProfile: ProfileWithKanji = {
    id: user.id,
    username: user.email?.split('@')[0] || 'user',
    display_name: null,
    avatar_url: null,
    bio: null,
    is_paid: false,
    is_admin: false,
    selected_kanji_id: null,
    country: null,
    age_group: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    kanjis: null,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 font-display">New Post</h1>
      <PostForm profile={profile || defaultProfile} userId={user.id} />
    </div>
  )
}
