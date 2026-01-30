'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, PenSquare, LogOut, User, Settings, Home, Menu, X, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Kanji } from '@/types/database'
import { useState } from 'react'

interface HeaderProps {
  user: {
    id: string
    email: string
  } | null
  profile: (Profile & { kanjis: Kanji | null }) | null
}

export default function Header({ user, profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="glass sticky top-0 z-50 border-b border-sakura/20">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-sakura to-sakura-dark rounded-xl flex items-center justify-center shadow-sakura group-hover:scale-105 transition-transform">
            <span className="font-serif text-xl text-white">漢</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-bold text-lg">
              <span className="text-sakura-dark">Kanji</span>
              <span className="text-foreground"> Daisuki</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Timeline - shown for everyone */}
          <Link
            href="/timeline"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive('/timeline')
                ? 'bg-sakura/20 text-sakura-dark'
                : 'text-muted hover:text-foreground hover:bg-sakura/10'
            }`}
          >
            Timeline
          </Link>

          {/* Browse Kanji - shown for everyone */}
          <Link
            href="/search"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive('/search')
                ? 'bg-sakura/20 text-sakura-dark'
                : 'text-muted hover:text-foreground hover:bg-sakura/10'
            }`}
          >
            Browse Kanji
          </Link>

          {user ? (
            <>
              {/* Post - logged in only */}
              <Link
                href="/post"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive('/post')
                    ? 'bg-sakura/20 text-sakura-dark'
                    : 'text-muted hover:text-foreground hover:bg-sakura/10'
                }`}
              >
                Post
              </Link>

              {/* Admin - admin only */}
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-red-100 text-red-700'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  Admin
                </Link>
              )}

              {/* Profile icon */}
              <Link
                href={profile?.username ? `/profile/${profile.username}` : '/settings'}
                className="btn-ghost p-2.5 rounded-xl ml-2"
                title="Profile"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Profile"
                    width={28}
                    height={28}
                    className="rounded-full object-cover ring-2 ring-sakura/30"
                  />
                ) : profile?.kanjis?.char ? (
                  <div className="w-7 h-7 bg-sakura/20 rounded-full flex items-center justify-center">
                    <span className="font-serif text-sm font-bold text-sakura-dark">{profile.kanjis.char}</span>
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className="btn-ghost p-2.5 rounded-xl"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn-ghost p-2.5 rounded-xl text-muted hover:text-accent"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-sm font-medium text-muted hover:text-foreground hover:bg-sakura/10 transition-colors"
              >
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-5">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden btn-ghost p-2 rounded-xl"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-sakura/20 px-4 py-4 space-y-2">
          <Link
            href="/timeline"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isActive('/timeline')
                ? 'bg-sakura/20 text-sakura-dark'
                : 'text-foreground hover:bg-sakura/10'
            }`}
          >
            <Home className="w-5 h-5" />
            Timeline
          </Link>

          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isActive('/search')
                ? 'bg-sakura/20 text-sakura-dark'
                : 'text-foreground hover:bg-sakura/10'
            }`}
          >
            <Search className="w-5 h-5" />
            Browse Kanji
          </Link>

          {user ? (
            <>
              <Link
                href="/post"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/post')
                    ? 'bg-sakura/20 text-sakura-dark'
                    : 'text-foreground hover:bg-sakura/10'
                }`}
              >
                <PenSquare className="w-5 h-5" />
                Post
              </Link>

              {/* Admin - admin only */}
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive('/admin')
                      ? 'bg-red-100 text-red-700'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </Link>
              )}

              <Link
                href={profile?.username ? `/profile/${profile.username}` : '/settings'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-sakura/10 transition-colors"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>

              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/settings')
                    ? 'bg-sakura/20 text-sakura-dark'
                    : 'text-foreground hover:bg-sakura/10'
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-accent hover:bg-accent/10 w-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-sakura/10 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center py-3"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
