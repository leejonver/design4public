import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { PROJECT_SELECT, mapProject } from '@/lib/dto'
import { syncProjectPhotos, syncProjectItems, syncCategories, syncFreeTags } from '@/lib/image-sync'
import { revalidateEntity } from '@/lib/revalidation'
import { reindexEntity, deleteFromIndex } from '@/lib/search/indexer'
import type { TablesUpdate } from '@/lib/database.types'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser()
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapProject(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Project GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { name, description, client, location, completionYear, area, categories, tags, connectedItems, photos, images, inquiryUrl, status } =
      body

    const update: TablesUpdate<'projects'> = {}
    if (name !== undefined) update.title = name
    if (description !== undefined) update.description = description
    if (client !== undefined) update.client = client
    if (location !== undefined) update.location = location
    if (completionYear !== undefined) update.year = completionYear
    if (area !== undefined) update.area = area
    if (inquiryUrl !== undefined) update.inquiry_url = inquiryUrl
    if (status !== undefined) update.status = status

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('projects').update(update).eq('id', id)
      if (error) throw error
    }

    if (photos !== undefined) await syncProjectPhotos(supabase, id, photos)
    else if (images !== undefined) await syncProjectPhotos(supabase, id, images)
    if (connectedItems !== undefined) await syncProjectItems(supabase, id, connectedItems)
    if (categories !== undefined) await syncCategories(supabase, 'project_categories', 'project_id', id, categories ?? [])
    if (tags !== undefined) await syncFreeTags(supabase, 'project_tags', 'project_id', id, tags ?? [])

    const { data: full } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .single()

    // `full` is typed via PROJECT_SELECT's join string; the generated Database
    // type has no declared FK relationship for projects, which makes Supabase's
    // type parser drop the top-level `*` columns from the inferred row shape.
    revalidateEntity('project', (full as { slug?: string } | null)?.slug)
    await reindexEntity('project', id)

    return NextResponse.json({
      success: true,
      data: full ? mapProject(full) : null,
      message: '프로젝트가 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Project PUT error:', error)
    return NextResponse.json({ success: false, error: '프로젝트 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    // Capture the slug before deletion so we can purge the project's detail page.
    const { data: existing } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    // project_photos / project_tags / project_items links cascade on project delete (FK ON DELETE CASCADE).
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    revalidateEntity('project', existing?.slug)
    await deleteFromIndex('project', id)
    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Project DELETE error:', error)
    return NextResponse.json({ success: false, error: '프로젝트 삭제에 실패했습니다.' }, { status: 500 })
  }
}
