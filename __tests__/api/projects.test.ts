/**
 * 프로젝트 API 테스트
 * Phase 1: CRUD 기본 작업 테스트
 */

import { NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'

// Supabase 모킹
jest.mock('@/lib/supabase', () => {
  const supabase = { from: jest.fn() }
  const supabaseAdmin = { from: jest.fn(), rpc: jest.fn() }
  return { supabase, supabaseAdmin }
})

describe('Projects API Routes', () => {
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

  const createRequest = (url: string, body?: unknown) => ({
    url,
    json: async () => body,
  }) as any

  const createQueryBuilder = (result: { data: any; error: any; count?: number }) => {
    const builder: any = {}
    builder.eq = jest.fn(() => builder)
    builder.order = jest.fn(() => builder)
    builder.or = jest.fn(() => builder)
    builder.range = jest.fn(() => Promise.resolve(result))
    return builder
  }

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

      const { supabaseAdmin } = require('@/lib/supabase')
      const builder = createQueryBuilder({
        data: mockProjects,
        error: null,
        count: 2,
      })
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => builder),
      })

      const response = await GET(createRequest('http://localhost:3000/api/projects'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items).toHaveLength(2)
      expect(data.data.items[0].name).toBe('테스트 프로젝트 1')
    })

    it('상태 필터링이 동작해야 합니다', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      const mockFilteredProjects = [
        {
          id: '1',
          title: '게시된 프로젝트',
          status: 'published',
          created_at: new Date().toISOString(),
        },
      ]

      const builder = createQueryBuilder({
        data: mockFilteredProjects,
        error: null,
        count: 1,
      })
      builder.eq = jest.fn(() => builder)
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => builder),
      })

      const response = await GET(createRequest('http://localhost:3000/api/projects?status=published'))
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.items).toHaveLength(1)
      expect(data.data.items[0].status).toBe('published')
    })

    it('데이터베이스 에러 시 500 에러를 반환해야 합니다', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      const builder = createQueryBuilder({
        data: null,
        error: { message: 'Database error' },
        count: undefined,
      })
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => builder),
      })

      const response = await GET(createRequest('http://localhost:3000/api/projects'))
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

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.rpc.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockCreatedProject,
          error: null,
        }),
      })

      const response = await POST(createRequest('http://localhost:3000/api/projects', newProject))
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

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.rpc.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Create error' },
        }),
      })

      supabaseAdmin.from
        .mockReturnValueOnce({
          select: jest.fn(() => createQueryBuilder({ data: [], error: null })),
        }) // slug check
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }) })),
          })),
        })
        .mockReturnValueOnce({ insert: jest.fn(() => ({ error: null })) }) // images
        .mockReturnValueOnce({ insert: jest.fn(() => ({ error: null })) }) // tags
        .mockReturnValueOnce({ insert: jest.fn(() => ({ error: null })) }) // items
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 'new-id', title: '', project_images: [], project_tags: [], project_items: [], status: 'draft', created_at: '', updated_at: '', inquiry_url: null, description: null, location: null, year: null, area: null }, error: null }) })),
          })),
        })

      const response = await POST(createRequest('http://localhost:3000/api/projects', invalidProject))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
