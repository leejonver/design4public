import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { PROJECT_SELECT, mapProject } from '@/lib/dto'
import { syncProjectPhotos, syncProjectItems, syncCategories, syncFreeTags } from '@/lib/image-sync'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', params.id)
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { name, description, client, location, completionYear, area, categories, tags, connectedItems, photos, images, inquiryUrl, status } =
      body

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.title = name
    if (description !== undefined) update.description = description
    if (client !== undefined) update.client = client
    if (location !== undefined) update.location = location
    if (completionYear !== undefined) update.year = completionYear
    if (area !== undefined) update.area = area
    if (inquiryUrl !== undefined) update.inquiry_url = inquiryUrl
    if (status !== undefined) update.status = status

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from('projects').update(update).eq('id', params.id)
      if (error) throw error
    }

    if (photos !== undefined) await syncProjectPhotos(params.id, photos)
    else if (images !== undefined) await syncProjectPhotos(params.id, images)
    if (connectedItems !== undefined) await syncProjectItems(params.id, connectedItems)
    if (categories !== undefined) await syncCategories('project_categories', 'project_id', params.id, categories ?? [])
    if (tags !== undefined) await syncFreeTags('project_tags', 'project_id', params.id, tags ?? [])

    const { data: full } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', params.id)
      .single()

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

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    // project_photos / project_tags / project_items links cascade on project delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Project DELETE error:', error)
    return NextResponse.json({ success: false, error: '프로젝트 삭제에 실패했습니다.' }, { status: 500 })
  }
}
