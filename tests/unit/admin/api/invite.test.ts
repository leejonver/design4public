import { vi, type Mock, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'
import { POST as invitePost } from '@/app/api/admin/managers/invite/route'
import { supabaseAdmin } from '@/lib/supabase/admin'

vi.mock('@/lib/auth', async (orig) => {
  const actual = await orig<typeof import('@/lib/auth')>()
  return {
    ...actual,
    requireRole: vi.fn(async () => ({
      id: 'master-id', email: 'm@d4p.test', name: 'M', role: 'master', status: 'approved',
    })),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { inviteUserByEmail: vi.fn(), deleteUser: vi.fn() } },
  },
}))

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json' },
  })
}

type QBResult = { data: unknown; error: unknown }
function makeQB(result: QBResult): Record<string, unknown> {
  const qb: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'maybeSingle', 'single']) {
    qb[m] = vi.fn(() => qb)
  }
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = supabaseAdmin.from as unknown as Mock
const invite = supabaseAdmin.auth.admin.inviteUserByEmail as unknown as Mock
const deleteUser = supabaseAdmin.auth.admin.deleteUser as unknown as Mock

function req(body: Record<string, unknown>): Request {
  return new Request('http://127.0.0.1:3000/api/admin/managers/invite', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/admin/managers/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
  })
  afterEach(() => vi.restoreAllMocks())

  it('잘못된 이메일이면 400', async () => {
    const res = await invitePost(req({ email: 'nope', role: 'admin' }) as never)
    expect(res.status).toBe(400)
  })

  it('신규 이메일을 초대하고 pending 프로필을 upsert 한다', async () => {
    // 1st from(): existing lookup → none. 2nd: upsert. 3rd: re-read.
    const lookupQB = makeQB({ data: null, error: null })
    const upsertQB = makeQB({ data: null, error: null })
    const readQB = makeQB({
      data: { id: 'new-id', email: 'new@d4p.test', name: null, role: 'admin', status: 'pending', last_login_at: null, created_at: 'now', updated_at: 'now' },
      error: null,
    })
    fromMock.mockReturnValueOnce(lookupQB).mockReturnValueOnce(upsertQB).mockReturnValueOnce(readQB)
    invite.mockResolvedValue({ data: { user: { id: 'new-id' } }, error: null })

    const res = await invitePost(req({ email: 'new@d4p.test', role: 'admin' }) as never)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(invite).toHaveBeenCalledWith('new@d4p.test', {
      redirectTo: 'http://127.0.0.1:3000/admin/invite/accept',
    })
    expect(upsertQB.upsert as Mock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-id', role: 'admin', status: 'pending' }),
      expect.anything(),
    )
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('이미 활성화된 이메일이면 409', async () => {
    fromMock.mockReturnValueOnce(makeQB({ data: { id: 'x', status: 'approved' }, error: null }))
    const res = await invitePost(req({ email: 'active@d4p.test', role: 'admin' }) as never)
    expect(res.status).toBe(409)
    expect(invite).not.toHaveBeenCalled()
  })
})
