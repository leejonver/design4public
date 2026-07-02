/**
 * API 유틸리티 함수 테스트
 * 쿠키 기반(@supabase/ssr) 인증: Authorization 헤더를 추가하지 않는다.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface FetchResult {
  ok: boolean
  status?: number
  json: () => Promise<unknown>
}

const okJson = (body: unknown): FetchResult => ({ ok: true, json: async () => body })

const fetchMock = jest.fn()

// fetch 호출 인자에서 헤더를 안전하게 추출한다.
const headersOf = (call: number): Record<string, string> => {
  const options = (fetchMock.mock.calls[call]?.[1] ?? {}) as RequestInit
  return (options.headers ?? {}) as Record<string, string>
}

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('API Utility Functions', () => {
  describe('apiGet', () => {
    it('GET 요청을 올바르게 수행해야 합니다', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'Test' } }
      fetchMock.mockResolvedValue(okJson(mockResponse))

      const result = await apiGet('/test')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('쿼리 파라미터를 포함하여 요청해야 합니다', async () => {
      fetchMock.mockResolvedValue(okJson({ success: true }))

      await apiGet('/test', { page: 1, limit: 10 })

      expect(fetchMock).toHaveBeenCalledWith('/api/test?page=1&limit=10', expect.any(Object))
    })

    it('쿠키 세션(same-origin)으로 요청하며 Authorization 헤더를 추가하지 않아야 합니다', async () => {
      fetchMock.mockResolvedValue(okJson({ success: true }))

      await apiGet('/test')

      const headers = headersOf(0)
      expect(headers).not.toHaveProperty('Authorization')
      // 쿠키가 자동 포함되도록 credentials를 'omit'으로 끄지 않는다(기본값 same-origin).
      const options = fetchMock.mock.calls[0][1] as RequestInit
      expect(options.credentials).not.toBe('omit')
    })

    it('localStorage 토큰이 있어도 Authorization 헤더를 추가하지 않아야 합니다', async () => {
      // 구버전과 달리 api.ts 는 localStorage 토큰을 더 이상 읽지 않는다.
      localStorage.setItem('authToken', 'legacy-token')
      fetchMock.mockResolvedValue(okJson({ success: true }))

      await apiGet('/test')

      expect(headersOf(0)).not.toHaveProperty('Authorization')
    })

    it('요청 실패 시 에러를 throw 해야 합니다', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      await expect(apiGet('/test')).rejects.toThrow('Not found')
    })
  })

  describe('apiPost', () => {
    it('POST 요청을 올바르게 수행하고 본문을 JSON 으로 직렬화해야 합니다', async () => {
      const mockData = { name: 'Test' }
      const mockResponse = { success: true, data: { id: 1, ...mockData } }
      fetchMock.mockResolvedValue(okJson(mockResponse))

      const result = await apiPost('/test', mockData)

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('POST 요청도 Authorization 헤더를 추가하지 않아야 합니다', async () => {
      fetchMock.mockResolvedValue(okJson({ success: true }))

      await apiPost('/test', { name: 'Test' })

      expect(headersOf(0)).not.toHaveProperty('Authorization')
    })
  })

  describe('apiPut', () => {
    it('PUT 요청을 올바르게 수행해야 합니다', async () => {
      const mockData = { name: 'Updated' }
      const mockResponse = { success: true, data: { id: 1, ...mockData } }
      fetchMock.mockResolvedValue(okJson(mockResponse))

      const result = await apiPut('/test/1', mockData)

      expect(fetchMock).toHaveBeenCalledWith(
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
      fetchMock.mockResolvedValue(okJson(mockResponse))

      const result = await apiDelete('/test/1')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
