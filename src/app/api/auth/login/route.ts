import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 테스트 계정 체크 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      if (email === 'admin@design4public.com' && password === 'password') {
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: 'test-admin-id',
              email: 'admin@design4public.com',
              name: '테스트 관리자',
              role: 'admin',
              status: 'approved',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            },
            session: {
              access_token: 'test-token',
              refresh_token: 'test-refresh-token'
            }
          },
          message: '로그인에 성공했습니다.'
        })
      }
      
      if (email === 'master@design4public.com' && password === 'master123') {
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: 'test-master-id',
              email: 'master@design4public.com',
              name: '테스트 마스터',
              role: 'master',
              status: 'approved',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            },
            session: {
              access_token: 'test-token',
              refresh_token: 'test-refresh-token'
            }
          },
          message: '로그인에 성공했습니다.'
        })
      }
    }

    // Supabase Auth를 통한 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: '로그인에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 가져올 수 없습니다.' },
        { status: 500 }
      )
    }

    // 승인되지 않은 사용자 체크
    if (profile.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: '승인되지 않은 계정입니다.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile.name || '',
          role: profile.role,
          status: profile.status,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          lastLoginAt: profile.last_login_at
        },
        session: data.session
      },
      message: '로그인에 성공했습니다.'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
