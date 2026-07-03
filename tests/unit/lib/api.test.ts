import { vi, type Mock } from 'vitest'

/**
 * Site union queries (M4 task 8): related items on project detail and
 * related projects on item/brand detail must be direct(*_items) ∪
 * derived(*_photos→photo_items/project_photos) — deduped by id, direct
 * listed first. See spec §7-1 stage 2 / lib/relations.ts.
 */

vi.mock('@/lib/supabase/public', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase/public'
import { fetchProjectBySlug, fetchItemBySlug, fetchBrandBySlug, fetchPhotoById } from '@/lib/api'

type QBResult = { data: unknown; error: unknown }

// Chainable query builder stub: every call returns itself, `.then`/`.maybeSingle`
// resolve the fixed result — mirrors tests/unit/admin/api/projects.test.ts.
function makeQB(result: QBResult): Record<string, unknown> {
  const methods = ['select', 'eq', 'neq', 'order', 'limit']
  const qb: Record<string, unknown> = {}
  methods.forEach((m) => {
    qb[m] = vi.fn(() => qb)
  })
  qb.maybeSingle = vi.fn(() => Promise.resolve(result))
  return qb
}

const fromMock = supabase.from as unknown as Mock

afterEach(() => {
  fromMock.mockReset()
})

function project(id: string) {
  return {
    id,
    slug: `p-${id}`,
    title: `Project ${id}`,
    description: null,
    year: null,
    area: null,
    location: null,
    client: null,
    inquiry_url: null,
    status: 'published',
    updated_at: null,
    project_photos: [],
    project_categories: [],
  }
}

function item(id: string) {
  return {
    id,
    slug: `i-${id}`,
    name: `Item ${id}`,
    description: null,
    nara_url: null,
    status: 'published',
    brand_id: null,
    updated_at: null,
    brands: null,
    photo_items: [],
    item_categories: [],
  }
}

function photo(id: string) {
  return {
    id,
    image_url: `u-${id}`,
    alt_text: null,
    title: null,
    description: null,
    created_at: null,
    updated_at: null,
    project_photos: [],
  }
}

describe('fetchProjectBySlug — related items union', () => {
  it('unions direct project_items with derived project_photos→photo_items, direct first, deduped', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          ...project('proj-1'),
          project_items: [{ items: item('a') }, { items: item('b') }],
          project_photos: [
            { is_main: false, order: 0, photos: { id: 'ph1', image_url: 'u1', alt_text: null, title: null, photo_items: [{ items: item('b') }, { items: item('c') }] } },
          ],
        },
        error: null,
      })
    )

    const result = await fetchProjectBySlug('p-proj-1')

    expect(result?.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('falls back to derived-only items when no direct links exist', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          ...project('proj-2'),
          project_items: [],
          project_photos: [
            { is_main: false, order: 0, photos: { id: 'ph1', image_url: 'u1', alt_text: null, title: null, photo_items: [{ items: item('x') }] } },
          ],
        },
        error: null,
      })
    )

    const result = await fetchProjectBySlug('p-proj-2')

    expect(result?.items.map((i) => i.id)).toEqual(['x'])
  })
})

describe('fetchItemBySlug — related projects union', () => {
  it('unions direct project_items with derived photo_items→project_photos, direct first, deduped, published-only', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          ...item('item-1'),
          brands: null,
          project_items: [{ projects: project('a') }, { projects: project('b') }],
          photo_items: [
            {
              is_main: false,
              order: 0,
              photos: {
                id: 'ph1',
                image_url: 'u1',
                alt_text: null,
                title: null,
                project_photos: [{ projects: project('b') }, { projects: project('c') }, { projects: { ...project('d'), status: 'draft' } }],
              },
            },
          ],
        },
        error: null,
      })
    )

    const result = await fetchItemBySlug('i-item-1')

    expect(result?.projects.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('fetchBrandBySlug — related projects union (orchestrator extension)', () => {
  it('unions direct project_items with derived photo_items→project_photos across the brand\'s items, direct first, deduped, published-only', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          id: 'brand-1',
          slug: 'brand-1',
          name_ko: 'Brand',
          name_en: null,
          description: null,
          logo_image_url: null,
          cover_image_url: null,
          website_url: null,
          items: [
            {
              ...item('item-1'),
              brands: null,
              project_items: [{ projects: project('a') }],
              derived_pi: [
                {
                  is_main: false,
                  order: 0,
                  photos: {
                    id: 'ph1',
                    image_url: 'u1',
                    alt_text: null,
                    title: null,
                    project_photos: [{ projects: project('b') }, { projects: { ...project('d'), status: 'draft' } }],
                  },
                },
              ],
            },
            {
              ...item('item-2'),
              brands: null,
              project_items: [{ projects: project('b') }],
              derived_pi: [
                {
                  is_main: false,
                  order: 0,
                  photos: {
                    id: 'ph2',
                    image_url: 'u2',
                    alt_text: null,
                    title: null,
                    project_photos: [{ projects: project('c') }],
                  },
                },
              ],
            },
          ],
        },
        error: null,
      })
    )

    const result = await fetchBrandBySlug('brand-1')

    expect(result?.projects.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('fetchPhotoById', () => {
  it('returns null when the photo has no published project link (item-gallery-only)', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          ...photo('ph-1'),
          project_photos: [{ order: 0, projects: { ...project('draft-1'), status: 'draft' } }],
          tagged: [],
        },
        error: null,
      })
    )

    const result = await fetchPhotoById('ph-1')

    expect(result).toBeNull()
  })

  it('maps tagged photo_items to items, main-first then by order', async () => {
    fromMock.mockReturnValue(
      makeQB({
        data: {
          ...photo('ph-2'),
          project_photos: [{ order: 0, projects: project('pub-1') }],
          tagged: [
            { is_main: false, order: 1, items: item('b') },
            { is_main: true, order: 0, items: item('a') },
          ],
        },
        error: null,
      })
    )

    const result = await fetchPhotoById('ph-2')

    expect(result?.projectSlug).toBe('p-pub-1')
    expect(result?.items.map((i) => i.id)).toEqual(['a', 'b'])
  })
})
