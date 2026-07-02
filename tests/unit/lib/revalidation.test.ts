import { vi, describe, it, expect, afterEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { revalidateEntity } from '@/lib/revalidation'

// next/cache has no request scope under Vitest; mock it so we can inspect calls.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mock = vi.mocked(revalidatePath)

// Normalize mock.calls into comparable [path, type?] tuples.
const calls = () => mock.mock.calls.map((c) => (c.length > 1 ? [c[0], c[1]] : [c[0]]))

// afterEach (not beforeEach): resetting a spy that was reset *before* a test
// in which it's later given a throwing implementation trips a Vitest 3.2.x
// false-positive failure (test fails even though the throw is caught) —
// reproduced with a minimal, project-independent case on vitest 3.2.4/3.2.6.
// Resetting after each test gives the same per-test isolation without the bug.
afterEach(() => mock.mockReset())

describe('revalidateEntity mapping', () => {
  it('project (with slug) → home, list, photos, sitemap, own detail, item+brand detail patterns', () => {
    revalidateEntity('project', 'my-project')
    expect(calls()).toEqual([
      ['/'],
      ['/projects'],
      ['/photos'],
      ['/sitemap.xml'],
      ['/projects/my-project'],
      ['/items/[slug]', 'page'],
      ['/brands/[slug]', 'page'],
    ])
  })

  it('project (no slug) → falls back to the project detail pattern', () => {
    revalidateEntity('project')
    expect(calls()).toEqual([
      ['/'],
      ['/projects'],
      ['/photos'],
      ['/sitemap.xml'],
      ['/projects/[slug]', 'page'],
      ['/items/[slug]', 'page'],
      ['/brands/[slug]', 'page'],
    ])
  })

  it('item (with slug) → home, list, sitemap, own detail, project+brand detail patterns', () => {
    revalidateEntity('item', 'my-item')
    expect(calls()).toEqual([
      ['/'],
      ['/items'],
      ['/sitemap.xml'],
      ['/items/my-item'],
      ['/projects/[slug]', 'page'],
      ['/brands/[slug]', 'page'],
    ])
  })

  it('brand (with slug) → home, list, items list, sitemap, own detail, item detail pattern', () => {
    revalidateEntity('brand', 'my-brand')
    expect(calls()).toEqual([
      ['/'],
      ['/brands'],
      ['/items'],
      ['/sitemap.xml'],
      ['/brands/my-brand'],
      ['/items/[slug]', 'page'],
    ])
  })

  it('photo → home, project+item lists, photos, all detail patterns', () => {
    revalidateEntity('photo')
    expect(calls()).toEqual([
      ['/'],
      ['/projects'],
      ['/items'],
      ['/photos'],
      ['/projects/[slug]', 'page'],
      ['/items/[slug]', 'page'],
      ['/brands/[slug]', 'page'],
    ])
  })

  it('category → home, lists, photos, all detail patterns', () => {
    revalidateEntity('category')
    expect(calls()).toEqual([
      ['/'],
      ['/projects'],
      ['/items'],
      ['/photos'],
      ['/projects/[slug]', 'page'],
      ['/items/[slug]', 'page'],
      ['/brands/[slug]', 'page'],
    ])
  })

  it('site_settings → home only', () => {
    revalidateEntity('site_settings')
    expect(calls()).toEqual([['/']])
  })

  it('home_featured → home only', () => {
    revalidateEntity('home_featured')
    expect(calls()).toEqual([['/']])
  })

  it('tag → no public surface, revalidatePath never called', () => {
    revalidateEntity('tag')
    expect(mock).not.toHaveBeenCalled()
  })

  it('never throws when revalidatePath throws (best-effort)', () => {
    mock.mockImplementation(() => {
      throw new Error('outside request scope')
    })
    expect(() => revalidateEntity('project', 'x')).not.toThrow()
    // still attempted every target despite each throwing
    expect(mock).toHaveBeenCalled()
  })
})
