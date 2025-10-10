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
      `, { count: 'exact' })
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

    // 데이터 변환 (프론트엔드 타입에 맞게)
    const transformedProjects = projects?.map(project => ({
      id: project.id,
      name: project.title,
      description: project.description || '',
      location: project.location || '',
      completionYear: project.year, // 기본값을 null 또는 undefined로 유지
      area: project.area, // 면적은 선택사항이므로 null/undefined 허용
      images: project.project_images?.map((img: any, index: number) => ({
        id: img.id,
        url: img.image_url,
        alt: img.alt_text || project.title,
        isMain: img.is_main || index === 0
      })) || [],
      tags: project.project_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
      connectedItems: project.project_items?.map((pi: any) => ({
        ...pi.items,
        brand: pi.items?.brands
      })) || [],
      inquiryUrl: project.inquiry_url || '',
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
    const { name, description, location, completionYear, area, tags, connectedItems, inquiryUrl, status, images } = body

    // RPC 호출을 위한 이미지 데이터 포맷팅
    const formattedImages = images?.map((img: any, index: number) => ({
      image_url: img.url,
      alt_text: img.alt,
      is_main: img.isMain || index === 0,
      order: index
    })) || []

    const { data: project, error: rpcError } = await supabaseAdmin
      .rpc('create_project_with_relations', {
        p_title: name,
        p_description: description,
        p_location: location,
        p_year: completionYear,
        p_area: area ?? null, // undefined를 null로 변환
        p_status: status || 'draft',
        p_inquiry_url: inquiryUrl,
        p_images: formattedImages,
        p_tag_ids: tags || [],
        p_item_ids: connectedItems || []
      })
      .single()

    if (rpcError) {
      console.error('Project creation RPC error:', rpcError)
      return NextResponse.json(
        { 
          success: false, 
          error: '프로젝트 생성에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: rpcError.message })
        },
        { status: 500 }
      )
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
