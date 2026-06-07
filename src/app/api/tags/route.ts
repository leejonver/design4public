import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { mapTag } from '@/lib/dto'
import type { TagType } from '@/lib/database.types'

const TAG_TYPES: readonly TagType[] = ['project', 'item', 'photo', 'brand']

function isTagType(type: string | null | undefined): type is TagType {
  return TAG_TYPES.includes(type as TagType)
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
      .from('tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    if (type && type !== 'all') {
      if (!isTagType(type)) {
        return NextResponse.json(
          { success: false, error: '태그 타입을 올바르게 선택해주세요.' },
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
      data: { items: (data ?? []).map(mapTag), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Tags GET error:', error)
    return NextResponse.json(
      { success: false, error: '태그 목록을 가져오는데 실패했습니다.' },
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
      return NextResponse.json({ success: false, error: '태그명을 입력해주세요.' }, { status: 400 })
    }
    if (!isTagType(type)) {
      return NextResponse.json(
        { success: false, error: '태그 타입을 올바르게 선택해주세요.' },
        { status: 400 },
      )
    }

    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .insert({ name: name.trim(), type })
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json(
      { success: true, data: mapTag(tag), message: '태그가 생성되었습니다.' },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Tags POST error:', error)
    return NextResponse.json({ success: false, error: '태그 생성에 실패했습니다.' }, { status: 500 })
  }
}
