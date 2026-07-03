import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { PHOTO_SELECT, mapPhoto } from '@/lib/dto'
import { syncPhotoItems, syncFreeTags } from '@/lib/image-sync'
import { revalidateEntity } from '@/lib/revalidation'
import { deleteFromIndex, captionAndReindexPhoto } from '@/lib/search/indexer'
import type { TablesUpdate } from '@/lib/database.types'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ photo_id: string }> }) {
  try {
    const { photo_id } = await params;
    await requireUser()
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', photo_id)
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ photo_id: string }> }) {
  try {
    const { photo_id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { imageUrl, altText, title, description, connectedItems, tags } = body

    const update: TablesUpdate<'photos'> = {}
    if (imageUrl !== undefined) update.image_url = imageUrl
    if (altText !== undefined) update.alt_text = altText
    if (title !== undefined) update.title = title
    if (description !== undefined) update.description = description

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('photos').update(update).eq('id', photo_id)
      if (error) throw error
    }
    if (connectedItems !== undefined) await syncPhotoItems(supabase, photo_id, connectedItems)
    if (tags !== undefined) await syncFreeTags(supabase, 'photo_tags', 'photo_id', photo_id, tags)

    const { data: full } = await supabase
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', photo_id)
      .single()

    revalidateEntity('photo')
    // Regenerate the caption when the image changed; otherwise fill only if missing.
    await captionAndReindexPhoto(photo_id, { regenerate: imageUrl !== undefined })

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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ photo_id: string }> }) {
  try {
    const { photo_id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    // photo_items / photo_tags / project_photos links cascade on photo delete (FK ON DELETE CASCADE).
    const { error } = await supabase.from('photos').delete().eq('id', photo_id)
    if (error) throw error
    revalidateEntity('photo')
    await deleteFromIndex('photo', photo_id)
    return NextResponse.json({ success: true, message: '사진이 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Photo DELETE error:', error)
    return NextResponse.json({ success: false, error: '사진 삭제에 실패했습니다.' }, { status: 500 })
  }
}
