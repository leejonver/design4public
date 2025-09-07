import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: manager, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Manager fetch error:', error)
      return NextResponse.json(
        { success: false, error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 데이터 변환
    const transformedManager = {
      id: manager.id,
      name: manager.name || '',
      email: manager.email,
      role: manager.role,
      approvalStatus: manager.status,
      createdAt: manager.created_at,
      updatedAt: manager.updated_at,
      lastLoginAt: manager.last_login_at
    }

    return NextResponse.json({
      success: true,
      data: transformedManager
    })

  } catch (error) {
    console.error('Manager API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, role, approvalStatus } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (approvalStatus !== undefined) updateData.status = approvalStatus

    const { data: manager, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Manager update error:', error)
      return NextResponse.json(
        { success: false, error: '관리자 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: manager,
      message: '관리자 정보가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Manager update error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Manager deletion error:', error)
      return NextResponse.json(
        { success: false, error: '관리자 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '관리자가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Manager deletion error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
