import { vi, type Mock } from "vitest";
/**
 * 인증 API 라우트 테스트 (renewal: @supabase/ssr 쿠키 인증)
 * - signup: 가입 시 pending 프로필 생성 + 승인 안내 메시지 반환.
 * 가짜 토큰/하드코딩 마스터 계정 없음 (renewal 에서 제거됨).
 */

import { NextResponse } from 'next/server'
import { POST as signupPost } from '@/app/api/admin/auth/signup/route'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type AuthMock = {
  signUp: Mock
}

// createServerSupabase() -> { auth: { signUp } } (모킹)
vi.mock('@/lib/supabase/server', () => {
  const auth = {
    signUp: vi.fn(),
  }
  return { createServerSupabase: vi.fn(() => ({ auth })) }
})

// 서비스 롤 클라이언트: 체이너블 쿼리 빌더로 모킹.
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: vi.fn() },
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
// createServerSupabase 는 동일한 auth 객체(클로저)를 반환하므로 한 번만 꺼내면 된다.
const auth = (createServerSupabase() as unknown as { auth: AuthMock }).auth

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('Auth API Routes (renewal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi
      .spyOn(NextResponse, 'json')
      .mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    fromMock.mockReset()
    auth.signUp.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('이메일/비밀번호가 없으면 400 을 반환한다', async () => {
      const res = await signupPost(makeRequest({}) as never)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('가입 시 pending 프로필을 생성하고 승인 안내 메시지를 반환한다', async () => {
      auth.signUp.mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null })
      const qb = makeQB({ data: null, error: null })
      fromMock.mockReturnValue(qb)

      const res = await signupPost(
        makeRequest({ name: 'Test User', email: 'newuser@test.com', password: 'password123' }) as never,
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toContain('승인')
      expect(fromMock).toHaveBeenCalledWith('profiles')
      expect(qb.upsert as Mock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', role: 'content_manager', id: 'new-user-id' }),
        expect.anything(),
      )
    })
  })
})
