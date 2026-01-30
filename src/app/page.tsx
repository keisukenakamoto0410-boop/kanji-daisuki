import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Profile, Kanji } from '@/types/database'
import { Check, Sparkles, Heart, School, Server, Users } from 'lucide-react'

export const revalidate = 0

// Floating kanji for the hero section - colorful cute style with pastel colors
const FLOATING_KANJI = [
  // Large kanji
  { char: '愛', top: '8%', left: '5%', delay: '0s', size: 'text-8xl', color: '#FFB7C5', animation: 'floating-kanji' },        // Pink - love
  { char: '夢', top: '15%', right: '8%', delay: '1.2s', size: 'text-7xl', color: '#DDA0DD', animation: 'floating-kanji-wobble' },  // Purple - dream
  { char: '花', top: '25%', right: '3%', delay: '3s', size: 'text-8xl', color: '#FFB347', animation: 'floating-kanji-sway' },      // Orange - flower

  // Medium kanji
  { char: '心', top: '35%', left: '6%', delay: '1.8s', size: 'text-6xl', color: '#FF6B6B', animation: 'floating-kanji-wobble' },   // Red - heart
  { char: '空', top: '12%', left: '22%', delay: '2.1s', size: 'text-6xl', color: '#87CEEB', animation: 'floating-kanji' },        // Sky blue - sky
  { char: '月', top: '75%', right: '6%', delay: '2.7s', size: 'text-6xl', color: '#FFD700', animation: 'floating-kanji-sway' },   // Gold - moon
  { char: '星', top: '60%', left: '4%', delay: '0.9s', size: 'text-6xl', color: '#F0E68C', animation: 'floating-kanji-roll' },    // Golden yellow - star
  { char: '海', top: '45%', right: '12%', delay: '1.5s', size: 'text-6xl', color: '#40E0D0', animation: 'floating-kanji' },       // Turquoise - sea

  // Small kanji
  { char: '桜', top: '55%', left: '15%', delay: '2.4s', size: 'text-5xl', color: '#FFB7C5', animation: 'floating-kanji-wobble' }, // Pink - cherry blossom
  { char: '風', top: '70%', right: '18%', delay: '0.6s', size: 'text-5xl', color: '#98D8C8', animation: 'floating-kanji-sway' },  // Mint - wind
  { char: '光', top: '80%', left: '20%', delay: '0.3s', size: 'text-5xl', color: '#FFF44F', animation: 'floating-kanji' },        // Lemon yellow - light
  { char: '雪', top: '30%', left: '28%', delay: '3.3s', size: 'text-5xl', color: '#E0FFFF', animation: 'floating-kanji-roll' },   // Light cyan - snow

  // Extra small scattered kanji
  { char: '和', top: '20%', left: '40%', delay: '0.5s', size: 'text-4xl', color: '#DDA0DD', animation: 'floating-kanji-wobble' }, // Purple - harmony
  { char: '友', top: '65%', right: '35%', delay: '1.8s', size: 'text-4xl', color: '#98FB98', animation: 'floating-kanji-sway' },  // Pale green - friend
  { char: '笑', top: '85%', left: '35%', delay: '2.5s', size: 'text-4xl', color: '#FFA07A', animation: 'floating-kanji' },        // Light salmon - smile
  { char: '春', top: '40%', left: '35%', delay: '1.0s', size: 'text-4xl', color: '#FFB7C5', animation: 'floating-kanji-roll' },   // Pink - spring
]

interface TopUser {
  username: string
  display_name: string | null
  avatar_url: string | null
  kanji_char: string | null
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch kanji stats
  const { data: kanjisData } = await supabase
    .from('kanjis')
    .select('*')
    .order('current_users', { ascending: false })

  const kanjis = (kanjisData || []) as Kanji[]
  const totalKanjis = kanjis.length
  const usedSlots = kanjis.reduce((acc, k) => acc + (k.current_users || 0), 0)
  const popularKanjis = kanjis.slice(0, 12)

