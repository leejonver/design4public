import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole, authErrorResponse } from '@/lib/auth'
import { mapManager } from '@/lib/dto'
import { orIlike } from '@/lib/pg-filter'
import { parseListQuery } from '@/lib/list-query'

const SORT_COLUMNS = ['created_at', 'updated_at', 'last_login_at', 'name', 'email', 'role']

export async function GET(request: NextRequest) {
  try {
    await requireRole('master')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const { page, limit, offset, sortCol, ascending } = parseListQuery(searchParams, {
      sortable: SORT_COLUMNS,
      defaultSort: 'created_at',
      defaultLimit: 10,
    })

    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, status, last_login_at, created_at, updated_at', {
        count: 'exact',
      })
      .order(sortCol, { ascending })

    if (status && status !== 'all')
      query = query.eq('status', status as 'pending' | 'approved' | 'rejected')
    if (role && role !== 'all')
      query = query.eq('role', role as 'master' | 'admin' | 'content_manager')
    const orFilter = orIlike(['email', 'name'], search ?? '')
    if (orFilter) query = query.or(orFilter)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapManager), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Managers GET error:', error)
    return NextResponse.json(
      { success: false, error: '관리자 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}
