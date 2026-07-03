import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { ITEM_SELECT, mapItem } from '@/lib/dto'
import { uniqueSlug } from '@/lib/slug'
import { syncItemPhotos, syncCategories, syncFreeTags } from '@/lib/image-sync'

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const SORTABLE = ['created_at', 'name'] as const
    const sortParam = searchParams.get('sort')
    const sortCol = SORTABLE.includes(sortParam as (typeof SORTABLE)[number])
      ? (sortParam as (typeof SORTABLE)[number])
      : 'created_at'
    const ascending = searchParams.get('dir') === 'asc'

    let query = supabaseAdmin
      .from('items')
      .select(ITEM_SELECT, { count: 'exact' })
      .order(sortCol, { ascending })

    if (status && status !== 'all')
      query = query.eq('status', status as 'available' | 'discontinued' | 'hidden')
    if (brandId) query = query.eq('brand_id', brandId)
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapItem), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Items GET error:', error)
    return NextResponse.json(
      { success: false, error: '아이템 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { name, description, mallUrl, brandId, images, categories, tags, status } = body

    if (!name) {
      return NextResponse.json({ success: false, error: '아이템 이름은 필수입니다.' }, { status: 400 })
    }

    const slug = await uniqueSlug(name, async (s) => {
      const { data } = await supabaseAdmin.from('items').select('id').eq('slug', s).maybeSingle()
      return !!data
    })

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .insert({
        name,
        description: description ?? null,
        brand_id: brandId ?? null,
        nara_url: mallUrl ?? null,
        slug,
        status: status || 'available',
      })
      .select('id')
      .single()
    if (error) throw error

    await syncItemPhotos(item.id, images ?? [])
    await syncCategories('item_categories', 'item_id', item.id, categories ?? [])
    await syncFreeTags('item_tags', 'item_id', item.id, tags ?? [])

    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', item.id)
      .single()

    return NextResponse.json(
      { success: true, data: full ? mapItem(full) : null, message: '아이템이 생성되었습니다.' },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Items POST error:', error)
    return NextResponse.json({ success: false, error: '아이템 생성에 실패했습니다.' }, { status: 500 })
  }
}
