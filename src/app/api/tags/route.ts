import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const TAG_TYPES = ['project', 'item', 'photo', 'brand'] as const

function isTagType(type: string | null | undefined) {
  return TAG_TYPES.includes(type as typeof TAG_TYPES[number])
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    // 타입 필터
    if (isTagType(type)) {
      query = query.eq('type', type)
    }

    // 검색 필터
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: tags, error, count } = await query

    if (error) {
      console.error('Tags fetch error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '태그 목록을 가져오는데 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedTags = tags?.map(tag => ({
      id: tag.id,
      name: tag.name,
      type: tag.type,
      createdAt: tag.created_at,
      updatedAt: tag.created_at // updated_at 컬럼이 없으므로 created_at 사용
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        items: transformedTags,
        total: count || 0,
        page,
        limit
      }
    })

  } catch (error) {
    console.error('Tags API error:', error)
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
    const { name, type } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '태그명을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!isTagType(type)) {
      return NextResponse.json(
        { success: false, error: '태그 타입을 올바르게 선택해주세요.' },
        { status: 400 }
      )
    }

    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .insert({
        name: name.trim(),
        type: type
      })
      .select('*')
      .single()

    if (error) {
      console.error('Tag creation error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '태그 생성에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
      message: '태그가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Tag creation error:', error)
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
