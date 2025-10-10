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
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 필터
    if (search) {
      query = query.or(`name_ko.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: brands, error, count } = await query

    if (error) {
      console.error('Brands fetch error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '브랜드 목록을 가져오는데 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      )
    }

    // 데이터 변환
    const transformedBrands = brands?.map(brand => ({
      id: brand.id,
      name: brand.name_ko, // 기본 이름을 name_ko로 설정
      nameKo: brand.name_ko,
      nameEn: brand.name_en,
      description: brand.description || '',
      logoImageUrl: brand.logo_image_url,
      coverImageUrl: brand.cover_image_url,
      websiteUrl: brand.website_url,
      slug: brand.slug,
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
    const { nameKo, nameEn, description, websiteUrl, logoImageUrl, coverImageUrl } = body

    if (!nameKo) {
      return NextResponse.json(
        { success: false, error: '브랜드 한글 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // slug 생성: 영문명이 있으면 사용, 없으면 한글명 기반으로 생성
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) // 최대 길이 제한
    }

    const baseSlug = nameEn ? generateSlug(nameEn) : generateSlug(nameKo)
    
    // slug 중복 확인
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('brands')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .insert({
        name_ko: nameKo,
        name_en: nameEn,
        description,
        website_url: websiteUrl,
        logo_image_url: logoImageUrl,
        cover_image_url: coverImageUrl,
        slug
      })
      .select('*')
      .single()

    if (error) {
      console.error('Brand creation error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: '브랜드 생성에 실패했습니다.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
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
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      },
      { status: 500 }
    )
  }
}
