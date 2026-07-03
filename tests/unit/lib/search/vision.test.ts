import { afterEach, describe, expect, it, vi } from 'vitest'
import { describePhoto } from '@/lib/search/vision'

const OLD_KEY = process.env.OPENAI_API_KEY

afterEach(() => {
  process.env.OPENAI_API_KEY = OLD_KEY
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('describePhoto', () => {
  it('returns null when OPENAI_API_KEY is unset (no fetch)', async () => {
    delete process.env.OPENAI_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for an empty image url (no fetch)', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await describePhoto('')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the trimmed caption text on success', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '  모던 오피스 라운지, 우드 톤 가구.  ' } }] }),
      }),
    )
    expect(await describePhoto('https://img/1.jpg')).toBe('모던 오피스 라운지, 우드 톤 가구.')
  })

  it('returns null (never throws) on a non-ok response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' }),
    )
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })

  it('returns null (never throws) when fetch rejects', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })

  it('returns null when the response has no content', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }))
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })
})
