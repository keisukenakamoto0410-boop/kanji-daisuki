'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ImagePlus, X, AlertCircle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Kanji } from '@/types/database'
import { isJapaneseOnly, getInvalidCharacters } from '@/utils/japanese'

interface PostFormProps {
  profile: Profile & { kanjis: Kanji | null }
  userId: string
}

const MAX_CONTENT_LENGTH = 500
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default function PostForm({ profile, userId }: PostFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    if (value && !isJapaneseOnly(value)) {
      const invalidChars = getInvalidCharacters(value)
      setValidationError(
        `Japanese only! Invalid characters: ${invalidChars.join(', ')}`
      )
    } else {
      setValidationError('')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, GIF, WebP images are allowed')
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must be under 5MB')
      return
    }

    setImage(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Please enter your post content')
      return
    }

    if (!isJapaneseOnly(content)) {
      setError('Posts must be written in Japanese only')
      return
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`Post must be under ${MAX_CONTENT_LENGTH} characters`)
      return
    }

    setIsLoading(true)

    try {
      let imageUrl: string | null = null

      // Upload image if selected
      if (image) {
        const timestamp = Date.now()
        const fileExt = image.name.split('.').pop()
        const filePath = `${userId}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, image)

        if (uploadError) {
          throw new Error('Failed to upload image')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // Create post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: postError } = await (supabase.from('posts') as any).insert({
        user_id: userId,
        content: content.trim(),
        image_url: imageUrl,
      })

      if (postError) throw postError

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const kanjiChar = profile.kanjis?.char || '?'
  const remainingChars = MAX_CONTENT_LENGTH - content.length
  const isOverLimit = remainingChars < 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Posting Rules */}
      <div className="card p-4 bg-sky/10 border-sky/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-sky/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-sky-dark" />
          </div>
          <div className="text-sm">
            <p className="font-bold text-sky-dark mb-2">Posting Rules</p>
            <ul className="space-y-1 text-muted">
              <li>Write your posts in Japanese only</li>
              <li>Japan-related content is welcome!</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-accent/10 border-accent/30 text-accent text-sm">
          {error}
        </div>
      )}

      {/* Post composer */}
      <div className="card p-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-sakura/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-2xl text-sakura-dark">{kanjiChar}</span>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Write in Japanese..."
              className="w-full min-h-[150px] resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-lg placeholder:text-muted/50"
              autoFocus
            />

            {validationError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-accent">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </div>
            )}

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-4 inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="max-h-60 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleImageSelect}
              className="hidden"
              id="image-input"
            />
            <label
              htmlFor="image-input"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-sakura-dark hover:bg-sakura/10 rounded-lg cursor-pointer transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span>Add Image</span>
            </label>
          </div>

          <span
            className={`text-sm font-medium ${
              isOverLimit ? 'text-accent' : remainingChars < 50 ? 'text-yellow-500' : 'text-muted'
            }`}
          >
            {content.length}/{MAX_CONTENT_LENGTH}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          isLoading ||
          !content.trim() ||
          isOverLimit ||
          !!validationError
        }
        className="btn-primary w-full text-lg py-4"
      >
        {isLoading ? 'Posting...' : 'Post'}
      </button>
    </form>
  )
}