  // Fetch top users (users with kanji)
  const { data: topUsersData } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, selected_kanji_id')
    .not('selected_kanji_id', 'is', null)
    .limit(6)

  const topUsersProfiles = (topUsersData || []) as Profile[]

  // Get kanji chars for top users
  let topUsers: TopUser[] = []
  if (topUsersProfiles.length > 0) {
    const kanjiIds = topUsersProfiles
      .map(p => p.selected_kanji_id)
      .filter((id): id is number => id !== null)

    let kanjisMap: Record<number, string> = {}
    if (kanjiIds.length > 0) {
      const { data: kanjisResult } = await supabase
        .from('kanjis')
        .select('id, char')
        .in('id', kanjiIds)

      if (kanjisResult) {
        kanjisMap = Object.fromEntries(
          kanjisResult.map((k: { id: number; char: string }) => [k.id, k.char])
        )
      }
    }

    topUsers = topUsersProfiles.map(p => ({
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      kanji_char: p.selected_kanji_id ? kanjisMap[p.selected_kanji_id] || null : null,
    }))
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* ============================================ */}
      {/* Section 1: Hero with Floating Kanji */}
      {/* ============================================ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Floating Kanji Background - colorful cute rounded style */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLOATING_KANJI.map((kanji, index) => (
            <div
              key={index}
              className={`absolute ${kanji.size} ${kanji.animation} select-none`}
              style={{
                top: kanji.top,
                left: 'left' in kanji ? kanji.left : undefined,
                right: 'right' in kanji ? kanji.right : undefined,
                animationDelay: kanji.delay,
                animationDuration: `${5 + index * 0.3}s`,
                color: kanji.color,
                opacity: 0.4,
                textShadow: `0 2px 10px ${kanji.color}40`,
              }}
            >
              {kanji.char}
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-amber-300 via-orange-400 to-pink-400 rounded-[2rem] shadow-2xl mb-6 transform hover:scale-105 transition-transform"
              style={{ boxShadow: '0 20px 50px rgba(255, 183, 197, 0.4)' }}
            >
              <span
                className="text-7xl text-white drop-shadow-lg"
                style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 800 }}
              >
                漢
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display tracking-tight">
            <span className="gradient-text">Kanji Daisuki</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Choose your Kanji. Post in Japanese.
            <br />
            Connect with Kanji lovers worldwide.
          </p>

          <Link href="/select" className="btn-primary text-xl px-12 py-5 inline-flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Choose Your Kanji
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-muted/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section 2: Available Kanji Slots */}
      {/* ============================================ */}
      <section className="py-24 px-4 bg-white/90">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Available Kanji Slots</h2>
            <p className="text-muted text-lg mb-8">Each kanji can only be chosen by up to 10 people!</p>

            {/* Stats */}
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-sakura/10 rounded-full">
              <Users className="w-6 h-6 text-sakura-dark" />
              <span className="text-2xl font-bold text-sakura-dark">{usedSlots}</span>
              <span className="text-muted">/</span>
              <span className="text-2xl font-bold text-foreground">{totalKanjis * 10}</span>
              <span className="text-muted">slots taken</span>
            </div>
          </div>

          {/* Popular Kanji Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
            {popularKanjis.map((kanji) => {
              const isFull = kanji.current_users >= 10
              return (
                <div
                  key={kanji.id}
                  className={`card aspect-square flex flex-col items-center justify-center p-3 transition-all ${
                    isFull ? 'opacity-50' : 'card-hover cursor-pointer'
                  }`}
                >
                  <span className="font-serif text-4xl md:text-5xl text-foreground mb-2">
                    {kanji.char}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isFull
                      ? 'bg-gray-200 text-gray-500'
                      : kanji.current_users >= 7
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-matcha/20 text-matcha-dark'
                  }`}>
                    {kanji.current_users}/10 users
                  </span>
                </div>
              )
            })}
          </div>

          <div className="text-center">
            <Link href="/search" className="btn-secondary text-lg">
              Browse All Kanji
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section 3: Pricing - FREE Campaign */}
      {/* ============================================ */}
      <section className="py-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Pricing</h2>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-matcha to-matcha-dark text-white rounded-full text-lg font-bold animate-pulse-soft">
              FREE Campaign!
            </div>
          </div>

