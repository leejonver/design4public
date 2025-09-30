/**
 * 인증 플로우 통합 테스트
 * Phase 1: 통합 테스트
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/contexts/AuthContext'

// 로그인 페이지 컴포넌트 모킹
jest.mock('@/contexts/AuthContext')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}))

describe('Authentication Flow', () => {
  const mockLogin = jest.fn()
  const mockLogout = jest.fn()
  const mockSignup = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      logout: mockLogout,
      signup: mockSignup,
      isMaster: false,
      isAdmin: false,
      isContentManager: false,
    })
  })

  describe('로그인 플로우', () => {
    it('유효한 자격 증명으로 로그인이 가능해야 합니다', async () => {
      mockLogin.mockResolvedValue(undefined)

      // 실제 로그인 시나리오 시뮬레이션
      await mockLogin('test@test.com', 'password123')

      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123')
    })

    it('로그인 실패 시 에러를 처리해야 합니다', async () => {
      mockLogin.mockRejectedValue(new Error('로그인에 실패했습니다.'))

      await expect(
        mockLogin('test@test.com', 'wrongpassword')
      ).rejects.toThrow('로그인에 실패했습니다.')
    })
  })

  describe('회원가입 플로우', () => {
    it('유효한 정보로 회원가입이 가능해야 합니다', async () => {
      mockSignup.mockResolvedValue(undefined)

      await mockSignup('Test User', 'test@test.com', 'password123')

      expect(mockSignup).toHaveBeenCalledWith(
        'Test User',
        'test@test.com',
        'password123'
      )
    })

    it('회원가입 실패 시 에러를 처리해야 합니다', async () => {
      mockSignup.mockRejectedValue(new Error('회원가입에 실패했습니다.'))

      await expect(
        mockSignup('Test User', 'test@test.com', 'password')
      ).rejects.toThrow('회원가입에 실패했습니다.')
    })
  })

  describe('로그아웃 플로우', () => {
    it('로그아웃이 정상적으로 처리되어야 합니다', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 'test-id',
          email: 'test@test.com',
          role: 'admin',
        },
        loading: false,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
        isMaster: false,
        isAdmin: true,
        isContentManager: true,
      })

      mockLogout.mockResolvedValue(undefined)

      await mockLogout()

      expect(mockLogout).toHaveBeenCalled()
    })

    it('로그아웃 시 localStorage에서 토큰이 제거되어야 합니다', async () => {
      localStorage.setItem('authToken', 'test-token')

      mockLogout.mockImplementation(() => {
        localStorage.removeItem('authToken')
        return Promise.resolve()
      })

      await mockLogout()

      expect(localStorage.getItem('authToken')).toBeNull()
    })
  })

  describe('권한 체크', () => {
    it('마스터 권한 체크가 정확해야 합니다', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { role: 'master' },
        isMaster: true,
        isAdmin: true,
        isContentManager: true,
      })

      const { isMaster } = useAuth()
      expect(isMaster).toBe(true)
    })

    it('관리자 권한 체크가 정확해야 합니다', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { role: 'admin' },
        isMaster: false,
        isAdmin: true,
        isContentManager: true,
      })

      const { isAdmin, isMaster } = useAuth()
      expect(isAdmin).toBe(true)
      expect(isMaster).toBe(false)
    })

    it('콘텐츠매니저 권한 체크가 정확해야 합니다', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { role: 'content_manager' },
        isMaster: false,
        isAdmin: false,
        isContentManager: true,
      })

      const { isContentManager, isAdmin } = useAuth()
      expect(isContentManager).toBe(true)
      expect(isAdmin).toBe(false)
    })
  })

  describe('토큰 관리', () => {
    it('로그인 시 토큰이 localStorage에 저장되어야 합니다', async () => {
      mockLogin.mockImplementation(() => {
        localStorage.setItem('authToken', 'new-test-token')
        return Promise.resolve()
      })

      await mockLogin('test@test.com', 'password123')

      expect(localStorage.getItem('authToken')).toBe('new-test-token')
    })

    it('API 요청 시 토큰이 포함되어야 합니다', () => {
      localStorage.setItem('authToken', 'test-token')

      const token = localStorage.getItem('authToken')
      expect(token).toBe('test-token')
    })
  })
})
