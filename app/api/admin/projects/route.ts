import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { PROJECT_SELECT, mapProject } from '@/lib/dto'
import { uniqueSlug } from '@/lib/slug'
import { syncProjectPhotos, syncProjectItems, syncCategories, syncFreeTags } from '@/lib/image-sync'
import { revalidateEntity } from '@/lib/revalidation'
import { reindexEntity } from '@/lib/search/indexer'

export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const SORTABLE = ['created_at', 'title', 'year'] as const
    const sortParam = searchParams.get('sort')
    const sortCol = SORTABLE.includes(sortParam as (typeof SORTABLE)[number])
      ? (sortParam as (typeof SORTABLE)[number])
      : 'created_at'
    const ascending = searchParams.get('dir') === 'asc'

    let query = supabase
      .from('projects')
      .select(PROJECT_SELECT, { count: 'exact' })
      .order(sortCol, { ascending })

    if (status && status !== 'all')
      query = query.eq('status', status as 'draft' | 'published' | 'hidden')
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { items: (data ?? []).map(mapProject), total: count || 0, page, limit },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Projects GET error:', error)
    return NextResponse.json(
      { success: false, error: '프로젝트 목록을 가져오는데 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { name, description, client, location, completionYear, area, categories, tags, connectedItems, photos, inquiryUrl, status } =
      body

    if (!name) {
      return NextResponse.json({ success: false, error: '프로젝트 이름은 필수입니다.' }, { status: 400 })
    }

    const slug = await uniqueSlug(name, async (s) => {
      const { data } = await supabase.from('projects').select('id').eq('slug', s).maybeSingle()
      return !!data
    })

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: name,
        description: description ?? null,
        client: client ?? null,
        location: location ?? null,
        year: completionYear ?? null,
        area: area ?? null,
        inquiry_url: inquiryUrl ?? null,
        slug,
        status: status || 'draft',
      })
      .select('id')
      .single()
    if (error) throw error

    await syncProjectPhotos(supabase, project.id, photos ?? [])
    await syncProjectItems(supabase, project.id, connectedItems ?? [])
    await syncCategories(supabase, 'project_categories', 'project_id', project.id, categories ?? [])
    await syncFreeTags(supabase, 'project_tags', 'project_id', project.id, tags ?? [])

    const { data: full } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', project.id)
      .single()

    revalidateEntity('project', slug)
    await reindexEntity('project', project.id)

    return NextResponse.json(
      { success: true, data: full ? mapProject(full) : null, message: '프로젝트가 생성되었습니다.' },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Projects POST error:', error)
    return NextResponse.json({ success: false, error: '프로젝트 생성에 실패했습니다.' }, { status: 500 })
  }
}
