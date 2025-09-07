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
      `)
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
        { success: false, error: '아이템 목록을 가져오는데 실패했습니다.' },
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
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, mallUrl, brandId, status, images } = body

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        name,
        description,
        brand_id: brandId,
        nara_url: mallUrl,
        image_url: images?.[0]?.url,
        status: status || 'available'
      })
      .select()
      .single()

    if (error) {
      console.error('Item creation error:', error)
      return NextResponse.json(
        { success: false, error: '아이템 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: '아이템이 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Item creation error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
