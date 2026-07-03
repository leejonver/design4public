import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { ITEM_SELECT, mapItem } from '@/lib/dto'
import { syncItemPhotos, syncCategories, syncFreeTags } from '@/lib/image-sync'
import { revalidateEntity } from '@/lib/revalidation'
import { reindexEntity, deleteFromIndex } from '@/lib/search/indexer'
import type { TablesUpdate } from '@/lib/database.types'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser()
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', id)
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { name, description, mallUrl, brandId, images, categories, tags, status } = body

    const update: TablesUpdate<'items'> = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (brandId !== undefined) update.brand_id = brandId
    if (mallUrl !== undefined) update.nara_url = mallUrl
    if (status !== undefined) update.status = status

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('items').update(update).eq('id', id)
      if (error) throw error
    }
    if (images !== undefined) await syncItemPhotos(supabase, id, images)
    if (categories !== undefined) await syncCategories(supabase, 'item_categories', 'item_id', id, categories ?? [])
    if (tags !== undefined) await syncFreeTags(supabase, 'item_tags', 'item_id', id, tags ?? [])

    const { data: full } = await supabase
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', id)
      .single()

    // ITEM_SELECT's item_tags join has no declared FK relationship in the
    // generated Database type, which makes Supabase's type parser drop the
    // top-level `*` columns from the inferred row shape.
    revalidateEntity('item', (full as { slug?: string } | null)?.slug)
    await reindexEntity('item', id)

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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    // Capture the slug before deletion so we can purge the item's detail page.
    const { data: existing } = await supabase
      .from('items')
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    // photo_items / item_tags / project_items links cascade on item delete (FK ON DELETE CASCADE).
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    revalidateEntity('item', existing?.slug)
    await deleteFromIndex('item', id)
    return NextResponse.json({ success: true, message: '아이템이 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Item DELETE error:', error)
    return NextResponse.json({ success: false, error: '아이템 삭제에 실패했습니다.' }, { status: 500 })
  }
}
