import { vi, type Mock } from "vitest";
/**
 * 프로젝트 API 라우트 테스트 (renewal: cookie 인증 + RBAC + DTO 매핑)
 * - GET: 인증된 사용자에게 { success, data:{ items, total, page, limit } } 반환,
 *        items[0]의 tags/connectedItems 가 실제 매핑되는지 검증.
 * - POST: requireRole 거부 시 403 envelope 검증 + 정상 생성 경로 검증.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { SessionUser } from '@/lib/auth'
import { GET, POST } from '@/app/api/admin/projects/route'
import { requireUser, requireRole, AuthError } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

// auth: requireUser/requireRole 는 vi.fn, AuthError/authErrorResponse 는 실제 동작 유지.
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
  return {
    AuthError,
    authErrorResponse,
    requireUser: vi.fn(),
    requireRole: vi.fn(),
    getCurrentUser: vi.fn(),
    hasRole: vi.fn(),
  }
})

// 서비스 롤 클라이언트: 체이너블 쿼리 빌더로 모킹.
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

// 이미지/관계 동기화는 no-op.
vi.mock('@/lib/image-sync', () => ({
  syncProjectPhotos: vi.fn().mockResolvedValue(undefined),
  syncProjectItems: vi.fn().mockResolvedValue(undefined),
  syncCategories: vi.fn().mockResolvedValue(undefined),
  syncFreeTags: vi.fn().mockResolvedValue(undefined),
}))

// jsdom/whatwg-fetch 환경에서 NextResponse.json 의 body 스트림이 유실되므로
// 일반 Response 를 반환하도록 NextResponse.json 을 스파이한다.
function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init?.headers as Record<string, string> | undefined) },
  })
}

type QBResult = { data: unknown; error: unknown; count?: number }

// then 으로 {data,error,count} 를 resolve 하는 체이너블 빌더.
function makeQB(result: QBResult): Record<string, unknown> {
  const methods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'or', 'order', 'range', 'limit', 'single', 'maybeSingle', 'in', 'not',
  ]
  const qb: Record<string, unknown> = {}
  methods.forEach((m) => {
    qb[m] = vi.fn(() => qb)
  })
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = supabaseAdmin.from as unknown as Mock

const fakeUser: SessionUser = {
  id: 'u1',
  email: 'admin@test.com',
  name: '관리자',
  role: 'master',
  status: 'approved',
}

const tagRow = {
  id: 't1',
  name: '공공디자인',
  type: 'project',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const brandRow = {
  id: 'b1',
  name_ko: '브랜드',
  name_en: 'Brand',
  description: '브랜드 설명',
  logo_image_url: null,
  cover_image_url: null,
  website_url: null,
  status: 'visible',
  slug: 'brand',
  brand_tags: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const itemRow = {
  id: 'i1',
  name: 'Bench',
  description: '벤치',
  nara_url: null,
  slug: 'bench',
  status: 'available',
  brands: brandRow,
  item_tags: [],
  photo_items: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

function projectRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'p1',
    title: '테스트 프로젝트',
    description: '설명',
    location: '서울',
    year: 2024,
    area: 100,
    inquiry_url: null,
    slug: 'test-project',
    status: 'published',
    project_tags: [{ tags: tagRow }],
    project_items: [{ items: itemRow }],
    project_photos: [{ is_main: true, order: 0, photos: { id: 'ph1', image_url: 'https://cdn/img.jpg', alt_text: 'alt' } }],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function makeRequest(url: string, body?: unknown): NextRequest {
  const init = body
    ? { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }
    : undefined
  return new Request(url, init) as unknown as NextRequest
}

describe('Projects API Routes (renewal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi
      .spyOn(NextResponse, 'json')
      .mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    fromMock.mockReset()
    vi.mocked(requireUser).mockResolvedValue(fakeUser)
    vi.mocked(requireRole).mockResolvedValue(fakeUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/projects', () => {
    it('인증된 사용자에게 { success, data:{ items, total, page, limit } } 를 반환한다', async () => {
      fromMock.mockReturnValue(makeQB({ data: [projectRow()], error: null, count: 1 }))

      const res = await GET(makeRequest('http://localhost/api/projects?page=1'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.items).toHaveLength(1)
      expect(json.data.total).toBe(1)
      expect(json.data.page).toBe(1)
      expect(json.data.limit).toBe(10)
    })

    it('items[0] 의 tags/connectedItems 가 실제로 매핑된다 (하드코딩 [] 아님)', async () => {
      fromMock.mockReturnValue(makeQB({ data: [projectRow()], error: null, count: 1 }))

      const res = await GET(makeRequest('http://localhost/api/projects?page=1'))
      const json = await res.json()

      const project = json.data.items[0]
      expect(project.name).toBe('테스트 프로젝트')
      expect(project.tags).toHaveLength(1)
      expect(project.tags[0].name).toBe('공공디자인')
      expect(project.connectedItems).toHaveLength(1)
      expect(project.connectedItems[0].name).toBe('Bench')
      expect(project.connectedItems[0].brand.name).toBe('브랜드')
      expect(project.images).toHaveLength(1)
      expect(project.images[0].isMain).toBe(true)
    })

    it('DB 에러 시 500 envelope 를 반환한다', async () => {
      fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'db error' } }))

      const res = await GET(makeRequest('http://localhost/api/projects'))
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.success).toBe(false)
    })
  })

  describe('POST /api/projects', () => {
    it('RBAC: requireRole 거부 시 403 { success:false } 를 반환한다', async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(new AuthError(403, '권한이 없습니다.'))

      const res = await POST(makeRequest('http://localhost/api/projects', { name: '새 프로젝트' }))
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error).toBe('권한이 없습니다.')
    })

    it('이름이 없으면 400 을 반환한다', async () => {
      const res = await POST(makeRequest('http://localhost/api/projects', { description: '이름 없음' }))
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('정상 생성 시 201 envelope + 매핑된 관계를 반환한다', async () => {
      fromMock
        .mockReturnValueOnce(makeQB({ data: null, error: null })) // slug 중복 검사
        .mockReturnValueOnce(makeQB({ data: { id: 'new-id' }, error: null })) // insert
        .mockReturnValueOnce(makeQB({ data: projectRow({ id: 'new-id', title: '새 프로젝트' }), error: null })) // 최종 select

      const res = await POST(
        makeRequest('http://localhost/api/projects', {
          name: '새 프로젝트',
          description: '설명',
          location: '서울',
          tags: ['t1'],
          connectedItems: ['i1'],
          photos: ['https://cdn/img.jpg'],
        }),
      )
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.id).toBe('new-id')
      expect(json.data.name).toBe('새 프로젝트')
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.connectedItems).toHaveLength(1)
      expect(json.message).toBeDefined()
    })
  })
})
