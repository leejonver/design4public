import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 권한 필터
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: managers, error, count } = await query

    if (error) {
      console.error('Managers fetch error:', error)
      return NextResponse.json(
        { success: false, error: '관리자 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedManagers = managers?.map(manager => ({
      id: manager.id,
      name: manager.name || '',
      email: manager.email,
      role: manager.role,
      approvalStatus: manager.status,
      createdAt: manager.created_at,
      updatedAt: manager.updated_at,
      lastLoginAt: manager.last_login_at
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        items: transformedManagers,
        total: count || 0,
        page,
        limit
      }
    })

  } catch (error) {
    console.error('Managers API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
