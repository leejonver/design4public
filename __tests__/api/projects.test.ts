/**
 * 프로젝트 API 테스트
 * Phase 1: CRUD 기본 작업 테스트
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(),
        })),
        range: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

describe('Projects API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('프로젝트 목록을 반환해야 합니다', async () => {
      const mockProjects = [
        {
          id: '1',
          title: '테스트 프로젝트 1',
          description: '설명',
          status: 'published',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: '테스트 프로젝트 2',
          description: '설명',
          status: 'draft',
          created_at: new Date().toISOString(),
        },
      ]

      const { supabase } = require('@/lib/supabase')
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: mockProjects,
              error: null,
              count: 2,
            }),
          })),
        })),
      })

      const url = new URL('http://localhost:3000/api/projects')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items).toHaveLength(2)
      expect(data.data.items[0].title).toBe('테스트 프로젝트 1')
    })

    it('상태 필터링이 동작해야 합니다', async () => {
      const { supabase } = require('@/lib/supabase')
      
      const mockFilteredProjects = [
        {
          id: '1',
          title: '게시된 프로젝트',
          status: 'published',
          created_at: new Date().toISOString(),
        },
      ]

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: mockFilteredProjects,
                error: null,
                count: 1,
              }),
            })),
          })),
        })),
      })

      const url = new URL('http://localhost:3000/api/projects?status=published')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.items).toHaveLength(1)
      expect(data.data.items[0].status).toBe('published')
    })

    it('데이터베이스 에러 시 500 에러를 반환해야 합니다', async () => {
      const { supabase } = require('@/lib/supabase')
      
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          })),
        })),
      })

      const url = new URL('http://localhost:3000/api/projects')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/projects', () => {
    it('새 프로젝트를 생성해야 합니다', async () => {
      const newProject = {
        title: '새 프로젝트',
        description: '프로젝트 설명',
        location: '서울',
        year: 2024,
        area: 100,
        status: 'draft',
      }

      const mockCreatedProject = {
        id: 'new-id',
        ...newProject,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { supabase } = require('@/lib/supabase')
      supabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedProject,
              error: null,
            }),
          })),
        })),
      })

      const url = new URL('http://localhost:3000/api/projects')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify(newProject),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('새 프로젝트')
      expect(data.data.id).toBeDefined()
    })

    it('필수 필드가 누락되면 400 에러를 반환해야 합니다', async () => {
      const invalidProject = {
        description: '설명만 있음',
      }

      const url = new URL('http://localhost:3000/api/projects')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify(invalidProject),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
