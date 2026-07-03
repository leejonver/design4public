import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { BRAND_SELECT, mapBrand } from '@/lib/dto'
import { uniqueSlug } from '@/lib/slug'
import { revalidateEntity } from '@/lib/revalidation'
import { reindexEntity } from '@/lib/search/indexer'

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const SORTABLE = ['created_at', 'name_ko'] as const
    const sortParam = searchParams.get('sort')
    const sortCol = SORTABLE.includes(sortParam as (typeof SORTABLE)[number])
      ? (sortParam as (typeof SORTABLE)[number])
      : 'created_at'
    const ascending = searchParams.get('dir') === 'asc'

    let query = supabase
      .from('brands')
      .select(BRAND_SELECT, { count: 'exact' })
      .order(sortCol, { ascending })

    if (status && status !== 'all') query = query.eq('status', status as 'visible' | 'hidden')
    if (search) {
      query = query.or(
        `name_ko.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`,
      )
    }
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapBrand), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Brands GET error:', error)
    return NextResponse.json(
      { success: false, error: '브랜드 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const supabase = createServerSupabase()
    const body = await request.json()
    const { nameKo, nameEn, description, logoImageUrl, coverImageUrl, websiteUrl, status } = body

    if (!nameKo) {
      return NextResponse.json(
        { success: false, error: '브랜드 한글 이름은 필수입니다.' },
        { status: 400 },
      )
    }

    const slug = await uniqueSlug(nameKo, async (s) => {
      const { data } = await supabase.from('brands').select('id').eq('slug', s).maybeSingle()
      return !!data
    })

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        name_ko: nameKo,
        name_en: nameEn ?? null,
        description: description ?? null,
        logo_image_url: logoImageUrl ?? null,
        cover_image_url: coverImageUrl ?? null,
        website_url: websiteUrl ?? null,
        status: status || 'visible',
        slug,
      })
      .select('id')
      .single()
    if (error) throw error

    const { data: full } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', brand.id)
      .single()

    revalidateEntity('brand', slug)
    await reindexEntity('brand', brand.id)

    return NextResponse.json(
      { success: true, data: full ? mapBrand(full) : null, message: '브랜드가 생성되었습니다.' },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Brands POST error:', error)
    return NextResponse.json({ success: false, error: '브랜드 생성에 실패했습니다.' }, { status: 500 })
  }
}
