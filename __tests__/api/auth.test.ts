/**
 * 인증 API 테스트
 * Phase 1: API Routes 단위 테스트
 */

import { NextResponse } from 'next/server'
import { POST as loginPost } from '@/app/api/auth/login/route'
import { POST as signupPost } from '@/app/api/auth/signup/route'

// Supabase 모킹
jest.mock('@/lib/supabase', () => {
  const authMock = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  }

  const fromMock = jest.fn()

  const supabase = {
    auth: authMock,
    from: fromMock,
  }

  const supabaseAdmin = {
    from: jest.fn(),
    rpc: jest.fn(),
  }

  return { supabase, supabaseAdmin }
})

describe('Auth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(NextResponse, 'json').mockImplementation((body: any, init?: ResponseInit) => {
      return new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json', ...(init?.headers as HeadersInit | undefined) },
      }) as any
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createRequest = (url: string, body?: Record<string, unknown>) => ({
    url,
    json: async () => body ?? {},
  }) as any

  describe('POST /api/auth/login', () => {
    it('이메일과 비밀번호가 없으면 400 에러를 반환해야 합니다', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login', {})

      const response = await loginPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('이메일과 비밀번호')
    })

    it('개발 환경에서 마스터 계정 로그인이 가능해야 합니다', async () => {
      const originalEnv = process.env
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'development' },
      })

      const request = createRequest('http://localhost:3000/api/auth/login', {
        email: 'design4public@gmail.com',
        password: 'dfourp7!@#',
      })

      const response = await loginPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.role).toBe('master')
      expect(data.data.session.access_token).toBeDefined()

      Object.defineProperty(process, 'env', {
        value: originalEnv,
      })
    })

    it('잘못된 자격 증명으로 로그인 시 401 에러를 반환해야 합니다', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const request = createRequest('http://localhost:3000/api/auth/login', {
        email: 'test@test.com',
        password: 'wrongpassword',
      })

      const response = await loginPost(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/auth/signup', () => {
    it('이메일과 비밀번호가 없으면 400 에러를 반환해야 합니다', async () => {
      const request = createRequest('http://localhost:3000/api/auth/signup', {})

      const response = await signupPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('유효한 정보로 회원가입이 가능해야 합니다', async () => {
      const { supabase } = require('@/lib/supabase')
      
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'newuser@test.com',
          },
        },
        error: null,
      })

      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const request = createRequest('http://localhost:3000/api/auth/signup', {
        name: 'Test User',
        email: 'newuser@test.com',
        password: 'password123',
      })

      const response = await signupPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('회원가입이 완료')
    })
  })
})
