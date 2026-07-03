import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { mapTag } from '@/lib/dto'
import { revalidateEntity } from '@/lib/revalidation'

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireUser()
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '태그를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapTag(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Tag GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    // project_tags / item_tags / photo_tags links cascade on tag delete (FK ON DELETE CASCADE).
    const { error } = await supabase.from('tags').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('tag')
    return NextResponse.json({ success: true, message: '태그가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Tag DELETE error:', error)
    return NextResponse.json({ success: false, error: '태그 삭제에 실패했습니다.' }, { status: 500 })
  }
}
