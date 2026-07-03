import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 },
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      const alreadyRegistered =
        /already registered|already been registered/i.test(error.message) ||
        error.status === 422
      return NextResponse.json(
        {
          success: false,
          error: alreadyRegistered ? '이미 가입된 이메일입니다.' : '회원가입에 실패했습니다.',
        },
        { status: 400 },
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: '사용자 생성에 실패했습니다.' },
        { status: 500 },
      )
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: data.user.id,
        email,
        name: name ?? null,
        role: 'content_manager',
        status: 'pending',
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error('Signup profile error:', profileError)
      return NextResponse.json(
        { success: false, error: '프로필 생성에 실패했습니다.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: '이메일 인증 후 관리자 승인이 필요합니다.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
