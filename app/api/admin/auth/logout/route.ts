import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true, message: '로그아웃되었습니다.' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
