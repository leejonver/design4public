import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { PHOTO_SELECT, mapPhoto } from '@/lib/dto'
import { syncPhotoItems, syncTags } from '@/lib/image-sync'

export async function GET(_request: NextRequest, { params }: { params: { photo_id: string } }) {
  try {
    await requireUser()
    const { data, error } = await supabaseAdmin
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', params.photo_id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '사진을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapPhoto(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Photo GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { photo_id: string } }) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { imageUrl, altText, title, description, connectedItems, tags } = body

    const update: Record<string, unknown> = {}
    if (imageUrl !== undefined) update.image_url = imageUrl
    if (altText !== undefined) update.alt_text = altText
    if (title !== undefined) update.title = title
    if (description !== undefined) update.description = description

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from('photos').update(update).eq('id', params.photo_id)
      if (error) throw error
    }
    if (connectedItems !== undefined) await syncPhotoItems(params.photo_id, connectedItems)
    if (tags !== undefined) await syncTags('photo_tags', 'photo_id', params.photo_id, tags)

    const { data: full } = await supabaseAdmin
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', params.photo_id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapPhoto(full) : null,
      message: '사진이 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Photo PUT error:', error)
    return NextResponse.json({ success: false, error: '사진 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { photo_id: string } }) {
  try {
    await requireRole('content_manager')
    // photo_items / photo_tags / project_photos links cascade on photo delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('photos').delete().eq('id', params.photo_id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '사진이 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Photo DELETE error:', error)
    return NextResponse.json({ success: false, error: '사진 삭제에 실패했습니다.' }, { status: 500 })
  }
}
