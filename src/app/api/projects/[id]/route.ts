import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Project fetch error:', error)
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 데이터 변환
    const transformedProject = {
      id: project.id,
      name: project.title,
      description: project.description || '',
      location: project.location || '', // location 필드가 없으면 빈 문자열로 설정
      completionYear: project.year || new Date().getFullYear(),
      area: project.area, // 면적은 선택사항이므로 null/undefined 허용
      images: project.project_images?.map((img: any, index: number) => ({
        id: img.id,
        url: img.image_url,
        alt: project.title,
        isMain: index === 0
      })) || [],
      tags: [], // 일단 빈 배열로 설정
      connectedItems: [], // 일단 빈 배열로 설정
      inquiryUrl: project.inquiry_url || '',
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedProject
    })

  } catch (error) {
    console.error('Project API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, location, completionYear, area, tags, connectedItems, inquiryUrl, status, images } = body

    // 프로젝트 업데이트
    const updateData: any = {
      title: name,
      description,
      location,
      year: completionYear,
      area,
      status,
      updated_at: new Date().toISOString()
    };
    
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (projectError) {
      console.error('Project update error:', projectError)
      return NextResponse.json(
        { success: false, error: '프로젝트 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 기존 이미지 삭제
    await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', id)

    // 새 이미지 저장
    if (images && images.length > 0) {
      const imageInserts = images.map((img: any, index: number) => ({
        project_id: id,
        image_url: img.url,
        order: index
      }))

      const { error: imageError } = await supabaseAdmin
        .from('project_images')
        .insert(imageInserts)
      
      if (imageError) {
        console.error('Image insert error:', imageError)
        return NextResponse.json(
          { success: false, error: `이미지 저장에 실패했습니다: ${imageError.message}` },
          { status: 500 }
        )
      }
    }

    // 기존 태그 연결 삭제
    await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', id)

    // 새 태그 연결
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        project_id: id,
        tag_id: tagId
      }))

      await supabaseAdmin
        .from('project_tags')
        .insert(tagInserts)
    }

    // 기존 아이템 연결 삭제
    await supabaseAdmin
      .from('project_items')
      .delete()
      .eq('project_id', id)

    // 새 아이템 연결
    if (connectedItems && connectedItems.length > 0) {
      const itemInserts = connectedItems.map((itemId: string) => ({
        project_id: id,
        item_id: itemId
      }))

      await supabaseAdmin
        .from('project_items')
        .insert(itemInserts)
    }

    return NextResponse.json({
      success: true,
      data: project,
      message: '프로젝트가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 관련 데이터 삭제
    await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', id)

    await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', id)

    await supabaseAdmin
      .from('project_items')
      .delete()
      .eq('project_id', id)

    // 프로젝트 삭제
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Project deletion error:', error)
      return NextResponse.json(
        { success: false, error: '프로젝트 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '프로젝트가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
