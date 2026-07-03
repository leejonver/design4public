import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { mapTag } from '@/lib/dto'
import { revalidateEntity } from '@/lib/revalidation'

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '200')

    let query = supabase
      .from('tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    if (search) query = query.ilike('name', `%${search}%`)
    query = query.range(0, limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapTag), total: count || 0, page: 1, limit },
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
    const supabase = createServerSupabase()
    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: '태그명을 입력해주세요.' }, { status: 400 })
    }
    const trimmed = name.trim()

    // find-or-create by unique name: return the existing tag if present.
    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .eq('name', trimmed)
      .limit(1)
      .maybeSingle()
    if (existing) {
      revalidateEntity('tag')
      return NextResponse.json(
        { success: true, data: mapTag(existing), message: '태그가 생성되었습니다.' },
        { status: 201 },
      )
    }

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ name: trimmed })
      .select('*')
      .single()
    if (error) {
      // unique-name race: re-fetch the winner.
      const { data: again } = await supabase
        .from('tags')
        .select('*')
        .eq('name', trimmed)
        .limit(1)
        .maybeSingle()
      if (again) {
        revalidateEntity('tag')
        return NextResponse.json(
          { success: true, data: mapTag(again), message: '태그가 생성되었습니다.' },
          { status: 201 },
        )
      }
      throw error
    }

    revalidateEntity('tag')
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
