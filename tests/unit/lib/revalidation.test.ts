import { vi, describe, it, expect, afterEach } from 'vitest'
import { revalidatePath, revalidateTag } from 'next/cache'
import { revalidateEntity } from '@/lib/revalidation'

// next/cache has no request scope under Vitest; mock it so we can inspect calls.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

const pathMock = vi.mocked(revalidatePath)
const tagMock = vi.mocked(revalidateTag)

// Combine both mocks' calls into one ordered op list. Detail pages purge by
// per-table tag (revalidatePath with a dynamic pattern does not invalidate the
// cached fetches of already-rendered concrete pages in Next 14); concrete URLs
// still purge by path. Ordering is preserved via each call's invocationCallOrder.
type Op = ['path', string] | ['path', string, string] | ['tag', string]
const ops = (): Op[] => {
  const rows: { order: number; op: Op }[] = [
    ...pathMock.mock.calls.map((c, i) => ({
      order: pathMock.mock.invocationCallOrder[i],
      op: (c.length > 1 ? ['path', c[0], c[1]] : ['path', c[0]]) as Op,
    })),
    ...tagMock.mock.calls.map((c, i) => ({
      order: tagMock.mock.invocationCallOrder[i],
      op: ['tag', c[0]] as Op,
    })),
  ]
  return rows.sort((a, b) => a.order - b.order).map((r) => r.op)
}

// afterEach (not beforeEach): resetting a spy that was reset *before* a test
// in which it's later given a throwing implementation trips a Vitest 3.2.x
// false-positive failure (test fails even though the throw is caught) —
// reproduced with a minimal, project-independent case on vitest 3.2.4/3.2.6.
// Resetting after each test gives the same per-test isolation without the bug.
afterEach(() => {
  pathMock.mockReset()
  tagMock.mockReset()
})

describe('revalidateEntity mapping', () => {
  it('project (with slug) → home, list, photos, sitemap, own detail, item+brand detail tags', () => {
    revalidateEntity('project', 'my-project')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/projects'],
      ['path', '/photos'],
      ['path', '/sitemap.xml'],
      ['path', '/projects/my-project'],
      ['tag', 'sb:items'],
      ['tag', 'sb:brands'],
    ])
  })

  it('project (no slug) → falls back to the project detail tag', () => {
    revalidateEntity('project')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/projects'],
      ['path', '/photos'],
      ['path', '/sitemap.xml'],
      ['tag', 'sb:projects'],
      ['tag', 'sb:items'],
      ['tag', 'sb:brands'],
    ])
  })

  it('item (with slug) → home, list, sitemap, own detail, project+brand detail tags', () => {
    revalidateEntity('item', 'my-item')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/items'],
      ['path', '/sitemap.xml'],
      ['path', '/items/my-item'],
      ['tag', 'sb:projects'],
      ['tag', 'sb:brands'],
    ])
  })

  it('brand (with slug) → home, list, items list, sitemap, own detail, item detail tag', () => {
    revalidateEntity('brand', 'my-brand')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/brands'],
      ['path', '/items'],
      ['path', '/sitemap.xml'],
      ['path', '/brands/my-brand'],
      ['tag', 'sb:items'],
    ])
  })

  it('photo → home, project+item lists, photos, all detail tags', () => {
    revalidateEntity('photo')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/projects'],
      ['path', '/items'],
      ['path', '/photos'],
      ['tag', 'sb:projects'],
      ['tag', 'sb:items'],
      ['tag', 'sb:brands'],
    ])
  })

  it('category → home, lists, photos, all detail tags', () => {
    revalidateEntity('category')
    expect(ops()).toEqual([
      ['path', '/'],
      ['path', '/projects'],
      ['path', '/items'],
      ['path', '/photos'],
      ['tag', 'sb:projects'],
      ['tag', 'sb:items'],
      ['tag', 'sb:brands'],
    ])
  })

  it('site_settings → home only', () => {
    revalidateEntity('site_settings')
    expect(ops()).toEqual([['path', '/']])
  })

  it('home_featured → home only', () => {
    revalidateEntity('home_featured')
    expect(ops()).toEqual([['path', '/']])
  })

  it('tag → no public surface, neither revalidator is called', () => {
    revalidateEntity('tag')
    expect(pathMock).not.toHaveBeenCalled()
    expect(tagMock).not.toHaveBeenCalled()
  })

  // Regression: a project mutation must purge the item-detail read cache so that
  // an item newly tagged on a project photo shows the project as a derived
  // relation. This failed when detail pages were purged via a dynamic-pattern
  // revalidatePath, which does not invalidate already-cached concrete pages.
  it('project mutation purges the item-detail tag (derived-relation regression)', () => {
    revalidateEntity('project', 'pangyo-library')
    expect(tagMock).toHaveBeenCalledWith('sb:items')
  })

  it('never throws when a revalidator throws (best-effort)', () => {
    tagMock.mockImplementation(() => {
      throw new Error('outside request scope')
    })
    expect(() => revalidateEntity('project', 'x')).not.toThrow()
    // still attempted every target despite each throwing
    expect(tagMock).toHaveBeenCalled()
  })
})
