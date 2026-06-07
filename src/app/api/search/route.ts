import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, authErrorResponse } from '@/lib/auth'
import {
  BRAND_SELECT,
  ITEM_SELECT,
  PROJECT_SELECT,
  PHOTO_SELECT,
  mapBrand,
  mapItem,
  mapProject,
  mapPhoto,
  mapTag,
} from '@/lib/dto'

const LIMIT = 10

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    const empty = { projects: [], items: [], brands: [], photos: [], tags: [], total: 0 }
    if (!q) {
      return NextResponse.json({ success: true, data: empty })
    }

    const like = `%${q}%`

    const [projects, items, brands, photos, tags] = await Promise.all([
      supabaseAdmin
        .from('projects')
        .select(PROJECT_SELECT)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(LIMIT),
      supabaseAdmin
        .from('items')
        .select(ITEM_SELECT)
        .or(`name.ilike.${like},description.ilike.${like}`)
        .limit(LIMIT),
      supabaseAdmin
        .from('brands')
        .select(BRAND_SELECT)
        .or(`name_ko.ilike.${like},name_en.ilike.${like},description.ilike.${like}`)
        .limit(LIMIT),
      supabaseAdmin
        .from('photos')
        .select(PHOTO_SELECT)
        .or(`title.ilike.${like},alt_text.ilike.${like},description.ilike.${like}`)
        .limit(LIMIT),
      supabaseAdmin.from('tags').select('*').ilike('name', like).limit(LIMIT),
    ])

    if (projects.error) throw projects.error
    if (items.error) throw items.error
    if (brands.error) throw brands.error
    if (photos.error) throw photos.error
    if (tags.error) throw tags.error

    const data = {
      projects: (projects.data ?? []).map(mapProject),
      items: (items.data ?? []).map(mapItem),
      brands: (brands.data ?? []).map(mapBrand),
      photos: (photos.data ?? []).map(mapPhoto),
      tags: (tags.data ?? []).map(mapTag),
      total: 0,
    }
    data.total =
      data.projects.length +
      data.items.length +
      data.brands.length +
      data.photos.length +
      data.tags.length

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Search GET error:', error)
    return NextResponse.json(
      { success: false, error: '검색에 실패했습니다.' },
      { status: 500 },
    )
  }
}
