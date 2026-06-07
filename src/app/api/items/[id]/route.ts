import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { ITEM_SELECT, mapItem } from '@/lib/dto'
import { syncItemPhotos, syncTags } from '@/lib/image-sync'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()
    const { data, error } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', params.id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '아이템을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapItem(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Item GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { name, description, mallUrl, brandId, images, tags, status } = body

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (brandId !== undefined) update.brand_id = brandId
    if (mallUrl !== undefined) update.nara_url = mallUrl
    if (status !== undefined) update.status = status

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from('items').update(update).eq('id', params.id)
      if (error) throw error
    }
    if (images !== undefined) await syncItemPhotos(params.id, images)
    if (tags !== undefined) await syncTags('item_tags', 'item_id', params.id, tags)

    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapItem(full) : null,
      message: '아이템이 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Item PUT error:', error)
    return NextResponse.json({ success: false, error: '아이템 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    // photo_items / item_tags / project_items links cascade on item delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('items').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '아이템이 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Item DELETE error:', error)
    return NextResponse.json({ success: false, error: '아이템 삭제에 실패했습니다.' }, { status: 500 })
  }
}
