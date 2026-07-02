/**
 * 인증 플로우 통합 테스트
 * 쿠키 기반(@supabase/ssr) AuthProvider 동작 검증 (localStorage 토큰 제거).
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/database.types'

// 쿠키 세션 기반 supabase 클라이언트를 모킹한다.
jest.mock('@/lib/supabase', () => {
  const profileSingle = jest.fn()
  const eqResult = { single: profileSingle }
  const selectResult = { eq: jest.fn(() => eqResult) }
  const fromResult = { select: jest.fn(() => selectResult) }
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      from: jest.fn(() => fromResult),
    },
  }
})

// 모킹된 supabase 의 jest.fn 들에 접근하기 위한 핸들.
import { supabase } from '@/lib/supabase'

const auth = supabase.auth as unknown as {
  signInWithPassword: jest.Mock
  signOut: jest.Mock
  getUser: jest.Mock
  onAuthStateChange: jest.Mock
}

// profiles 조회 체인의 leaf(.single) 참조. 클로저로 항상 동일 인스턴스.
const profileSingle = (supabase.from as unknown as jest.Mock)('profiles')
  .select()
  .eq().single as jest.Mock

interface ProfileRow {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: string
}

const approvedProfile = (role: UserRole): ProfileRow => ({
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  role,
  status: 'approved',
})

// useAuth 컨텍스트 값을 테스트에서 직접 사용하기 위해 캡처한다.
let capturedAuth!: ReturnType<typeof useAuth>
function Capture() {
  capturedAuth = useAuth()
  return <span data-testid="email">{capturedAuth.user?.email ?? 'none'}</span>
}

async function renderAuth() {
  await act(async () => {
    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    )
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Authentication Flow (cookie-based)', () => {
  describe('로그인 플로우', () => {
    it('유효한 자격 증명으로 로그인하면 승인된 프로필이 user 로 설정되어야 합니다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
      profileSingle.mockResolvedValue({ data: approvedProfile('admin') })

      await renderAuth()
      expect(capturedAuth.user).toBeNull()

      await act(async () => {
        await capturedAuth.login('test@test.com', 'password123')
      })

      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
      expect(capturedAuth.user).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
      })
    })

    it('승인되지 않은 프로필이면 에러를 throw 하고 signOut 후 user 가 null 이어야 합니다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
      profileSingle.mockResolvedValue({ data: { ...approvedProfile('admin'), status: 'pending' } })

      await renderAuth()

      await act(async () => {
        await expect(capturedAuth.login('test@test.com', 'password123')).rejects.toThrow(
          '승인'
        )
      })

      expect(auth.signOut).toHaveBeenCalled()
      expect(capturedAuth.user).toBeNull()
    })

    it('잘못된 자격 증명이면 에러를 throw 해야 합니다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })

      await renderAuth()

      await act(async () => {
        await expect(capturedAuth.login('test@test.com', 'wrong')).rejects.toThrow(
          '이메일 또는 비밀번호'
        )
      })
      expect(capturedAuth.user).toBeNull()
    })
  })

  describe('로그아웃 플로우', () => {
    it('logout 시 signOut 이 호출되고 user 가 null 로 초기화되어야 합니다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
      profileSingle.mockResolvedValue({ data: approvedProfile('admin') })

      await renderAuth()
      await act(async () => {
        await capturedAuth.login('test@test.com', 'password123')
      })
      expect(capturedAuth.user).not.toBeNull()

      await act(async () => {
        await capturedAuth.logout()
      })

      expect(auth.signOut).toHaveBeenCalled()
      expect(capturedAuth.user).toBeNull()
    })
  })

  describe('권한 파생(isMaster/isAdmin/isContentManager)', () => {
    const cases: Array<{
      role: UserRole
      isMaster: boolean
      isAdmin: boolean
      isContentManager: boolean
    }> = [
      { role: 'master', isMaster: true, isAdmin: true, isContentManager: true },
      { role: 'admin', isMaster: false, isAdmin: true, isContentManager: true },
      { role: 'content_manager', isMaster: false, isAdmin: false, isContentManager: true },
    ]

    it.each(cases)(
      '$role 역할이면 플래그가 올바르게 파생되어야 합니다',
      async ({ role, isMaster, isAdmin, isContentManager }) => {
        auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
        profileSingle.mockResolvedValue({ data: approvedProfile(role) })

        await renderAuth()
        await act(async () => {
          await capturedAuth.login('test@test.com', 'password123')
        })

        expect(capturedAuth.isMaster).toBe(isMaster)
        expect(capturedAuth.isAdmin).toBe(isAdmin)
        expect(capturedAuth.isContentManager).toBe(isContentManager)
      }
    )
  })

  describe('localStorage 토큰 미사용', () => {
    it('로그인 전 과정에서 authToken 을 localStorage 에 저장하지 않아야 합니다', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
      profileSingle.mockResolvedValue({ data: approvedProfile('admin') })

      localStorage.removeItem('authToken')
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')

      await renderAuth()
      await act(async () => {
        await capturedAuth.login('test@test.com', 'password123')
      })

      expect(setItemSpy).not.toHaveBeenCalledWith('authToken', expect.anything())
      expect(localStorage.getItem('authToken')).toBeNull()

      setItemSpy.mockRestore()
    })
  })
})
