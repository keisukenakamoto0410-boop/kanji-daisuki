export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_paid: boolean
          is_admin: boolean
          selected_kanji_id: number | null
          country: string | null
          age_group: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_paid?: boolean
          is_admin?: boolean
          selected_kanji_id?: number | null
          country?: string | null
          age_group?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_paid?: boolean
          is_admin?: boolean
          selected_kanji_id?: number | null
          country?: string | null
          age_group?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kanjis: {
        Row: {
          id: number
          char: string
          reading_kun: string | null
          reading_on: string | null
          meaning_en: string | null
          meaning_ja: string | null
          stroke_count: number | null
          jlpt_level: number | null
          current_users: number
          created_at: string
        }
        Insert: {
          id?: number
          char: string
          reading_kun?: string | null
          reading_on?: string | null
          meaning_en?: string | null
          meaning_ja?: string | null
          stroke_count?: number | null
          jlpt_level?: number | null
          current_users?: number
          created_at?: string
        }
        Update: {
          id?: number
          char?: string
          reading_kun?: string | null
          reading_on?: string | null
          meaning_en?: string | null
          meaning_ja?: string | null
          stroke_count?: number | null
          jlpt_level?: number | null
          current_users?: number
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          user_id: string
          content: string
          image_url: string | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          content: string
          image_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          content?: string
          image_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: number
          user_id: string
          post_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          post_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          post_id?: number
          created_at?: string
        }
      }
      kanji_selections: {
        Row: {
          id: number
          user_id: string
          kanji_id: number
          reason: string | null
          selected_at: string
          is_active: boolean
        }
        Insert: {
          id?: number
          user_id: string
          kanji_id: number
          reason?: string | null
          selected_at?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          user_id?: string
          kanji_id?: number
          reason?: string | null
          selected_at?: string
          is_active?: boolean
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Kanji = Database['public']['Tables']['kanjis']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type KanjiSelection = Database['public']['Tables']['kanji_selections']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type PostWithAuthor = Post & {
  profiles: Profile & {
    kanjis: Kanji | null
  }
  user_has_liked?: boolean
}

export type ProfileWithKanji = Profile & {
  kanjis: Kanji | null
  kanji_selections: KanjiSelection[]
}
