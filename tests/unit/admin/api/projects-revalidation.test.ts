import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { SessionUser } from '@/lib/auth'
import { POST } from '@/app/api/admin/projects/route'
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

vi.mock('@/lib/image-sync', () => ({
  syncProjectPhotos: vi.fn().mockResolvedValue(undefined),
  syncProjectItems: vi.fn().mockResolvedValue(undefined),
  syncCategories: vi.fn().mockResolvedValue(undefined),
  syncFreeTags: vi.fn().mockResolvedValue(undefined),
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
  ;['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'or', 'order', 'range', 'limit', 'single', 'maybeSingle', 'in', 'not'].forEach(
    (m) => (qb[m] = vi.fn(() => qb)),
  )
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = (createServerSupabase() as unknown as { from: Mock }).from
const revalidateMock = vi.mocked(revalidatePath)
const revalidateTagMock = vi.mocked(revalidateTag)
const fakeUser: SessionUser = { id: 'u1', email: 'a@b.c', name: 'admin', role: 'master', status: 'approved' }

const projectRow = { id: 'p1', title: 'T', description: '', slug: 'test-project', status: 'published', project_tags: [], project_items: [], project_photos: [], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }

function makeRequest(url: string, body: unknown): NextRequest {
  return new Request(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) as unknown as NextRequest
}

// POST does: slug-dup check → insert → final select. Three from() calls.
function primePostSuccess() {
  fromMock
    .mockReturnValueOnce(makeQB({ data: null, error: null })) // slug dup check
    .mockReturnValueOnce(makeQB({ data: { id: 'p1' }, error: null })) // insert
    .mockReturnValueOnce(makeQB({ data: projectRow, error: null })) // final select
}

describe('projects POST revalidation wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    vi.mocked(requireUser).mockResolvedValue(fakeUser)
    vi.mocked(requireRole).mockResolvedValue(fakeUser)
  })
  // vitest 3.2.x quirk: resetting mocks in beforeEach after a throwing
  // mockImplementation was set in a previous test leaks into the next test's
  // setup phase. Reset in afterEach instead (brief specified beforeEach).
  afterEach(() => {
    vi.restoreAllMocks()
    fromMock.mockReset()
    revalidateMock.mockReset()
    revalidateTagMock.mockReset()
  })

  it('revalidates the project routes on a successful create', async () => {
    primePostSuccess()
    const res = await POST(makeRequest('http://localhost/api/admin/projects', { name: '새 프로젝트' }))
    expect(res.status).toBe(201)
    const paths = revalidateMock.mock.calls.map((c) => c[0])
    // uses the freshly generated slug for the detail path
    expect(paths).toContain('/')
    expect(paths).toContain('/projects')
    expect(paths).toContain('/sitemap.xml')
    expect(paths.some((p) => p.startsWith('/projects/'))).toBe(true)
    // Cross-entity detail pages are purged by per-table tag (a dynamic-pattern
    // revalidatePath does not invalidate already-cached concrete pages).
    expect(revalidateTagMock).toHaveBeenCalledWith('sb:items')
    expect(revalidateTagMock).toHaveBeenCalledWith('sb:brands')
  })

  it('still returns 201 when revalidatePath throws (mutation is primary)', async () => {
    primePostSuccess()
    revalidateMock.mockImplementation(() => {
      throw new Error('revalidatePath called outside request scope')
    })
    const res = await POST(makeRequest('http://localhost/api/admin/projects', { name: '새 프로젝트' }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
  })
})
