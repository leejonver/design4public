import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, authErrorResponse } from '@/lib/auth'
import { PHOTO_SELECT, mapPhoto } from '@/lib/dto'

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const unconnected = searchParams.get('unconnected') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('photos')
      .select(PHOTO_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,alt_text.ilike.%${search}%,description.ilike.%${search}%`,
      )
    }

    // unconnected = photos with no photo_items link. Exclude connected ids at the DB level so
    // pagination + count stay correct.
    if (unconnected) {
      const { data: connected } = await supabaseAdmin.from('photo_items').select('photo_id')
      const connectedIds = [...new Set((connected ?? []).map((r) => r.photo_id))]
      if (connectedIds.length) {
        query = query.not('id', 'in', `(${connectedIds.join(',')})`)
      }
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapPhoto), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Photos GET error:', error)
    return NextResponse.json(
      { success: false, error: '사진 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}
