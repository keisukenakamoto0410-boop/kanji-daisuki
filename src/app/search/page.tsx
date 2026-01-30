import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'

export default async function SearchPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: kanjis } = await supabase
    .from('kanjis')
    .select('*')
    .order('id')

  return <SearchClient kanjis={kanjis || []} isLoggedIn={!!user} />
}