          <div className="card p-10 relative overflow-hidden">
            {/* Badge */}
            <div className="absolute -top-1 -right-1">
              <div className="bg-accent text-white text-xs font-bold px-4 py-2 transform rotate-12 translate-x-2 -translate-y-1">
                LIMITED TIME
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl text-muted line-through">$5/month</span>
                <span className="text-6xl font-bold gradient-text">$0</span>
              </div>
              <p className="text-muted">Now completely free!</p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-10">
              <p className="font-bold text-lg mb-4">What you get for FREE:</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-matcha rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>Choose 1 Kanji as your symbol (only 10 per Kanji!)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-matcha rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>Post in Japanese</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-matcha rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>Connect with Kanji lovers worldwide</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-matcha rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>Comment and like posts</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="btn-primary w-full text-lg py-4 text-center block">
              Start for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section 4: Where Your Money Will Go */}
      {/* ============================================ */}
      <section className="py-24 px-4 bg-white/90">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Where Your Money Will Go</h2>
            <p className="text-muted text-lg">When we introduce paid plans in the future</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-8 text-center card-hover">
              <div className="w-20 h-20 bg-gradient-to-br from-sky to-sky-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sky">
                <Server className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Website Operation</h3>
              <p className="text-muted">
                Server costs, maintenance, and continuous improvement of the platform
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-20 h-20 bg-gradient-to-br from-sakura to-sakura-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sakura">
                <School className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Japanese Language Education</h3>
              <p className="text-muted">
                Donations to Japanese language schools and educational programs worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section 5: Popular Kanji Owners */}
      {/* ============================================ */}
      {topUsers.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Popular Kanji Owners</h2>
              <p className="text-muted text-lg">Meet our community members</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {topUsers.map((user, index) => (
                <Link
                  key={user.username}
                  href={`/profile/${user.username}`}
                  className="card p-6 text-center card-hover group"
                >
                  {/* Rank badge */}
                  {index < 3 && (
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}

                  {/* Kanji avatar */}
                  <div className="w-20 h-20 bg-sakura/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-sakura/30 transition-colors">
                    <span className="font-serif text-4xl text-foreground">
                      {user.kanji_char || '?'}
                    </span>
                  </div>

                  <p className="font-bold truncate">{user.display_name || user.username}</p>
                  <p className="text-sm text-muted">@{user.username}</p>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/timeline" className="btn-secondary">
                View Timeline
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* Section 6: CTA */}
      {/* ============================================ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sakura/20 via-transparent to-sky/20" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
            Ready to Choose Your Kanji?
          </h2>
          <p className="text-xl text-muted mb-10">
            Join our community of Japanese culture enthusiasts today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/select" className="btn-primary text-xl px-12 py-5">
              <Sparkles className="w-5 h-5 inline mr-2" />
              Choose Your Kanji
            </Link>
            <Link href="/timeline" className="btn-secondary text-xl px-12 py-5">
              View Timeline
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section 7: Footer */}
      {/* ============================================ */}
      <footer className="bg-foreground text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-bold mb-2 font-display">
                <span className="text-sakura">Kanji</span> Daisuki
              </h3>
              <p className="text-white/60">A community for Japanese culture lovers</p>
            </div>
            <div className="flex gap-8 text-sm text-white/60">
              <Link href="/terms" className="hover:text-sakura transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-sakura transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-sakura transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © 2026 Kanji Daisuki. Made with <Heart className="w-4 h-4 inline text-sakura" /> for Japanese learners
          </div>
        </div>
      </footer>
    </div>
  )
}
