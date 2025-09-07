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
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: brands, error, count } = await query

    if (error) {
      console.error('Brands fetch error:', error)
      return NextResponse.json(
        { success: false, error: '브랜드 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedBrands = brands?.map(brand => ({
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
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        items: transformedBrands,
        total: count || 0,
        page,
        limit
      }
    })

  } catch (error) {
    console.error('Brands API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, websiteUrl, status, logoImage, coverImage } = body

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        name,
        description,
        website_url: websiteUrl,
        status: status || 'visible',
        logo_image_url: logoImage?.url,
        cover_image_url: coverImage?.url
      })
      .select()
      .single()

    if (error) {
      console.error('Brand creation error:', error)
      return NextResponse.json(
        { success: false, error: '브랜드 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: brand,
      message: '브랜드가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Brand creation error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
