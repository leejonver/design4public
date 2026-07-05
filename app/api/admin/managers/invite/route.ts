import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole, authErrorResponse } from '@/lib/auth'
import { mapManager } from '@/lib/dto'
import type { UserRole } from '@/lib/database.types'

const VALID_ROLES: UserRole[] = ['master', 'admin', 'content_manager']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Master invites a manager by email + role. This same handler powers "resend":
// if a not-yet-accepted (status 'pending') profile already exists for the email,
// its stale auth user is removed (profiles cascade-deletes via profiles_id_fkey
// ON DELETE CASCADE) and a fresh invite is issued. An already-active ('approved')
// email is rejected.
export async function POST(request: NextRequest) {
  try {
    await requireRole('master')
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const { role, name } = body

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: '올바른 이메일을 입력해주세요.' }, { status: 400 })
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: '올바른 역할을 선택해주세요.' }, { status: 400 })
    }

    // email is UNIQUE on profiles, so a single lookup covers create vs. resend.
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ success: false, error: '이미 활성화된 계정입니다.' }, { status: 409 })
      }
      // Pending invite → clear the auth user so inviteUserByEmail can re-issue.
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existing.id)
      if (deleteError) {
        console.error('invite resend deleteUser error:', deleteError)
        return NextResponse.json({ success: false, error: '초대에 실패했습니다.' }, { status: 500 })
      }
    }

    const redirectTo = `${new URL(request.url).origin}/admin/invite/accept`
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo },
    )
    if (inviteError || !invited.user) {
      console.error('inviteUserByEmail error:', inviteError)
      return NextResponse.json({ success: false, error: '초대 메일 발송에 실패했습니다.' }, { status: 500 })
    }

    // The on_auth_user_created trigger inserted a default pending content_manager
    // row; overwrite it with the inviter-chosen role (+ optional name).
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      { id: invited.user.id, email, name: name ?? null, role, status: 'pending' },
      { onConflict: 'id' },
    )
    if (profileError) {
      console.error('invite profile upsert error:', profileError)
      return NextResponse.json({ success: false, error: '프로필 생성에 실패했습니다.' }, { status: 500 })
    }

    const { data: full } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, status, last_login_at, created_at, updated_at')
      .eq('id', invited.user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapManager(full) : null,
      message: '초대 메일을 발송했습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Invite POST error:', error)
    return NextResponse.json({ success: false, error: '초대에 실패했습니다.' }, { status: 500 })
  }
}
