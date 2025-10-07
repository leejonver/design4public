import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: item, error } = await supabase
      .from('items')
      .select(`
        *,
        brands(*),
        tags(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Item fetch error:', error)
      return NextResponse.json(
        { success: false, error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 데이터 변환
    const transformedItem = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      images: item.image_url ? [{
        id: `item_${item.id}`,
        url: item.image_url,
        alt: item.name,
        isMain: true
      }] : [],
      mallUrl: item.nara_url,
      brand: item.brands,
      tags: item.tags || [],
      status: item.status || 'available',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedItem
    })

  } catch (error) {
    console.error('Item API error:', error)
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
    const { name, description, mallUrl, brandId, images, tags, status } = body

    console.log('Update item request:', { id, name, description, mallUrl, brandId, images, tags, status })

    // 아이템 기본 정보 업데이트
    const updateData: any = {
      name,
      description,
      brand_id: brandId,
      status: status,
      updated_at: new Date().toISOString()
    }
    
    // nara_url과 image_url은 값이 있을 때만 업데이트 (null 제외)
    if (mallUrl !== undefined && mallUrl !== null) {
      updateData.nara_url = mallUrl
    }
    if (images && images.length > 0 && images[0]) {
      updateData.image_url = images[0]
    }
    
    console.log('Update data:', updateData)

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Item update error:', error)
      return NextResponse.json(
        { success: false, error: '아이템 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 태그 업데이트
    if (tags && Array.isArray(tags)) {
      // 기존 태그 삭제
      const { error: deleteError } = await supabaseAdmin
        .from('item_tags')
        .delete()
        .eq('item_id', id)

      if (deleteError) {
        console.warn('Failed to delete existing item_tags:', deleteError)
        // 에러가 있어도 계속 진행 (테이블이 없을 수 있음)
      }

      // 새 태그 추가
      if (tags.length > 0) {
        const itemTags = tags.map(tagId => ({
          item_id: id,
          tag_id: tagId
        }))

        const { error: insertError } = await supabaseAdmin
          .from('item_tags')
          .insert(itemTags)

        if (insertError) {
          console.warn('Failed to insert item_tags:', insertError)
          // 에러가 있어도 계속 진행 (테이블이 없을 수 있음)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: '아이템이 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Item update error:', error)
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

    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Item deletion error:', error)
      return NextResponse.json(
        { success: false, error: '아이템 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '아이템이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Item deletion error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
