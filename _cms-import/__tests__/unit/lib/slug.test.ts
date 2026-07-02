import { slugify, uniqueSlug } from '@/lib/slug'

describe('slugify', () => {
  it('lowercases ascii input', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('keeps hangul characters intact', () => {
    expect(slugify('안녕 세상')).toBe('안녕-세상')
  })

  it('collapses runs of spaces and symbols into a single hyphen', () => {
    expect(slugify('a   b!!!c')).toBe('a-b-c')
    expect(slugify('foo / bar & baz')).toBe('foo-bar-baz')
  })

  it('trims leading and trailing hyphens and whitespace', () => {
    expect(slugify('---Hello---')).toBe('hello')
    expect(slugify('  spaced  ')).toBe('spaced')
  })

  it('falls back to "untitled" for empty or symbol-only input', () => {
    expect(slugify('')).toBe('untitled')
    expect(slugify('!!!')).toBe('untitled')
    expect(slugify('   ')).toBe('untitled')
  })
})

describe('uniqueSlug', () => {
  const existsIn =
    (taken: string[]) =>
    (candidate: string): Promise<boolean> =>
      Promise.resolve(taken.includes(candidate))

  it('returns the base slug when nothing collides', async () => {
    expect(await uniqueSlug('Hello World', existsIn([]))).toBe('hello-world')
  })

  it('suffixes -1 when the base slug is taken', async () => {
    expect(await uniqueSlug('Hello', existsIn(['hello']))).toBe('hello-1')
  })

  it('increments the suffix until exists() reports false', async () => {
    expect(await uniqueSlug('Hello', existsIn(['hello', 'hello-1', 'hello-2']))).toBe('hello-3')
  })

  it('calls exists() with each candidate in order', async () => {
    const seen: string[] = []
    const exists = (candidate: string): Promise<boolean> => {
      seen.push(candidate)
      return Promise.resolve(candidate === 'hello' || candidate === 'hello-1')
    }
    expect(await uniqueSlug('Hello', exists)).toBe('hello-2')
    expect(seen).toEqual(['hello', 'hello-1', 'hello-2'])
  })
})
