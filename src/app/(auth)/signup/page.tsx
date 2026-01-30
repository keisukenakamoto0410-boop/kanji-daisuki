'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters'
    }
    if (value.length > 20) {
      return 'Username must be 20 characters or less'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        setError('This username is already taken')
        setIsLoading(false)
        return
      }

      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      })

      if (signUpError) {
        console.error('SignUp Error:', signUpError)
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered')
        } else if (signUpError.message.includes('rate limit')) {
          setError('Please wait a moment and try again')
        } else {
          setError(`Registration failed: ${signUpError.message}`)
        }
        return
      }

      console.log('SignUp Success:', signUpData)

      // Check if user was created
      if (!signUpData.user) {
        setError('Failed to create user')
        return
      }

      // Wait a bit for trigger to process
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if profile was created
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signUpData.user.id)
        .single()

      if (!existingProfile) {
        // If not created by trigger, create manually
        console.log('Profile not found, creating manually...')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: profileError } = await (supabase.from('profiles') as any)
          .insert({
            id: signUpData.user.id,
            username: username,
            display_name: username,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Ignore duplicate key error (may have been created by race condition)
          if (!profileError.message?.includes('duplicate')) {
            setError(`Failed to create profile: ${profileError.message}`)
            return
          }
        }
      } else {
        console.log('Profile already created by trigger')
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-sakura to-sakura-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sakura">
            <span className="font-serif text-4xl text-white">漢</span>
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">Join Kanji Daisuki!</h1>
          <p className="text-muted">Create your account and pick your kanji</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="3-20 characters, letters, numbers, _"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="At least 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-sakura/10 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-lg py-4"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-sakura-dark font-medium hover:underline">
            Login
          </Link>
        </p>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-sakura-dark transition-colors">
            <Sparkles className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
