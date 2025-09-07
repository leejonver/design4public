import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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
      .select(`
        *,
        project_images(*),
        project_tags(
          tags(*)
        ),
        project_items(
          items(
            *,
            brands(*)
          )
        )
      `)
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
        { success: false, error: '프로젝트 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터 변환 (프론트엔드 타입에 맞게)
    const transformedProjects = projects?.map(project => ({
      id: project.id,
      name: project.title,
      description: project.description || '',
      location: project.location || '',
      completionYear: project.completion_year || new Date().getFullYear(),
      area: project.area || 0,
      images: project.project_images?.map((img: any, index: number) => ({
        id: img.id,
        url: img.image_url,
        alt: img.alt_text || project.title,
        isMain: img.is_main || index === 0
      })) || [],
      tags: project.project_tags?.map((pt: any) => pt.tags) || [],
      connectedItems: project.project_items?.map((pi: any) => ({
        ...pi.items,
        brand: pi.items.brands
      })) || [],
      inquiryUrl: project.inquiry_url,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    })) || []

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
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, location, completionYear, area, tags, connectedItems, inquiryUrl, status, images } = body

    // 프로젝트 생성
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title: name,
        description,
        year: completionYear,
        area,
        status: status || 'draft'
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json(
        { success: false, error: `프로젝트 생성에 실패했습니다: ${projectError.message}` },
        { status: 500 }
      )
    }

    // 이미지 저장
    if (images && images.length > 0) {
      const imageInserts = images.map((img: any, index: number) => ({
        project_id: project.id,
        image_url: img.url,
        alt_text: img.alt,
        is_main: img.isMain || index === 0,
        order: index
      }))

      const { error: imageError } = await supabaseAdmin
        .from('project_images')
        .insert(imageInserts)

      if (imageError) {
        console.error('Image insertion error:', imageError)
      }
    }

    // 태그 연결
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        project_id: project.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabaseAdmin
        .from('project_tags')
        .insert(tagInserts)

      if (tagError) {
        console.error('Tag insertion error:', tagError)
      }
    }

    // 아이템 연결
    if (connectedItems && connectedItems.length > 0) {
      const itemInserts = connectedItems.map((itemId: string) => ({
        project_id: project.id,
        item_id: itemId
      }))

      const { error: itemError } = await supabaseAdmin
        .from('project_items')
        .insert(itemInserts)

      if (itemError) {
        console.error('Item insertion error:', itemError)
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
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
