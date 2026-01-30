// Japanese text validation utility
// Allows: Hiragana, Katakana, Kanji, Japanese punctuation, emoji, whitespace

const HIRAGANA_RANGE = '\u3040-\u309F'
const KATAKANA_RANGE = '\u30A0-\u30FF'
const KANJI_RANGE = '\u4E00-\u9FAF\u3400-\u4DBF'
const JAPANESE_PUNCTUATION = '\u3000-\u303F\uFF00-\uFFEF'
const EMOJI_RANGE = '\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}'

// Pattern that matches ONLY Japanese characters and allowed symbols
const JAPANESE_PATTERN = new RegExp(
  `^[${HIRAGANA_RANGE}${KATAKANA_RANGE}${KANJI_RANGE}${JAPANESE_PUNCTUATION}${EMOJI_RANGE}\\s\\n]*$`,
  'u'
)

// Pattern to detect forbidden characters (alphabet and numbers)
const FORBIDDEN_PATTERN = /[A-Za-z0-9]/

export function isJapaneseOnly(text: string): boolean {
  if (!text || text.trim().length === 0) return true

  // Check for forbidden characters first
  if (FORBIDDEN_PATTERN.test(text)) {
    return false
  }

  // Then verify all characters are Japanese
  return JAPANESE_PATTERN.test(text)
}

export function getInvalidCharacters(text: string): string[] {
  const invalid: string[] = []

  for (const char of text) {
    if (FORBIDDEN_PATTERN.test(char)) {
      if (!invalid.includes(char)) {
        invalid.push(char)
      }
    }
  }

  return invalid
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'たった今'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}時間前`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}日前`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}週間前`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}年前`
}
