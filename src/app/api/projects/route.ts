import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { buildProjectPhotoRows, projectSelect, transformProject } from './project-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('projects')
      .select(projectSelect, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: projects, error, count } = await query

    if (error) {
      console.error('Projects fetch error:', error)
      return NextResponse.json(
        {
          success: false,
          error: '프로젝트 목록을 가져오는데 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    const transformedProjects = projects?.map(transformProject) || []

    return NextResponse.json({
      success: true,
      data: {
        items: transformedProjects,
        total: count || 0,
        page,
        limit
      }
    })

  } catch (error) {
    console.error('Projects API error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, location, completionYear, area, tags, connectedItems, inquiryUrl, status, images, photos } = body

    // RPC 호출을 위한 이미지 데이터 포맷팅
    const formattedImages = images?.map((img: any, index: number) => ({
      image_url: img.url,
      order: index
    })) || []

    // 빈 배열은 Supabase RPC 파라미터 상 누락으로 간주될 수 있어 null로 변환
    const rpcImages = formattedImages.length > 0 ? formattedImages : null
    const rpcTagIds = (tags && tags.length > 0) ? tags : null
    const rpcItemIds = (connectedItems && connectedItems.length > 0) ? connectedItems : null

    let rpcRes = await supabaseAdmin
      .rpc('create_project_with_relations', {
        p_title: name,
        p_description: description ?? null,
        p_location: location ?? null,
        p_year: completionYear ?? null,
        p_area: area ?? null,
        p_status: status || 'draft',
        p_inquiry_url: inquiryUrl ?? null,
        p_images: rpcImages,
        p_tag_ids: rpcTagIds,
        p_item_ids: rpcItemIds
      })
      .single()

    const { data: project, error: rpcError } = rpcRes
    const createdProject = project as { id?: string } | null

    if (rpcError) {
      console.error('Project creation RPC error:', rpcError)
      // 어떤 RPC 에러든 폴백 수행
      // 1) slug 생성 (서버에서 동일 로직으로 최대한 일치)
      const baseSlug = (name || '')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50)

      let newSlug = baseSlug
      let counter = 0
      // 슬러그 중복 체크
      while (true) {
        const { data: slugExists, error: slugErr } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('slug', newSlug)
          .limit(1)
        if (slugErr) break
        if (!slugExists || slugExists.length === 0) break
        counter += 1
        newSlug = `${baseSlug}-${counter}`
      }

      // 2) projects 삽입
      const { data: insertedProject, error: insertErr } = await supabaseAdmin
        .from('projects')
        .insert({
          title: name,
          description: description ?? null,
          location: location ?? null,
          year: completionYear ?? null,
          area: area ?? null,
          status: status || 'draft',
          inquiry_url: inquiryUrl ?? null,
          slug: newSlug,
        })
        .select('*')
        .single()

      if (insertErr || !insertedProject) {
        return NextResponse.json(
          {
            success: false,
            error: '프로젝트 생성에 실패했습니다.',
            ...(process.env.NODE_ENV === 'development' && { details: (insertErr || {}).message })
          },
          { status: 500 }
        )
      }

      const projectId = insertedProject.id

      // 3) 이미지 삽입
      if (formattedImages.length > 0) {
        const imagesRows = formattedImages.map((img: any) => ({
          project_id: projectId,
          image_url: img.image_url,
          order: img.order,
        }))
        const { error: imagesErr } = await supabaseAdmin.from('project_images').insert(imagesRows)
        if (imagesErr) {
          console.error('project_images insert error:', imagesErr)
        }
      }

      // 4) 태그 연결
      if (tags && tags.length > 0) {
        const tagRows = tags.map((tagId: string) => ({ project_id: projectId, tag_id: tagId }))
        const { error: tagsErr } = await supabaseAdmin.from('project_tags').insert(tagRows)
        if (tagsErr) {
          console.error('project_tags insert error:', tagsErr)
        }
      }

      // 5) 사진 연결 (photos 배열이 있는 경우 - 새로운 방식)
      if (photos && photos.length > 0) {
        const photoRows = buildProjectPhotoRows(projectId, photos)
        const { error: photosErr } = await supabaseAdmin.from('project_photos').insert(photoRows)
        if (photosErr) {
          console.error('project_photos insert error:', photosErr)
          return NextResponse.json(
            { success: false, error: `사진 연결에 실패했습니다: ${photosErr.message}` },
            { status: 500 }
          )
        }
      }

      // 6) 아이템 연결 (legacy 방식 - connectedItems가 있는 경우)
      if (connectedItems && connectedItems.length > 0) {
        const itemRows = connectedItems.map((itemId: string) => ({ project_id: projectId, item_id: itemId }))
        const { error: itemsErr } = await supabaseAdmin.from('project_items').insert(itemRows)
        if (itemsErr) {
          console.error('project_items insert error:', itemsErr)
        }
      }

      // 7) 삽입된 프로젝트를 조회하여 기존 응답 형태로 반환
      const { data: fullProject, error: fetchErr } = await supabaseAdmin
        .from('projects')
        .select(projectSelect)
        .eq('id', projectId)
        .single()

      if (fetchErr || !fullProject) {
        return NextResponse.json(
          { success: true, data: insertedProject, message: '프로젝트가 생성되었습니다. (부분 데이터)' }
        )
      }

      return NextResponse.json({ success: true, data: transformProject(fullProject), message: '프로젝트가 성공적으로 생성되었습니다.' })
    }

    if (createdProject?.id && photos && photos.length > 0) {
      const photoRows = buildProjectPhotoRows(createdProject.id, photos)
      const { error: photosErr } = await supabaseAdmin.from('project_photos').insert(photoRows)
      if (photosErr) {
        console.error('project_photos insert error:', photosErr)
        return NextResponse.json(
          { success: false, error: `사진 연결에 실패했습니다: ${photosErr.message}` },
          { status: 500 }
        )
      }
    }

    if (createdProject?.id) {
      const { data: fullProject, error: fetchErr } = await supabaseAdmin
        .from('projects')
        .select(projectSelect)
        .eq('id', createdProject.id)
        .single()

      if (!fetchErr && fullProject) {
        return NextResponse.json({
          success: true,
          data: transformProject(fullProject),
          message: '프로젝트가 성공적으로 생성되었습니다.'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: project,
      message: '프로젝트가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Project creation error:', error)
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
