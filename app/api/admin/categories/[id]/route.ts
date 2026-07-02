import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { mapCategory } from '@/lib/dto'
import type { CategoryType } from '@/lib/database.types'
import { revalidateEntity } from '@/lib/revalidation'

const CATEGORY_TYPES: readonly CategoryType[] = ['project', 'item']

function isCategoryType(type: string | null | undefined): type is CategoryType {
  return CATEGORY_TYPES.includes(type as CategoryType)
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, data: mapCategory(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Category GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { name, type } = body

    const update: Record<string, unknown> = {}
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: '카테고리명을 입력해주세요.' },
          { status: 400 },
        )
      }
      update.name = name.trim()
    }
    if (type !== undefined) {
      if (!isCategoryType(type)) {
        return NextResponse.json(
          { success: false, error: '카테고리 타입을 올바르게 선택해주세요.' },
          { status: 400 },
        )
      }
      update.type = type
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(update)
      .eq('id', params.id)
      .select('*')
      .single()
    if (error || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    revalidateEntity('category')

    return NextResponse.json({
      success: true,
      data: mapCategory(category),
      message: '카테고리가 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Category PUT error:', error)
    return NextResponse.json(
      { success: false, error: '카테고리 수정에 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    // project_categories / item_categories links cascade on category delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('category')
    return NextResponse.json({ success: true, message: '카테고리가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Category DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 },
    )
  }
}
