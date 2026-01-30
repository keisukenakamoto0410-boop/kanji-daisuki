'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Sparkles } from 'lucide-react'
import { Kanji } from '@/types/database'
import KanjiCard from '@/components/KanjiCard'

interface SearchClientProps {
  kanjis: Kanji[]
  isLoggedIn: boolean
}

const JLPT_LEVELS = [
  { value: 0, label: 'All' },
  { value: 5, label: 'N5' },
  { value: 4, label: 'N4' },
  { value: 3, label: 'N3' },
  { value: 2, label: 'N2' },
  { value: 1, label: 'N1' },
]

export default function SearchClient({ kanjis, isLoggedIn }: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [jlptFilter, setJlptFilter] = useState(0)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  const filteredKanjis = useMemo(() => {
    return kanjis.filter((kanji) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesChar = kanji.char.includes(query)
        const matchesKun = kanji.reading_kun?.toLowerCase().includes(query)
        const matchesOn = kanji.reading_on?.toLowerCase().includes(query)
        const matchesMeaning = kanji.meaning_en?.toLowerCase().includes(query)

        if (!matchesChar && !matchesKun && !matchesOn && !matchesMeaning) {
          return false
        }
      }

      // JLPT filter
      if (jlptFilter !== 0 && kanji.jlpt_level !== jlptFilter) {
        return false
      }

      // Availability filter
      if (showAvailableOnly && kanji.current_users >= 10) {
        return false
      }

      return true
    })
  }, [kanjis, searchQuery, jlptFilter, showAvailableOnly])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold font-display text-center mb-2">Find Your Kanji</h1>
      <p className="text-muted text-center mb-8">Search through our collection of beautiful kanji characters</p>

      {/* Search & Filters */}
      <div className="card p-6 mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by kanji, reading, or meaning..."
            className="input pl-12"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted font-medium">JLPT Level:</span>
            <div className="flex gap-1">
              {JLPT_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setJlptFilter(value)}
                  className={`
                    px-3 py-1.5 text-sm rounded-full transition-all duration-200
                    ${jlptFilter === value
                      ? 'bg-sakura text-white shadow-md'
                      : 'bg-sakura/10 text-sakura-dark hover:bg-sakura/20'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="w-4 h-4 rounded border-sakura/30 text-sakura focus:ring-sakura"
            />
            <span className="text-sm text-muted">Available only</span>
          </label>
        </div>

        <p className="text-sm text-muted">
          {filteredKanjis.length} kanji found
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
        {filteredKanjis.map((kanji) => (
          <KanjiCard
            key={kanji.id}
            kanji={kanji}
            showDetails
            disabled={!isLoggedIn}
          />
        ))}
      </div>

      {filteredKanjis.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-muted">No kanji found matching your criteria</p>
        </div>
      )}

      {/* CTA */}
      {!isLoggedIn && (
        <div className="card p-8 text-center bg-gradient-to-br from-sakura/10 to-sky/10">
          <Sparkles className="w-8 h-8 text-sakura mx-auto mb-4" />
          <h2 className="text-xl font-bold font-display mb-2">
            Create an Account to Choose Your Kanji
          </h2>
          <p className="text-muted mb-6">
            Pick your favorite kanji as your avatar and start posting in Japanese!
          </p>
          <Link href="/signup" className="btn-primary">
            Get Started
          </Link>
        </div>
      )}
    </div>
  )
}
