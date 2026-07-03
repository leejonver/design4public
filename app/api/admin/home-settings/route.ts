import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireUser, requireRole, authErrorResponse } from '@/lib/auth'
import type { HomeFeaturedItem } from '@/lib/admin-types'

type EntityType = 'project' | 'item' | 'photo' | 'brand'
const ENTITY_TYPES: EntityType[] = ['project', 'item', 'photo', 'brand']

export async function GET() {
  try {
    await requireUser()
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('featured_project_id')
      .eq('id', true)
      .maybeSingle()
    const { data: featured, error } = await supabaseAdmin
      .from('home_featured')
      .select('entity_type, entity_id, order')
      .order('entity_type', { ascending: true })
      .order('order', { ascending: true })
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        featuredProjectId: settings?.featured_project_id ?? null,
        featured: (featured ?? []).map((f) => ({
          entityType: f.entity_type,
          entityId: f.entity_id,
          order: f.order,
        })) as HomeFeaturedItem[],
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Home settings GET error:', error)
    return NextResponse.json({ success: false, error: '홈 설정을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const body = await request.json()
    const featuredProjectId: string | null = body.featuredProjectId ?? null
    const featured: { entityType: string; entityId: string }[] = Array.isArray(body.featured)
      ? body.featured
      : []

    const { error: sErr } = await supabaseAdmin
      .from('site_settings')
      .update({ featured_project_id: featuredProjectId })
      .eq('id', true)
    if (sErr) throw sErr

    // replace the whole featured list, order = per-type index
    await supabaseAdmin.from('home_featured').delete().neq('entity_id', '00000000-0000-0000-0000-000000000000')
    const perType: Record<string, number> = {}
    const rows = featured
      .filter((f) => ENTITY_TYPES.includes(f.entityType as EntityType) && f.entityId)
      .map((f) => {
        const order = perType[f.entityType] ?? 0
        perType[f.entityType] = order + 1
        return { entity_type: f.entityType as EntityType, entity_id: f.entityId, order }
      })
    if (rows.length) {
      const { error: fErr } = await supabaseAdmin.from('home_featured').insert(rows)
      if (fErr) throw fErr
    }

    return NextResponse.json({ success: true, message: '홈 설정이 저장되었습니다.' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Home settings PUT error:', error)
    return NextResponse.json({ success: false, error: '홈 설정 저장에 실패했습니다.' }, { status: 500 })
  }
}
