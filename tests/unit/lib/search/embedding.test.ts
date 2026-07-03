import { afterEach, describe, expect, it, vi } from 'vitest'
import { embedBatch, embedText } from '@/lib/search/embedding'

const OLD_KEY = process.env.OPENAI_API_KEY

afterEach(() => {
  process.env.OPENAI_API_KEY = OLD_KEY
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('embedText / embedBatch', () => {
  it('returns null for every input when OPENAI_API_KEY is unset', async () => {
    delete process.env.OPENAI_API_KEY
    expect(await embedText('강남 오피스')).toBeNull()
    expect(await embedBatch(['a', 'b'])).toEqual([null, null])
  })

  it('parses the OpenAI response in input order on success', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    expect(await embedBatch(['a', 'b'])).toEqual([[0.1, 0.2], [0.3, 0.4]])
    expect(await embedText('a')).toEqual([0.1, 0.2]) // single-input path reads data[0]
  })

  it('returns nulls (never throws) on a non-ok response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' }),
    )
    expect(await embedBatch(['a', 'b'])).toEqual([null, null])
  })

  it('returns nulls (never throws) when fetch rejects', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await embedText('a')).toBeNull()
  })
})
