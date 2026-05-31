import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TAG_TYPES = ['project', 'item', 'photo', 'brand'] as const

function isTagType(type: string | null | undefined) {
  return TAG_TYPES.includes(type as typeof TAG_TYPES[number])
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, type } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '태그명을 입력해주세요.' },
        { status: 400 }
      )
    }

    const updateData: any = {
      name: name.trim()
    }

    // type이 제공된 경우 검증 후 업데이트
    if (type) {
      if (!isTagType(type)) {
        return NextResponse.json(
          { success: false, error: '태그 타입을 올바르게 선택해주세요.' },
          { status: 400 }
        )
      }
      updateData.type = type
    }

    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Tag update error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '태그 업데이트에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    // 데이터 변환 (snake_case -> camelCase)
    const transformedTag = {
      id: tag.id,
      name: tag.name,
      type: tag.type,
      createdAt: tag.created_at,
      updatedAt: tag.created_at // updated_at 컬럼이 없으므로 created_at 사용
    };

    return NextResponse.json({
      success: true,
      data: transformedTag,
      message: '태그가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Tag update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      },
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

    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Tag deletion error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '태그 삭제에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
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
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      },
      { status: 500 }
    )
  }
}
