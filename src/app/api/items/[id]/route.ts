import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
        brands(*)
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
      tags: [], // 태그는 별도 테이블에서 가져와야 함
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
    const { name, description, mallUrl, brandId, status, images } = body

    const { data: item, error } = await supabase
      .from('items')
      .update({
        name,
        description,
        brand_id: brandId,
        nara_url: mallUrl,
        image_url: images?.[0]?.url,
        status,
        updated_at: new Date().toISOString()
      })
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

    const { error } = await supabase
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
