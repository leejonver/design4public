import { mapTag, mapBrand, mapItem, mapProject, mapPhoto } from '@/lib/dto'

// Fixture rows mimic the PostgREST join shapes the mappers receive.
// They are typed as object literals (no `any`) — the mappers accept Record<string, any>.

const tagRow = {
  id: 't1',
  name: 'Chair',
  type: 'item',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

const brandRow = {
  id: 'b1',
  name_ko: '한샘',
  name_en: 'Hanssem',
  description: '브랜드 설명',
  logo_image_url: 'https://cdn/logo.png',
  cover_image_url: 'https://cdn/cover.png',
  website_url: 'https://hanssem.com',
  status: 'visible',
  slug: 'hanssem',
  brand_tags: [
    { tags: { id: 'bt1', name: 'BrandTag', type: 'brand', created_at: 'c', updated_at: 'u' } },
    { tags: null },
  ],
  created_at: 'c',
  updated_at: 'u',
}

const itemRow = {
  id: 'i1',
  name: '의자',
  description: '아이템 설명',
  slug: 'chair',
  status: 'available',
  nara_url: 'https://nara/chair',
  brands: brandRow,
  item_tags: [
    { tags: { id: 'it1', name: 'ItemTag', type: 'item', created_at: 'c', updated_at: 'u' } },
    { tags: null },
  ],
  // Deliberately unsorted: main is not first, orders are out of sequence.
  photo_items: [
    { is_main: false, order: 2, photos: { id: 'p2', image_url: 'p2.jpg', alt_text: 'alt2' } },
    { is_main: true, order: 5, photos: { id: 'p1', image_url: 'p1.jpg', alt_text: null } },
    { is_main: false, order: 1, photos: { id: 'p3', image_url: 'p3.jpg', alt_text: 'alt3' } },
    { is_main: false, order: 0, photos: null },
  ],
  created_at: 'c',
  updated_at: 'u',
}

const projectRow = {
  id: 'pr1',
  title: '강남 공공디자인',
  description: '프로젝트 설명',
  location: '서울시 강남구',
  year: 2023,
  area: 120,
  status: 'published',
  inquiry_url: 'https://inq',
  project_tags: [
    { tags: { id: 'pt1', name: 'ProjTag', type: 'project', created_at: 'c', updated_at: 'u' } },
  ],
  project_items: [{ items: itemRow }, { items: null }],
  project_photos: [
    { is_main: false, order: 1, photos: { id: 'pp2', image_url: 'pp2.jpg', alt_text: 'a' } },
    { is_main: true, order: 9, photos: { id: 'pp1', image_url: 'pp1.jpg', alt_text: 'b' } },
  ],
  created_at: 'c',
  updated_at: 'u',
}

const photoRow = {
  id: 'ph1',
  image_url: 'photo.jpg',
  alt_text: 'altp',
  title: '사진 제목',
  description: '사진 설명',
  photo_tags: [
    { tags: { id: 'pht1', name: 'PhotoTag', type: 'photo', created_at: 'c', updated_at: 'u' } },
  ],
  photo_items: [{ items: itemRow }, { items: null }],
  created_at: 'c',
  updated_at: 'u',
}

describe('mapTag', () => {
  it('maps a tag row and renames timestamp columns', () => {
    expect(mapTag(tagRow)).toEqual({
      id: 't1',
      name: 'Chair',
      type: 'item',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    })
  })

  it('falls back updatedAt to createdAt when updated_at is absent', () => {
    expect(mapTag({ id: 't', name: 'n', type: 'item', created_at: 'c' }).updatedAt).toBe('c')
  })
})

describe('mapBrand', () => {
  it('uses name_ko as the canonical name', () => {
    const brand = mapBrand(brandRow)
    expect(brand.name).toBe('한샘')
    expect(brand.nameKo).toBe('한샘')
    expect(brand.nameEn).toBe('Hanssem')
  })

  it('maps tags from brand_tags(tags), filtering nulls — never hardcoded []', () => {
    const brand = mapBrand(brandRow)
    expect(brand.tags).toHaveLength(1)
    expect(brand.tags?.[0].name).toBe('BrandTag')
  })

  it('returns an empty tags array only when the join is empty', () => {
    expect(mapBrand({ ...brandRow, brand_tags: [] }).tags).toEqual([])
  })
})

describe('mapItem', () => {
  it('maps tags from item_tags(tags), not a hardcoded []', () => {
    const item = mapItem(itemRow)
    expect(item.tags).toHaveLength(1)
    expect(item.tags[0].name).toBe('ItemTag')
  })

  it('orders images main-first then by order, dropping rows without a photo', () => {
    const item = mapItem(itemRow)
    expect(item.images.map((i) => i.id)).toEqual(['p1', 'p3', 'p2'])
    expect(item.images[0].isMain).toBe(true)
    expect(item.images.slice(1).every((i) => i.isMain === false)).toBe(true)
  })

  it('defaults a missing alt_text to an empty string', () => {
    const item = mapItem(itemRow)
    expect(item.images[0].alt).toBe('')
  })

  it('embeds the mapped brand and maps nara_url to mallUrl', () => {
    const item = mapItem(itemRow)
    expect(item.brand.name).toBe('한샘')
    expect(item.mallUrl).toBe('https://nara/chair')
  })
})

describe('mapProject', () => {
  it('maps title to name and year to completionYear', () => {
    const project = mapProject(projectRow)
    expect(project.name).toBe('강남 공공디자인')
    expect(project.completionYear).toBe(2023)
  })

  it('maps tags from project_tags(tags) — never hardcoded []', () => {
    const project = mapProject(projectRow)
    expect(project.tags).toHaveLength(1)
    expect(project.tags[0].name).toBe('ProjTag')
  })

  it('maps connectedItems from project_items(items), filtering nulls', () => {
    const project = mapProject(projectRow)
    expect(project.connectedItems).toHaveLength(1)
    expect(project.connectedItems[0].name).toBe('의자')
  })

  it('orders project images main-first', () => {
    const project = mapProject(projectRow)
    expect(project.images.map((i) => i.id)).toEqual(['pp1', 'pp2'])
  })
})

describe('mapPhoto', () => {
  it('maps the photo row fields', () => {
    const photo = mapPhoto(photoRow)
    expect(photo.imageUrl).toBe('photo.jpg')
    expect(photo.altText).toBe('altp')
    expect(photo.title).toBe('사진 제목')
  })

  it('maps tags from photo_tags(tags) and connectedItems from photo_items(items)', () => {
    const photo = mapPhoto(photoRow)
    expect(photo.tags).toHaveLength(1)
    expect(photo.tags[0].name).toBe('PhotoTag')
    expect(photo.connectedItems).toHaveLength(1)
    expect(photo.connectedItems[0].name).toBe('의자')
  })
})
