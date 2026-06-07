/**
 * 인증 API 라우트 테스트 (renewal: @supabase/ssr 쿠키 인증)
 * - signup: 가입 시 pending 프로필 생성 + 승인 안내 메시지 반환.
 * - login: 미승인 사용자(status!=='approved') 거부 403, 승인 사용자 성공.
 * 가짜 토큰/하드코딩 마스터 계정 없음 (renewal 에서 제거됨).
 */

import { NextResponse } from 'next/server'
import { POST as signupPost } from '@/app/api/auth/signup/route'
import { POST as loginPost } from '@/app/api/auth/login/route'
import { createServerSupabase } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type AuthMock = {
  signUp: jest.Mock
  signInWithPassword: jest.Mock
  signOut: jest.Mock
}

// createServerSupabase() -> { auth: { signUp, signInWithPassword, signOut } } (모킹)
jest.mock('@/lib/supabase-server', () => {
  const auth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  }
  return { createServerSupabase: jest.fn(() => ({ auth })) }
})

// 서비스 롤 클라이언트: 체이너블 쿼리 빌더로 모킹.
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: jest.fn() },
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
    qb[m] = jest.fn(() => qb)
  })
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = supabaseAdmin.from as unknown as jest.Mock
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
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest
      .spyOn(NextResponse, 'json')
      .mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    fromMock.mockReset()
    auth.signUp.mockReset()
    auth.signInWithPassword.mockReset()
    auth.signOut.mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
      expect(qb.upsert as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', role: 'content_manager', id: 'new-user-id' }),
        expect.anything(),
      )
    })
  })

  describe('POST /api/auth/login', () => {
    it('이메일/비밀번호가 없으면 400 을 반환한다', async () => {
      const res = await loginPost(makeRequest({}) as never)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('자격 증명이 틀리면 401 을 반환한다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } })

      const res = await loginPost(makeRequest({ email: 'a@test.com', password: 'wrong' }) as never)
      const json = await res.json()

      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('미승인 사용자(status!=="approved")는 403 으로 거부하고 signOut 한다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      auth.signOut.mockResolvedValue({ error: null })
      fromMock.mockReturnValue(
        makeQB({
          data: { id: 'u1', email: 'a@test.com', name: 'A', role: 'content_manager', status: 'pending' },
          error: null,
        }),
      )

      const res = await loginPost(makeRequest({ email: 'a@test.com', password: 'pw' }) as never)
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(auth.signOut).toHaveBeenCalled()
    })

    it('승인된 사용자는 로그인에 성공한다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      fromMock.mockReturnValue(
        makeQB({
          data: { id: 'u1', email: 'a@test.com', name: 'A', role: 'admin', status: 'approved' },
          error: null,
        }),
      )

      const res = await loginPost(makeRequest({ email: 'a@test.com', password: 'pw' }) as never)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.user.id).toBe('u1')
      expect(json.data.user.role).toBe('admin')
      expect(auth.signOut).not.toHaveBeenCalled()
    })
  })
})
