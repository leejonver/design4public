import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const brandId = searchParams.get('brandId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('items')
      .select(`
        *,
        brands(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 브랜드 필터
    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: items, error, count } = await query

    if (error) {
      console.error('Items fetch error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '아이템 목록을 가져오는데 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedItems = items?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      images: item.image_url ? [{
        id: `item_${item.id}`,
        url: item.image_url,
        alt: item.name,
        isMain: true
      }] : [],
      mallUrl: item.nara_url,
      brand: item.brands,
      tags: [], // 태그는 별도 테이블에서 가져와야 함
      slug: item.slug,
      status: item.status || 'available',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        items: transformedItems,
        total: count || 0,
        page,
        limit
      }
    })

  } catch (error) {
    console.error('Items API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, mallUrl, brandId, images, tags, status } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: '아이템 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // slug 생성 함수
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) // 최대 길이 제한
    }

    const baseSlug = generateSlug(name)
    
    // slug 중복 확인
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('items')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // images가 문자열 배열인 경우 처리
    const imageUrl = Array.isArray(images) && images.length > 0 
      ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) 
      : null

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .insert({
        name,
        description,
        brand_id: brandId,
        nara_url: mallUrl,
        image_url: imageUrl,
        slug,
        status: status || 'available'
      })
      .select('*')
      .single()

    if (error) {
      console.error('Item creation error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '아이템 생성에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    // 태그 추가
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const itemTags = tags.map(tagId => ({
        item_id: item.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabaseAdmin
        .from('item_tags')
        .insert(itemTags)

      if (tagError) {
        console.warn('Failed to insert item_tags:', tagError)
        // 에러가 있어도 계속 진행
      }
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: '아이템이 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Item creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      },
      { status: 500 }
    )
  }
}
