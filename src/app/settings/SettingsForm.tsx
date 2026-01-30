'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, User, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Kanji } from '@/types/database'

interface SettingsFormProps {
  profile: Profile & { kanjis: Kanji | null }
}

const MAX_BIO_LENGTH = 200

const COUNTRIES = [
  { value: '', label: 'Select Country' },
  { value: 'japan', label: 'Japan' },
  { value: 'usa', label: 'United States' },
  { value: 'china', label: 'China' },
  { value: 'korea', label: 'South Korea' },
  { value: 'taiwan', label: 'Taiwan' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'france', label: 'France' },
  { value: 'germany', label: 'Germany' },
  { value: 'brazil', label: 'Brazil' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
  { value: 'other', label: 'Other' },
]

const AGE_GROUPS = [
  { value: '', label: 'Select Age' },
  { value: '10s', label: '10s' },
  { value: '20s', label: '20s' },
  { value: '30s', label: '30s' },
  { value: '40s', label: '40s' },
  { value: '50+', label: '50+' },
]

export default function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [country, setCountry] = useState(profile.country || '')
  const [ageGroup, setAgeGroup] = useState(profile.age_group || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // File size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    // Image type check
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
    setError('')
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl

    setIsUploading(true)
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') ||
            uploadError.message?.includes('bucket') ||
            uploadError.statusCode === '404') {
          console.error('Avatar bucket not found:', uploadError)
          throw new Error('Avatar upload failed. Please check storage settings.')
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Avatar upload error:', err)
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be under ${MAX_BIO_LENGTH} characters`)
      return
    }

    setIsLoading(true)

    try {
      // Upload avatar (only if file is selected)
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        try {
          newAvatarUrl = await uploadAvatar() || avatarUrl
        } catch (uploadErr) {
          console.error('Avatar upload failed, continuing with profile update:', uploadErr)
          setError('Avatar upload failed, but other settings will be updated.')
        }
      }

      // Prepare update data
      const updateData: {
        display_name: string | null
        bio: string | null
        avatar_url: string | null
        country: string | null
        age_group: string | null
      } = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: newAvatarUrl || null,
        country: country || null,
        age_group: ageGroup || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', profile.id)
        .select()

      if (updateError) {
        console.error('Profile update error details:', JSON.stringify(updateError, null, 2))
        throw updateError
      }

      setAvatarUrl(newAvatarUrl || '')
      setAvatarPreview(null)
      setAvatarFile(null)
      setSuccess(true)
      setError('')
      router.refresh()
    } catch (err) {
      console.error('Profile update failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="card p-4 bg-accent/10 border-accent/30 text-accent text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="card p-4 bg-matcha/10 border-matcha/30 text-matcha-dark text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Profile updated successfully!
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-sakura/30 hover:border-sakura transition-colors group shadow-lg"
        >
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : profile.kanjis?.char ? (
            <div className="w-full h-full flex items-center justify-center bg-sakura/10">
              <span className="font-serif text-5xl text-sakura-dark">{profile.kanjis.char}</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-sakura/10">
              <User className="w-12 h-12 text-sakura" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-xs text-muted mt-3">Click to change avatar</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2 text-muted">
            Username (cannot be changed)
          </label>
          <input
            id="username"
            type="text"
            value={profile.username}
            className="input bg-gray-100 cursor-not-allowed opacity-60"
            disabled
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Enter your display name"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[100px] resize-none"
            placeholder="Tell us about yourself"
          />
          <p className={`text-xs mt-1 ${bio.length > MAX_BIO_LENGTH ? 'text-accent' : 'text-muted'}`}>
            {bio.length}/{MAX_BIO_LENGTH} characters
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-2">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input"
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium mb-2">
              Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="input"
            >
              {AGE_GROUPS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanji Selection */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-3 text-muted">
          Selected Kanji
        </label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile.kanjis ? (
              <>
                <div className="w-16 h-16 bg-sakura/20 rounded-xl flex items-center justify-center">
                  <span className="font-serif text-4xl text-sakura-dark">{profile.kanjis.char}</span>
                </div>
                <div>
                  <p className="font-bold text-lg">{profile.kanjis.meaning_en}</p>
                  <p className="text-sm text-muted">
                    {profile.kanjis.reading_kun || profile.kanjis.reading_on}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted">No kanji selected</p>
            )}
          </div>
          <Link href="/select" className="btn-secondary text-sm py-2 px-4">
            {profile.kanjis ? 'Change' : 'Choose Kanji'}
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || isUploading}
        className="btn-primary w-full"
      >
        {isLoading || isUploading ? 'Saving...' : 'Save Changes'}
      </button>

      <Link
        href={`/profile/${profile.username}`}
        className="btn-secondary w-full text-center block"
      >
        View Profile
      </Link>
    </form>
  )
}
