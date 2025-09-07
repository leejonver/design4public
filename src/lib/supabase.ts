import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드에서 사용할 서비스 역할 키를 사용하는 클라이언트
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 타입 정의를 위한 Database 인터페이스
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image_url: string | null
          year: number | null
          area: number | null
          status: 'draft' | 'published' | 'hidden'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          year?: number | null
          area?: number | null
          status?: 'draft' | 'published' | 'hidden'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          year?: number | null
          area?: number | null
          status?: 'draft' | 'published' | 'hidden'
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image_url: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description: string | null
          brand_id: string | null
          nara_url: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          brand_id?: string | null
          nara_url?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          brand_id?: string | null
          nara_url?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'master' | 'admin' | 'general'
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'master' | 'admin' | 'general'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'master' | 'admin' | 'general'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
