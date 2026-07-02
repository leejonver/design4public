import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import { BRAND_SELECT, mapBrand } from '@/lib/dto'
import { uniqueSlug } from '@/lib/slug'
import { revalidateEntity } from '@/lib/revalidation'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', params.id)
      .single()
    if (error || !data) {
      return NextResponse.json({ success: false, error: '브랜드를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapBrand(data) })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Brand GET error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const { nameKo, nameEn, description, logoImageUrl, coverImageUrl, websiteUrl, status } = body

    // Capture the pre-update slug so a rename can purge both the old and new detail pages.
    const { data: beforeUpdate } = await supabaseAdmin
      .from('brands')
      .select('slug')
      .eq('id', params.id)
      .maybeSingle()

    const update: Record<string, unknown> = {}
    if (nameKo !== undefined) update.name_ko = nameKo
    if (nameEn !== undefined) update.name_en = nameEn
    if (description !== undefined) update.description = description
    if (logoImageUrl !== undefined) update.logo_image_url = logoImageUrl
    if (coverImageUrl !== undefined) update.cover_image_url = coverImageUrl
    if (websiteUrl !== undefined) update.website_url = websiteUrl
    if (status !== undefined) update.status = status

    // Regenerate slug only if name_ko actually changes; preserve existing slug otherwise.
    if (nameKo !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from('brands')
        .select('name_ko')
        .eq('id', params.id)
        .single()
      if (existing && existing.name_ko !== nameKo) {
        update.slug = await uniqueSlug(nameKo, async (s) => {
          const { data } = await supabaseAdmin
            .from('brands')
            .select('id')
            .eq('slug', s)
            .neq('id', params.id)
            .maybeSingle()
          return !!data
        })
      }
    }

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from('brands').update(update).eq('id', params.id)
      if (error) throw error
    }

    const { data: full } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', params.id)
      .single()

    // BRAND_SELECT is a bare `*`, but the generated Database type's `Row` for
    // this query resolves too loosely for direct property access — narrow it.
    const newSlug = (full as { slug?: string } | null)?.slug

    // On a rename the slug changes; revalidate the new slug's detail page, and
    // the old slug too so its now-stale page purges immediately instead of
    // waiting on the 3600s ISR backstop.
    revalidateEntity('brand', newSlug)
    if (beforeUpdate?.slug && newSlug && beforeUpdate.slug !== newSlug) {
      revalidateEntity('brand', beforeUpdate.slug)
    }

    return NextResponse.json({
      success: true,
      data: full ? mapBrand(full) : null,
      message: '브랜드가 수정되었습니다.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Brand PUT error:', error)
    return NextResponse.json({ success: false, error: '브랜드 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('content_manager')
    // Capture the slug before deletion so we can purge the brand's detail page.
    const { data: existing } = await supabaseAdmin
      .from('brands')
      .select('slug')
      .eq('id', params.id)
      .maybeSingle()
    // §6-3: detach the brand's items first (items.brand_id -> NULL) before deleting the brand,
    // so the brand FK can never block the delete.
    const { error: detachError } = await supabaseAdmin
      .from('items')
      .update({ brand_id: null })
      .eq('brand_id', params.id)
    if (detachError) throw detachError

    const { error } = await supabaseAdmin.from('brands').delete().eq('id', params.id)
    if (error) throw error
    // Detaching items cleared their brand — refresh item surfaces too.
    revalidateEntity('brand', existing?.slug)
    revalidateEntity('item')
    return NextResponse.json({ success: true, message: '브랜드가 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Brand DELETE error:', error)
    return NextResponse.json({ success: false, error: '브랜드 삭제에 실패했습니다.' }, { status: 500 })
  }
}
