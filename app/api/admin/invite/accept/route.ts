import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Called by the invite-accept page AFTER the invitee sets a password. The
// invitee's own cookie session (from the invite link) identifies the caller;
// the pending→approved flip needs service role because RLS limits profiles
// UPDATE to masters. Scoped to the caller's OWN row, only from 'pending'.
// Note: we cannot use requireUser() here — getCurrentUser() rejects any profile
// whose status !== 'approved', which a just-invited user is not yet.
export async function POST() {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .eq('id', user.id)
      .single()
    if (!profile) {
      return NextResponse.json({ success: false, error: '프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (profile.status === 'pending') {
      // inviteUserByEmail sets invited_at on the auth user; a self-registered
      // account never has it. Without this check, anyone who lands here with
      // a pending profile (e.g. one created for an unrelated reason) could
      // self-approve without ever having been invited.
      if (!user.invited_at) {
        return NextResponse.json({ success: false, error: '초대된 계정이 아닙니다.' }, { status: 403 })
      }
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', user.id)
      if (error) throw error
    }

    return NextResponse.json({ success: true, message: '가입이 완료되었습니다.' })
  } catch (error) {
    console.error('Invite accept error:', error)
    return NextResponse.json({ success: false, error: '가입 처리에 실패했습니다.' }, { status: 500 })
  }
}
