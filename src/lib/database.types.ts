// Database schema types — synced to the live Postgres schema after migration 019.
// renewal_requirements.md §3, §5: kept 100% in sync with the real schema.
// Legacy image stores (projects.cover_image_url, items.image_url, project_images,
// item_images) are intentionally omitted — they are deprecated and removed by migration 020.
// The single image-asset model is: photos + project_photos + photo_items.

export type ProjectStatus = 'draft' | 'published' | 'hidden'
export type ItemStatus = 'available' | 'discontinued' | 'hidden'
export type BrandStatus = 'visible' | 'hidden'
export type TagType = 'project' | 'item' | 'photo' | 'brand'
export type UserRole = 'master' | 'admin' | 'content_manager'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// ---- per-table Row / Insert shapes (standalone, no self-reference) ----
type ProjectRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  year: number | null
  area: number | null
  inquiry_url: string | null
  status: ProjectStatus
  slug: string
  created_at: string
  updated_at: string
}
type ProjectInsert = {
  id?: string
  title: string
  description?: string | null
  location?: string | null
  year?: number | null
  area?: number | null
  inquiry_url?: string | null
  status?: ProjectStatus
  slug?: string
  created_at?: string
  updated_at?: string
}

type BrandRow = {
  id: string
  name_ko: string
  name_en: string | null
  description: string | null
  logo_image_url: string | null
  cover_image_url: string | null
  website_url: string | null
  status: BrandStatus
  slug: string
  created_at: string
  updated_at: string
}
type BrandInsert = {
  id?: string
  name_ko: string
  name_en?: string | null
  description?: string | null
  logo_image_url?: string | null
  cover_image_url?: string | null
  website_url?: string | null
  status?: BrandStatus
  slug?: string
  created_at?: string
  updated_at?: string
}

type ItemRow = {
  id: string
  name: string
  description: string | null
  brand_id: string | null
  nara_url: string | null
  status: ItemStatus
  slug: string
  created_at: string
  updated_at: string
}
type ItemInsert = {
  id?: string
  name: string
  description?: string | null
  brand_id?: string | null
  nara_url?: string | null
  status?: ItemStatus
  slug?: string
  created_at?: string
  updated_at?: string
}

type PhotoRow = {
  id: string
  image_url: string
  alt_text: string | null
  title: string | null
  description: string | null
  created_at: string
  updated_at: string
}
type PhotoInsert = {
  id?: string
  image_url: string
  alt_text?: string | null
  title?: string | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

type TagRow = {
  id: string
  name: string
  type: TagType
  created_at: string
}
type TagInsert = {
  id?: string
  name: string
  type: TagType
  created_at?: string
}

type ProfileRow = {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: ApprovalStatus
  last_login_at: string | null
  created_at: string
  updated_at: string
}
type ProfileInsert = {
  id: string
  email: string
  name?: string | null
  role?: UserRole
  status?: ApprovalStatus
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

type ProjectPhotoRow = {
  id: string
  project_id: string
  photo_id: string
  is_main: boolean
  order: number
  created_at: string
}
type ProjectPhotoInsert = {
  id?: string
  project_id: string
  photo_id: string
  is_main?: boolean
  order?: number
  created_at?: string
}

type PhotoItemRow = {
  id: string
  photo_id: string
  item_id: string
  is_main: boolean
  order: number
  created_at: string
}
type PhotoItemInsert = {
  id?: string
  photo_id: string
  item_id: string
  is_main?: boolean
  order?: number
  created_at?: string
}

type ProjectItemRow = {
  project_id: string
  item_id: string
  created_at: string
}
type ProjectTagRow = {
  project_id: string
  tag_id: string
  created_at: string
}
type ItemTagRow = {
  item_id: string
  tag_id: string
  created_at: string
}
type PhotoTagRow = {
  id: string
  photo_id: string
  tag_id: string
  created_at: string
}
type BrandTagRow = {
  id: string
  brand_id: string
  tag_id: string
  created_at: string
}

// `Relationships: []` is required for the type to satisfy postgrest-js GenericSchema.
type TableDef<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      projects: TableDef<ProjectRow, ProjectInsert>
      brands: TableDef<BrandRow, BrandInsert>
      items: TableDef<ItemRow, ItemInsert>
      photos: TableDef<PhotoRow, PhotoInsert>
      tags: TableDef<TagRow, TagInsert>
      profiles: TableDef<ProfileRow, ProfileInsert>
      project_photos: TableDef<ProjectPhotoRow, ProjectPhotoInsert>
      photo_items: TableDef<PhotoItemRow, PhotoItemInsert>
      project_items: TableDef<ProjectItemRow, Omit<ProjectItemRow, 'created_at'> & { created_at?: string }>
      project_tags: TableDef<ProjectTagRow, Omit<ProjectTagRow, 'created_at'> & { created_at?: string }>
      item_tags: TableDef<ItemTagRow, Omit<ItemTagRow, 'created_at'> & { created_at?: string }>
      photo_tags: TableDef<PhotoTagRow, Omit<PhotoTagRow, 'id' | 'created_at'> & { id?: string; created_at?: string }>
      brand_tags: TableDef<BrandTagRow, Omit<BrandTagRow, 'id' | 'created_at'> & { id?: string; created_at?: string }>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
