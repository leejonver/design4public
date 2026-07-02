// DB row -> API DTO mappers + canonical PostgREST select strings.
// Single source of truth for relation completeness (renewal_requirements.md §3, §11).
//
// Two classification systems (migration 022):
//   - categories: typed (project|item), managed in 카테고리 설정. project_categories/item_categories.
//   - tags: free-form (no type), attach to project/item/photo. project_tags/item_tags/photo_tags.
// Brand has neither.

import type { Brand, Category, Item, Photo, Project, Tag, ImageData, Manager } from '@/types'
import type { Tables } from './database.types'

// ---- select strings ----
export const BRAND_SELECT = '*'
export const ITEM_SELECT =
  '*, brands(*), item_categories(categories(*)), item_tags(tags(*)), photo_items(is_main, order, photos(*))'
export const PROJECT_SELECT =
  '*, project_categories(categories(*)), project_tags(tags(*)), project_items(items(*, brands(*))), project_photos(is_main, order, photos(*))'
export const PHOTO_SELECT =
  '*, photo_tags(tags(*)), photo_items(is_main, order, items(*, brands(*))), project_photos(projects(id, title, slug, status))'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic PostgREST join shape
type Row = Record<string, any>

const ts = (r: Row) => ({
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? r.created_at,
})

export function mapCategory(r: Row): Category {
  return { id: r.id, name: r.name, type: r.type, ...ts(r) }
}

export function mapTag(r: Row): Tag {
  return { id: r.id, name: r.name, ...ts(r) }
}

function mapCategoriesJoin(join: Row[] | null | undefined): Category[] {
  return (join ?? []).map((j) => j.categories).filter(Boolean).map(mapCategory)
}

function mapTagsJoin(join: Row[] | null | undefined): Tag[] {
  return (join ?? []).map((j) => j.tags).filter(Boolean).map(mapTag)
}

/** photo_items / project_photos join rows -> ImageData[] ordered by `order`, main first. */
function mapImagesFromPhotos(join: Row[] | null | undefined): ImageData[] {
  return (join ?? [])
    .filter((j) => j.photos)
    .slice()
    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0))
    .map((j, i) => ({
      id: j.photos.id,
      url: j.photos.image_url,
      alt: j.photos.alt_text ?? '',
      isMain: !!j.is_main,
      title: j.photos.title ?? undefined,
      order: j.order ?? i,
    }))
}

export function mapBrand(r: Row): Brand {
  return {
    id: r.id,
    name: r.name_ko,
    nameKo: r.name_ko,
    nameEn: r.name_en ?? undefined,
    description: r.description ?? '',
    logoImageUrl: r.logo_image_url ?? undefined,
    coverImageUrl: r.cover_image_url ?? undefined,
    websiteUrl: r.website_url ?? undefined,
    status: r.status ?? 'visible',
    slug: r.slug,
    ...ts(r),
  }
}

export function mapItem(r: Row): Item {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    images: mapImagesFromPhotos(r.photo_items),
    mallUrl: r.nara_url ?? undefined,
    brand: r.brands ? mapBrand(r.brands) : (undefined as unknown as Brand),
    categories: mapCategoriesJoin(r.item_categories),
    tags: mapTagsJoin(r.item_tags),
    slug: r.slug,
    status: r.status,
    ...ts(r),
  }
}

export function mapProject(r: Row): Project {
  return {
    id: r.id,
    name: r.title,
    description: r.description ?? '',
    client: r.client ?? undefined,
    location: r.location ?? '',
    completionYear: r.year ?? 0,
    area: r.area ?? undefined,
    images: mapImagesFromPhotos(r.project_photos),
    categories: mapCategoriesJoin(r.project_categories),
    tags: mapTagsJoin(r.project_tags),
    connectedItems: (r.project_items ?? []).map((j: Row) => j.items).filter(Boolean).map(mapItem),
    inquiryUrl: r.inquiry_url ?? undefined,
    status: r.status,
    ...ts(r),
  }
}

export function mapPhoto(r: Row): Photo {
  return {
    id: r.id,
    imageUrl: r.image_url,
    altText: r.alt_text ?? undefined,
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    connectedItems: (r.photo_items ?? []).map((j: Row) => j.items).filter(Boolean).map(mapItem),
    tags: mapTagsJoin(r.photo_tags),
    ...ts(r),
  }
}

// profiles row -> Manager DTO (master-only user management, §8).
export function mapManager(r: Tables<'profiles'>): Manager {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email,
    role: r.role,
    approvalStatus: r.status,
    lastLoginAt: r.last_login_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
