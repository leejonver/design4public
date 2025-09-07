import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Brand fetch error:', error)
      return NextResponse.json(
        { success: false, error: '브랜드를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 데이터 변환
    const transformedBrand = {
      id: brand.id,
      name: brand.name,
      description: brand.description || '',
      logoImage: brand.logo_image_url ? {
        id: `logo_${brand.id}`,
        url: brand.logo_image_url,
        alt: `${brand.name} 로고`
      } : undefined,
      coverImage: brand.cover_image_url ? {
        id: `cover_${brand.id}`,
        url: brand.cover_image_url,
        alt: `${brand.name} 커버 이미지`
      } : undefined,
      websiteUrl: brand.website_url,
      status: brand.status || 'visible',
      createdAt: brand.created_at,
      updatedAt: brand.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedBrand
    })

  } catch (error) {
    console.error('Brand API error:', error)
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
    const { name, description, websiteUrl, status, logoImage, coverImage } = body

    const { data: brand, error } = await supabase
      .from('brands')
      .update({
        name,
        description,
        website_url: websiteUrl,
        status,
        logo_image_url: logoImage?.url,
        cover_image_url: coverImage?.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Brand update error:', error)
      return NextResponse.json(
        { success: false, error: '브랜드 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: brand,
      message: '브랜드가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Brand update error:', error)
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
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Brand deletion error:', error)
      return NextResponse.json(
        { success: false, error: '브랜드 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '브랜드가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Brand deletion error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
