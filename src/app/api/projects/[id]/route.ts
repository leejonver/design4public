import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildProjectPhotoRows, projectSelect, transformProject } from '../project-response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(projectSelect)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Project fetch error:', error)
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transformProject(project)
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
    const { name, description, location, completionYear, area, tags, connectedItems, inquiryUrl, status, images, photos } = body

    // 프로젝트 업데이트
    const updateData: any = {
      title: name,
      description,
      location,
      year: completionYear,
      area,
      inquiry_url: inquiryUrl,
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

    if (images !== undefined) {
      await supabaseAdmin
        .from('project_images')
        .delete()
        .eq('project_id', id)

      if (images.length > 0) {
        const imageInserts = images.map((img: any, index: number) => ({
          project_id: id,
          image_url: img.url,
          alt_text: img.alt ?? null,
          is_main: img.isMain ?? index === 0,
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
    }

    if (photos !== undefined) {
      await supabaseAdmin
        .from('project_photos')
        .delete()
        .eq('project_id', id)

      if (photos.length > 0) {
        const photoInserts = buildProjectPhotoRows(id, photos)

        const { error: photosError } = await supabaseAdmin
          .from('project_photos')
          .insert(photoInserts)

        if (photosError) {
          console.error('Photos insert error:', photosError)
          return NextResponse.json(
            { success: false, error: `사진 연결에 실패했습니다: ${photosError.message}` },
            { status: 500 }
          )
        }
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

      const { error: tagsError } = await supabaseAdmin
        .from('project_tags')
        .insert(tagInserts)
      
      if (tagsError) {
        console.error('Tags insert error:', tagsError)
        return NextResponse.json(
          { success: false, error: `태그 저장에 실패했습니다: ${tagsError.message}` },
          { status: 500 }
        )
      }
    }

    if (connectedItems !== undefined) {
      await supabaseAdmin
        .from('project_items')
        .delete()
        .eq('project_id', id)

      if (connectedItems.length > 0) {
        const itemInserts = connectedItems.map((itemId: string) => ({
          project_id: id,
          item_id: itemId
        }))

        const { error: itemsError } = await supabaseAdmin
          .from('project_items')
          .insert(itemInserts)

        if (itemsError) {
          console.error('Items insert error:', itemsError)
          return NextResponse.json(
            { success: false, error: `아이템 연결에 실패했습니다: ${itemsError.message}` },
            { status: 500 }
          )
        }
      }
    }

    const { data: fullProject, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select(projectSelect)
      .eq('id', id)
      .single()

    if (fetchError || !fullProject) {
      console.error('Updated project fetch error:', fetchError)
      return NextResponse.json({
        success: true,
        data: project,
        message: '프로젝트가 성공적으로 업데이트되었습니다.'
      })
    }

    return NextResponse.json({
      success: true,
      data: transformProject(fullProject),
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

    await supabaseAdmin
      .from('project_photos')
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
