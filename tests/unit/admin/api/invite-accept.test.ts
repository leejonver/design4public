import { vi, type Mock, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'
import { POST as acceptPost } from '@/app/api/admin/invite/accept/route'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/server', () => {
  const auth = { getUser: vi.fn() }
  return { createServerSupabase: vi.fn(async () => ({ auth })) }
})
vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json' },
  })
}
type QBResult = { data: unknown; error: unknown }
function makeQB(result: QBResult): Record<string, unknown> {
  const qb: Record<string, unknown> = {}
  for (const m of ['select', 'update', 'eq', 'single']) qb[m] = vi.fn(() => qb)
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}
const fromMock = supabaseAdmin.from as unknown as Mock
const getAuth = async () => (await createServerSupabase()).auth as unknown as { getUser: Mock }

describe('POST /api/admin/invite/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
  })
  afterEach(() => vi.restoreAllMocks())

  it('세션이 없으면 401', async () => {
    ;(await getAuth()).getUser.mockResolvedValue({ data: { user: null } })
    const res = await acceptPost()
    expect(res.status).toBe(401)
  })

  it('pending 프로필을 approved 로 승격한다', async () => {
    ;(await getAuth()).getUser.mockResolvedValue({
      data: { user: { id: 'u1', invited_at: '2026-07-01T00:00:00Z' } },
    })
    const selectQB = makeQB({ data: { id: 'u1', status: 'pending' }, error: null })
    const updateQB = makeQB({ data: null, error: null })
    fromMock.mockReturnValueOnce(selectQB).mockReturnValueOnce(updateQB)

    const res = await acceptPost()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(updateQB.update as Mock).toHaveBeenCalledWith({ status: 'approved' })
  })

  it('초대되지 않은(invited_at 없는) 계정은 403, update 호출 안 됨', async () => {
    ;(await getAuth()).getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const selectQB = makeQB({ data: { id: 'u1', status: 'pending' }, error: null })
    const updateQB = makeQB({ data: null, error: null })
    fromMock.mockReturnValueOnce(selectQB).mockReturnValueOnce(updateQB)

    const res = await acceptPost()
    const json = await res.json()
    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
    expect(updateQB.update as Mock).not.toHaveBeenCalled()
  })
})
