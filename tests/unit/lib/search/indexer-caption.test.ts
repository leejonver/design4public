import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A chainable Supabase mock: from().select().eq().maybeSingle() and
// from().update().eq() and from().upsert()/delete() used by reindexEntity.
// Declared via vi.hoisted() because vi.mock factories below are hoisted above
// regular top-level statements and would otherwise close over these before
// the `const` declarations run.
const { photoRow, maybeSingle, update, upsert, from, describePhoto } = vi.hoisted(() => {
  const photoRow = { image_url: 'https://img/1.jpg', ai_caption: null as string | null }
  const maybeSingle = vi.fn(async () => ({ data: photoRow, error: null }))
  const updateEq = vi.fn(async () => ({ error: null }))
  const update = vi.fn(() => ({ eq: updateEq }))
  const upsert = vi.fn(async () => ({ error: null }))
  // reindexEntity reads search_source then upserts search_index; give it a row.
  const sourceMaybeSingle = vi.fn(async () => ({
    data: { entity_type: 'photo', entity_id: 'p1', slug: null, title: 't', body: 'b', image_url: 'u' },
    error: null,
  }))

  const from = vi.fn((table: string) => {
    if (table === 'search_source') {
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: sourceMaybeSingle }) }) }) }
    }
    if (table === 'search_index') {
      return { upsert, delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }
    }
    // photos
    return {
      select: () => ({ eq: () => ({ maybeSingle }) }),
      update,
    }
  })

  const describePhoto = vi.fn(async (): Promise<string | null> => '모던 라운지 캡션')

  return { photoRow, maybeSingle, update, upsert, from, describePhoto }
})

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from } }))
vi.mock('@/lib/search/vision', () => ({ describePhoto, VISION_MODEL: 'gpt-4o-mini' }))
vi.mock('@/lib/search/embedding', () => ({ embedText: vi.fn(async () => null) }))

import { captionAndReindexPhoto } from '@/lib/search/indexer'

beforeEach(() => {
  photoRow.ai_caption = null
})
afterEach(() => vi.clearAllMocks())

describe('captionAndReindexPhoto', () => {
  it('generates + stores a caption when missing, then reindexes', async () => {
    await captionAndReindexPhoto('p1')
    expect(describePhoto).toHaveBeenCalledWith('https://img/1.jpg')
    expect(update).toHaveBeenCalledWith({ ai_caption: '모던 라운지 캡션', ai_caption_model: 'gpt-4o-mini' })
    expect(upsert).toHaveBeenCalled() // reindexEntity ran
  })

  it('skips caption generation when one already exists and regenerate is false', async () => {
    photoRow.ai_caption = '기존 캡션'
    await captionAndReindexPhoto('p1')
    expect(describePhoto).not.toHaveBeenCalled()
    expect(upsert).toHaveBeenCalled() // still reindexes
  })

  it('regenerates when regenerate=true even if a caption exists', async () => {
    photoRow.ai_caption = '기존 캡션'
    await captionAndReindexPhoto('p1', { regenerate: true })
    expect(describePhoto).toHaveBeenCalled()
    expect(update).toHaveBeenCalled()
  })

  it('reindexes even when caption generation returns null (no store)', async () => {
    describePhoto.mockResolvedValueOnce(null)
    await captionAndReindexPhoto('p1')
    expect(update).not.toHaveBeenCalled()
    expect(upsert).toHaveBeenCalled()
  })
})
