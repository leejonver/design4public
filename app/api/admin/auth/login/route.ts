import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: '로그인에 실패했습니다.' },
        { status: 401 },
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, status')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: '사용자 정보를 가져올 수 없습니다.' },
        { status: 500 },
      )
    }

    if (profile.status !== 'approved') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: '승인 대기 중입니다.' },
        { status: 403 },
      )
    }

    await supabaseAdmin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
        },
      },
      message: '로그인에 성공했습니다.',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
