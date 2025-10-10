import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: brand, error } = await supabaseAdmin
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
      name: brand.name_ko,
      nameKo: brand.name_ko,
      nameEn: brand.name_en,
      description: brand.description || '',
      logoImageUrl: brand.logo_image_url,
      coverImageUrl: brand.cover_image_url,
      websiteUrl: brand.website_url,
      slug: brand.slug,
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
    const { nameKo, nameEn, description, websiteUrl, logoImageUrl, coverImageUrl } = body

    console.log('Received brand update data:', body); // 데이터 로깅

    if (!nameKo) {
      return NextResponse.json(
        { success: false, error: '브랜드 한글 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // 기존 브랜드 정보 가져오기 (slug 비교를 위해)
    const { data: existingBrand } = await supabaseAdmin
      .from('brands')
      .select('slug, name_en')
      .eq('id', id)
      .single()

    // slug 생성 함수
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
    }

    // slug 업데이트 로직: 이름이 변경된 경우에만 slug 재생성
    let slug = existingBrand?.slug
    const nameChanged = nameEn !== existingBrand?.name_en
    
    if (nameChanged) {
      const baseSlug = nameEn ? generateSlug(nameEn) : generateSlug(nameKo)
      slug = baseSlug
      
      // slug 중복 확인 (자기 자신 제외)
      let counter = 1
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('brands')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single()
        
        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .update({
        name_ko: nameKo,
        name_en: nameEn,
        description,
        website_url: websiteUrl,
        logo_image_url: logoImageUrl,
        cover_image_url: coverImageUrl,
        slug,
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

    const { error } = await supabaseAdmin
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
