import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/public', () => ({ supabase: { rpc: vi.fn() } }))
vi.mock('@/lib/search/embedding', () => ({ embedText: vi.fn() }))

import { supabase } from '@/lib/supabase/public'
import { embedText } from '@/lib/search/embedding'
import { groupHits, hrefFor, hybridSearch } from '@/lib/search/query'

const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>
const embedMock = embedText as unknown as ReturnType<typeof vi.fn>

afterEach(() => vi.clearAllMocks())

describe('hrefFor', () => {
  it('routes each entity type to its detail URL', () => {
    expect(hrefFor('project', 'gangnam', 'x')).toBe('/projects/gangnam')
    expect(hrefFor('item', 'aeron', 'x')).toBe('/items/aeron')
    expect(hrefFor('brand', 'vitra', 'x')).toBe('/brands/vitra')
    expect(hrefFor('photo', null, 'photo-id')).toBe('/photos/photo-id') // photos routed by id
  })
})

describe('groupHits', () => {
  it('buckets rows by entity_type and builds hrefs, preserving order', () => {
    const groups = groupHits([
      { entity_type: 'project', entity_id: 'p1', slug: 'gangnam', title: '강남', image_url: null, score: 0.9 },
      { entity_type: 'item', entity_id: 'i1', slug: 'aeron', title: '아에론', image_url: 'x.jpg', score: 0.8 },
      { entity_type: 'project', entity_id: 'p2', slug: 'pangyo', title: '판교', image_url: null, score: 0.7 },
    ])
    expect(groups.project.map((h) => h.slug)).toEqual(['gangnam', 'pangyo'])
    expect(groups.item[0]).toMatchObject({ entityId: 'i1', href: '/items/aeron', imageUrl: 'x.jpg' })
    expect(groups.brand).toEqual([])
    expect(groups.photo).toEqual([])
  })
})

describe('hybridSearch', () => {
  it('returns empty groups for a blank query without hitting the RPC', async () => {
    const groups = await hybridSearch('   ')
    expect(groups).toEqual({ project: [], item: [], brand: [], photo: [] })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('passes a JSON-stringified embedding to the RPC and groups the rows', async () => {
    embedMock.mockResolvedValue([0.1, 0.2])
    rpcMock.mockResolvedValue({
      data: [{ entity_type: 'project', entity_id: 'p1', slug: 'gangnam', title: '강남', image_url: null, score: 0.9 }],
      error: null,
    })
    const groups = await hybridSearch('강남')
    expect(rpcMock).toHaveBeenCalledWith('hybrid_search', {
      query_text: '강남',
      query_embedding: JSON.stringify([0.1, 0.2]),
      match_limit: 24,
    })
    expect(groups.project[0].slug).toBe('gangnam')
  })

  it('passes null embedding through (trigram-only) when embedText returns null', async () => {
    embedMock.mockResolvedValue(null)
    rpcMock.mockResolvedValue({ data: [], error: null })
    await hybridSearch('강남')
    expect(rpcMock).toHaveBeenCalledWith('hybrid_search', {
      query_text: '강남',
      query_embedding: null,
      match_limit: 24,
    })
  })

  it('degrades to empty groups (no throw) on an RPC error', async () => {
    embedMock.mockResolvedValue(null)
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await hybridSearch('강남')).toEqual({ project: [], item: [], brand: [], photo: [] })
  })
})
