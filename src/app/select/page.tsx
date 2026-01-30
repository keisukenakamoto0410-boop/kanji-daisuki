import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Kanji } from '@/types/database'
import SelectWizard from './SelectWizard'

type ProfileWithKanji = Profile & { kanjis: Kanji | null }

export default async function SelectPage() {
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

  const profileData = profileResult as Profile | null

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

  // If already paid, redirect to home
  if (profile?.is_paid) {
    redirect('/')
  }

  const { data: kanjisData } = await supabase
    .from('kanjis')
    .select('*')
    .order('id')

  const kanjis = (kanjisData || []) as Kanji[]

  return (
    <SelectWizard
      kanjis={kanjis}
      profile={profile}
      userId={user.id}
    />
  )
}
