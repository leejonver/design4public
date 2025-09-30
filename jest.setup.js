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
global.fetch = jest.fn()

// 환경 변수 설정
process.env.NEXT_PUBLIC_API_BASE_URL = '/api'
