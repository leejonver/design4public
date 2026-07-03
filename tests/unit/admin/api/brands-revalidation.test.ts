import { vi, describe, it, expect, afterEach, type Mock } from 'vitest'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { SessionUser } from '@/lib/auth'
import { PUT } from '@/app/api/admin/brands/[id]/route'
import { requireUser, requireRole } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

vi.mock('@/lib/auth', () => {
  class AuthError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'AuthError'
      this.status = status
    }
  }
  const authErrorResponse = (error: unknown) => {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: error.status,
        headers: { 'content-type': 'application/json' },
      })
    }
    throw error
  }
  return { AuthError, authErrorResponse, requireUser: vi.fn(), requireRole: vi.fn() }
})

vi.mock('@/lib/supabase/server', () => {
  const from = vi.fn()
  return { createServerSupabase: () => ({ from }) }
})

vi.mock('@/lib/search/indexer', () => ({
  reindexEntity: vi.fn().mockResolvedValue(undefined),
  deleteFromIndex: vi.fn().mockResolvedValue(undefined),
}))

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json' },
  })
}

type QBResult = { data: unknown; error: unknown; count?: number }
function makeQB(result: QBResult): Record<string, unknown> {
  const qb: Record<string, unknown> = {}
  ;['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'or', 'order', 'range', 'limit', 'single', 'maybeSingle', 'in', 'not'].forEach(
    (m) => (qb[m] = vi.fn(() => qb)),
  )
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = (createServerSupabase() as unknown as { from: Mock }).from
const revalidateMock = vi.mocked(revalidatePath)
const fakeUser: SessionUser = { id: 'u1', email: 'a@b.c', name: 'admin', role: 'master', status: 'approved' }

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/admin/brands/b1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest
}

describe('brands PUT revalidation wiring (rename)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    fromMock.mockReset()
    revalidateMock.mockReset()
  })

  it('revalidates both the old and new slug when the name change regenerates the slug', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    vi.mocked(requireUser).mockResolvedValue(fakeUser)
    vi.mocked(requireRole).mockResolvedValue(fakeUser)

    fromMock
      .mockReturnValueOnce(makeQB({ data: { slug: 'old-brand' }, error: null })) // pre-fetch old slug
      .mockReturnValueOnce(makeQB({ data: { name_ko: '올드브랜드' }, error: null })) // rename-detection fetch
      .mockReturnValueOnce(makeQB({ data: null, error: null })) // uniqueSlug dup check (no collision)
      .mockReturnValueOnce(makeQB({ data: null, error: null })) // update
      .mockReturnValueOnce(makeQB({ data: { id: 'b1', slug: 'new-brand' }, error: null })) // final select

    const res = await PUT(makeRequest({ nameKo: '뉴브랜드' }), { params: { id: 'b1' } })
    expect(res.status).toBe(200)

    const paths = revalidateMock.mock.calls.map((c) => c[0])
    expect(paths).toContain('/brands/new-brand')
    expect(paths).toContain('/brands/old-brand')
  })

  it('revalidates the slug only once when the name (and slug) is unchanged', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    vi.mocked(requireUser).mockResolvedValue(fakeUser)
    vi.mocked(requireRole).mockResolvedValue(fakeUser)

    fromMock
      .mockReturnValueOnce(makeQB({ data: { slug: 'same-brand' }, error: null })) // pre-fetch old slug
      .mockReturnValueOnce(makeQB({ data: null, error: null })) // update (status only)
      .mockReturnValueOnce(makeQB({ data: { id: 'b1', slug: 'same-brand' }, error: null })) // final select

    const res = await PUT(makeRequest({ status: 'hidden' }), { params: { id: 'b1' } })
    expect(res.status).toBe(200)

    const ownDetailCalls = revalidateMock.mock.calls.filter((c) => c[0] === '/brands/same-brand')
    expect(ownDetailCalls).toHaveLength(1)
  })
})
