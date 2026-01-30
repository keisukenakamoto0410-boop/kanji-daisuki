import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Profile, Kanji } from '@/types/database'
import SettingsForm from './SettingsForm'

type ProfileWithKanji = Profile & { kanjis: Kanji | null }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileResult } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let profileData = profileResult as Profile | null

  // プロフィールがない場合は作成
  if (!profileData) {
    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .insert({
        id: user.id,
        username: username,
      })

    const { data: newData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profileData = newData as Profile | null
  }

  // 漢字情報を別途取得
  let kanjiData: Kanji | null = null
  if (profileData?.selected_kanji_id) {
    const { data: kanji } = await supabase
      .from('kanjis')
      .select('*')
      .eq('id', profileData.selected_kanji_id)
      .single()
    kanjiData = kanji as Kanji | null
  }

  const profile: ProfileWithKanji | null = profileData ? { ...profileData, kanjis: kanjiData } : null

  if (!profile) {
    // それでもプロフィールがない場合（DBエラーなど）
    redirect('/')
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="p-4 glass border-b border-sakura/20 sticky top-16 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-sakura/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold font-display">Settings</h1>
        </div>
      </header>

      <div className="p-6">
        <SettingsForm profile={profile} />
      </div>
    </div>
  )
}
