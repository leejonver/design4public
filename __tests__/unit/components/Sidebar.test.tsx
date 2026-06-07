/**
 * Sidebar 컴포넌트 테스트
 * Phase 1: 컴포넌트 단위 테스트
 */

import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

// Next.js 라우터 모킹
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/projects'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// AuthContext 모킹
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      email: 'test@test.com',
      name: 'Test User',
      role: 'admin',
    },
    logout: jest.fn(),
  })),
}))

describe('Sidebar Component', () => {
  it('사이드바가 렌더링되어야 합니다', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)

    expect(screen.getByText(/design4public/i)).toBeInTheDocument()
    expect(screen.getByText('콘텐츠관리자')).toBeInTheDocument()
  })

  it('모든 메뉴 항목이 표시되어야 합니다', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)

    expect(screen.getByText('프로젝트')).toBeInTheDocument()
    expect(screen.getByText('아이템')).toBeInTheDocument()
    expect(screen.getByText('브랜드')).toBeInTheDocument()
    expect(screen.getByText('사진')).toBeInTheDocument()
    expect(screen.getByText('카테고리 설정')).toBeInTheDocument()
  })

  it('사용자 정보가 표시되어야 합니다', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.queryByText('test@test.com')).not.toBeInTheDocument()
  })

  it('로그아웃 버튼이 표시되어야 합니다', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)

    expect(screen.getByText('로그아웃')).toBeInTheDocument()
  })
})
