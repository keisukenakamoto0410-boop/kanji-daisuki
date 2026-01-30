'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Kanji, Profile } from '@/types/database'
import KanjiCard from '@/components/KanjiCard'

interface SelectWizardProps {
  kanjis: Kanji[]
  profile: (Profile & { kanjis: Kanji | null }) | null
  userId: string
}

type Step = 1 | 2 | 3

export default function SelectWizard({ kanjis, profile, userId }: SelectWizardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>(profile?.selected_kanji_id ? 3 : 1)
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(
    profile?.kanjis || null
  )
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKanjiSelect = (kanji: Kanji) => {
    setSelectedKanji(kanji)
    setError('')
  }

  const handleNextStep = async () => {
    if (step === 1 && selectedKanji) {
      // Verify kanji is still available
      const { data: freshKanji } = await supabase
        .from('kanjis')
        .select('*')
        .eq('id', selectedKanji.id)
        .single()

      const kanjiData = freshKanji as Kanji | null
      if (kanjiData && kanjiData.current_users >= 10) {
        setError('This kanji is no longer available. Please choose another one.')
        setSelectedKanji(null)
        return
      }

      setStep(2)
    } else if (step === 2) {
      setIsLoading(true)
      setError('')

      try {
        // Update profile with selected kanji
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('profiles') as any)
          .update({ selected_kanji_id: selectedKanji!.id })
          .eq('id', userId)

        if (updateError) throw updateError

        // Create kanji selection record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('kanji_selections') as any).insert({
          user_id: userId,
          kanji_id: selectedKanji!.id,
          reason: reason || null,
        })

        setStep(3)
      } catch {
        setError('An error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const [purchaseComplete, setPurchaseComplete] = useState(false)

  const handlePurchase = async () => {
    setIsLoading(true)
    setError('')

    try {
      // 1. Update profile (is_paid and selected_kanji_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({
          is_paid: true,
          selected_kanji_id: selectedKanji!.id
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // 2. Increment kanji current_users
      const { data: kanjiResult } = await supabase
        .from('kanjis')
        .select('current_users')
        .eq('id', selectedKanji!.id)
        .single()

      const kanjiData = kanjiResult as { current_users: number } | null
      if (kanjiData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('kanjis') as any)
          .update({ current_users: (kanjiData.current_users || 0) + 1 })
          .eq('id', selectedKanji!.id)
      }

      // 3. Update kanji selection history (set is_active to true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('kanji_selections') as any)
        .update({ is_active: true })
        .eq('user_id', userId)
        .eq('kanji_id', selectedKanji!.id)

      console.log('Purchase complete! Kanji:', selectedKanji?.char)
      setPurchaseComplete(true)

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Purchase error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all duration-300
              ${step >= s
                ? 'bg-gradient-to-br from-sakura to-sakura-dark text-white shadow-lg'
                : 'bg-sakura/10 text-sakura-dark'
              }
            `}
          >
            {step > s ? <Check className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Kanji Selection */}
      {step === 1 && (
        <div>
          <h1 className="text-3xl font-bold font-display text-center mb-2">
            Choose Your Kanji
          </h1>
          <p className="text-muted text-center mb-8">
            Select one kanji that represents you
          </p>

          {error && (
            <div className="p-4 mb-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {kanjis.map((kanji) => (
              <KanjiCard
                key={kanji.id}
                kanji={kanji}
                selected={selectedKanji?.id === kanji.id}
                onClick={() => handleKanjiSelect(kanji)}
              />
            ))}
          </div>

          {selectedKanji && (
            <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-sakura/20">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sakura/20 rounded-xl flex items-center justify-center">
                    <span className="font-serif text-3xl text-sakura-dark">{selectedKanji.char}</span>
                  </div>
                  <div>
                    <p className="font-bold">{selectedKanji.meaning_en}</p>
                    <p className="text-sm text-muted">
                      {selectedKanji.reading_kun || selectedKanji.reading_on}
                    </p>
                  </div>
                </div>
                <button onClick={handleNextStep} className="btn-primary">
                  Next <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Reason */}
      {step === 2 && selectedKanji && (
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setStep(1)}
            className="btn-ghost mb-6"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="w-28 h-28 bg-sakura/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="font-serif text-6xl text-sakura-dark">{selectedKanji.char}</span>
            </div>
            <p className="text-muted">{selectedKanji.meaning_en}</p>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-2">
                Why did you choose this kanji? (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input min-h-[120px] resize-none"
                placeholder="You can write in Japanese or any other language..."
              />
            </div>

            {error && (
              <div className="p-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleNextStep}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Purchase */}
      {step === 3 && selectedKanji && (
        <div className="max-w-md mx-auto text-center">
          {purchaseComplete ? (
            // Purchase complete screen
            <div className="py-12">
              <div className="w-32 h-32 bg-sakura/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="font-serif text-7xl text-sakura-dark">{selectedKanji.char}</span>
              </div>
              <div className="card p-6 bg-matcha/10 border-matcha/30">
                <Check className="w-12 h-12 text-matcha mx-auto mb-4" />
                <h2 className="text-xl font-bold font-display mb-2 text-matcha-dark">Purchase Complete!</h2>
                <p className="text-matcha-dark mb-4">
                  &ldquo;{selectedKanji.char}&rdquo; is now your kanji!
                </p>
                <p className="text-sm text-muted">
                  Redirecting to home...
                </p>
              </div>
            </div>
          ) : (
            // Purchase screen
            <>
              <div className="mb-8">
                <div className="w-32 h-32 bg-sakura/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-7xl text-sakura-dark">{selectedKanji.char}</span>
                </div>
                <p className="text-muted">{selectedKanji.meaning_en}</p>
              </div>

              <div className="card p-6 mb-6 bg-gradient-to-br from-sakura/5 to-sky/5">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-sakura" />
                  <h2 className="text-xl font-bold font-display">Kanji Daisuki Premium</h2>
                </div>
                <p className="text-4xl font-bold text-sakura-dark mb-6">$5</p>
                <ul className="text-left space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-matcha flex-shrink-0" />
                    <span>Post in Japanese</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-matcha flex-shrink-0" />
                    <span>Use your chosen kanji as avatar</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-matcha flex-shrink-0" />
                    <span>Attach images to posts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-matcha flex-shrink-0" />
                    <span>Lifetime access (no subscription)</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="p-4 mb-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className="btn-primary w-full text-lg py-4"
              >
                {isLoading ? 'Processing...' : 'Purchase (Demo)'}
              </button>

              <p className="text-xs text-muted mt-4">
                * Demo mode - no actual payment will be processed
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
