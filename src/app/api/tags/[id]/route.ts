import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '태그명을 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data: tag, error } = await supabase
      .from('tags')
      .update({
        name: name.trim()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Tag update error:', error)
      return NextResponse.json(
        { success: false, error: '태그 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
      message: '태그가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Tag update error:', error)
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
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Tag deletion error:', error)
      return NextResponse.json(
        { success: false, error: '태그 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '태그가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Tag deletion error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
