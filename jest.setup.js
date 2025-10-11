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
// 환경 변수 설정
process.env.NEXT_PUBLIC_API_BASE_URL = '/api'

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
