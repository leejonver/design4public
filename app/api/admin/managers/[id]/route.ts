import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole, authErrorResponse } from '@/lib/auth'
import { mapManager } from '@/lib/dto'

// Returns true if removing `target` from the master pool would leave zero approved masters.
async function isLastMaster(targetRole: string, targetStatus: string): Promise<boolean> {
  if (targetRole !== 'master' || targetStatus !== 'approved') return false
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'master')
    .eq('status', 'approved')
  return (count ?? 0) <= 1
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('master')
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, status, last_login_at, created_at, updated_at')
      .eq('id', params.id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '관리자를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapManager(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Manager GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caller = await requireRole('master')
    const body = await request.json()
    const { name, role, approvalStatus } = body

    // Self guard: a master cannot demote their own role away from 'master'. (§8)
    if (params.id === caller.id && role !== undefined && role !== 'master') {
      return NextResponse.json(
        { success: false, error: '본인 권한은 변경할 수 없습니다.' },
        { status: 403 },
      )
    }

    const { data: target, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('role, status')
      .eq('id', params.id)
      .single()
    if (fetchError || !target) {
      return NextResponse.json({ success: false, error: '관리자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Last-master guard: demoting from master OR rejecting an approved master. (§8)
    const demotesMaster = role !== undefined && role !== 'master'
    const rejectsUser = approvalStatus !== undefined && approvalStatus !== 'approved'
    if ((demotesMaster || rejectsUser) && (await isLastMaster(target.role, target.status))) {
      return NextResponse.json(
        { success: false, error: '마지막 master는 제거할 수 없습니다.' },
        { status: 409 },
      )
    }

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (role !== undefined) update.role = role
    if (approvalStatus !== undefined) update.status = approvalStatus

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from('profiles').update(update).eq('id', params.id)
      if (error) throw error
    }

    const { data: full } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, status, last_login_at, created_at, updated_at')
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapManager(full) : null,
      message: '관리자 정보가 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Manager PUT error:', error)
    return NextResponse.json({ success: false, error: '관리자 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caller = await requireRole('master')

    // Self guard: a master cannot delete their own account. (§8)
    if (params.id === caller.id) {
      return NextResponse.json(
        { success: false, error: '본인 계정은 삭제할 수 없습니다.' },
        { status: 403 },
      )
    }

    const { data: target, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('role, status')
      .eq('id', params.id)
      .single()
    if (fetchError || !target) {
      return NextResponse.json({ success: false, error: '관리자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Last-master guard: cannot delete the final approved master. (§8)
    if (await isLastMaster(target.role, target.status)) {
      return NextResponse.json(
        { success: false, error: '마지막 master는 제거할 수 없습니다.' },
        { status: 409 },
      )
    }

    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', params.id)
    if (error) throw error

    // Optional auth user cleanup — never fail the request on its error.
    try {
      await supabaseAdmin.auth.admin.deleteUser(params.id)
    } catch (e) {
      console.error('Auth user deletion failed (non-fatal):', e)
    }

    return NextResponse.json({ success: true, message: '관리자가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Manager DELETE error:', error)
    return NextResponse.json({ success: false, error: '관리자 삭제에 실패했습니다.' }, { status: 500 })
  }
}
