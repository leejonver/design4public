import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { mapCategory } from '@/lib/dto'
import type { CategoryType } from '@/lib/database.types'

const CATEGORY_TYPES: readonly CategoryType[] = ['project', 'item']

function isCategoryType(type: string | null | undefined): type is CategoryType {
  return CATEGORY_TYPES.includes(type as CategoryType)
}

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    if (type && type !== 'all') {
      if (!isCategoryType(type)) {
        return NextResponse.json(
          { success: false, error: '카테고리 타입을 올바르게 선택해주세요.' },
          { status: 400 },
        )
      }
      query = query.eq('type', type)
    }
    if (search) query = query.ilike('name', `%${search}%`)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapCategory), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, error: '카테고리 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { name, type } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '카테고리명을 입력해주세요.' },
        { status: 400 },
      )
    }
    if (!isCategoryType(type)) {
      return NextResponse.json(
        { success: false, error: '카테고리 타입을 올바르게 선택해주세요.' },
        { status: 400 },
      )
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({ name: name.trim(), type })
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json(
      { success: true, data: mapCategory(category), message: '카테고리가 생성되었습니다.' },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { success: false, error: '카테고리 생성에 실패했습니다.' },
      { status: 500 },
    )
  }
}
