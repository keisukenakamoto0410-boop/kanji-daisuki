'use client'

import { Kanji } from '@/types/database'

interface KanjiCardProps {
  kanji: Kanji
  selected?: boolean
  disabled?: boolean
  showDetails?: boolean
  onClick?: () => void
}

export default function KanjiCard({
  kanji,
  selected = false,
  disabled = false,
  showDetails = false,
  onClick,
}: KanjiCardProps) {
  const isFull = kanji.current_users >= 10
  const isDisabled = disabled || isFull
  const remainingSlots = 10 - kanji.current_users

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative p-4 rounded-xl transition-all text-left
        ${selected
          ? 'bg-sakura/20 border-2 border-sakura shadow-lg ring-2 ring-sakura/30'
          : 'bg-white/80 border border-sakura/20 hover:border-sakura hover:shadow-md'
        }
        ${isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-0.5'
        }
      `}
    >
      <div className="flex flex-col items-center">
        <span className="font-serif text-5xl font-bold text-sakura-dark mb-2">{kanji.char}</span>

        <div className="text-xs text-muted text-center">
          {kanji.reading_kun && (
            <p className="truncate max-w-full">{kanji.reading_kun}</p>
          )}
          {kanji.reading_on && (
            <p className="truncate max-w-full">{kanji.reading_on}</p>
          )}
        </div>

        <p className="text-xs mt-1 truncate max-w-full font-medium">{kanji.meaning_en}</p>

        <div className={`
          mt-2 text-xs px-2 py-0.5 rounded-full
          ${isFull
            ? 'bg-accent/10 text-accent'
            : remainingSlots <= 3
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-matcha/10 text-matcha-dark'
          }
        `}>
          {isFull ? 'Full' : `${remainingSlots} left`}
        </div>

        {showDetails && (
          <div className="mt-2 text-xs text-muted flex gap-2">
            {kanji.stroke_count && <span>{kanji.stroke_count} strokes</span>}
            {kanji.jlpt_level && <span>N{kanji.jlpt_level}</span>}
          </div>
        )}
      </div>
    </button>
  )
}
