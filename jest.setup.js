// Jest 설정 파일
import '@testing-library/jest-dom'
import 'whatwg-fetch'

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// fetch 모킹 (기본값)
// 환경 변수 설정 (Supabase 클라이언트 모듈 로드를 위한 더미 값)
process.env.NEXT_PUBLIC_API_BASE_URL = '/api'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// matchMedia 모킹 (Ant Design 등에서 사용)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

if (typeof global !== 'undefined' && !global.matchMedia) {
  // @ts-expect-error 글로벌 matchMedia 정의
  global.matchMedia = window.matchMedia
}
