/**
 * API 유틸리티 함수 테스트
 * Phase 1: 단위 테스트
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

describe('API Utility Functions', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear()
    // fetch mock 초기화
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('apiGet', () => {
    it('GET 요청을 올바르게 수행해야 합니다', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiGet('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('쿼리 파라미터를 포함하여 요청해야 합니다', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      await apiGet('/test', { page: 1, limit: 10 })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test?page=1&limit=10',
        expect.any(Object)
      )
    })

    it('토큰이 있으면 Authorization 헤더를 포함해야 합니다', async () => {
      localStorage.setItem('authToken', 'test-token')

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      await apiGet('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('요청 실패 시 에러를 throw 해야 합니다', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      await expect(apiGet('/test')).rejects.toThrow()
    })
  })

  describe('apiPost', () => {
    it('POST 요청을 올바르게 수행해야 합니다', async () => {
      const mockData = { name: 'Test' }
      const mockResponse = { success: true, data: { id: 1, ...mockData } }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiPost('/test', mockData)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('apiPut', () => {
    it('PUT 요청을 올바르게 수행해야 합니다', async () => {
      const mockData = { name: 'Updated' }
      const mockResponse = { success: true, data: { id: 1, ...mockData } }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiPut('/test/1', mockData)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('apiDelete', () => {
    it('DELETE 요청을 올바르게 수행해야 합니다', async () => {
      const mockResponse = { success: true }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiDelete('/test/1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
