import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Content entities whose mutations can change what the public site renders.
 * `tag` is included for call-site symmetry but maps to no paths today —
 * tags are not surfaced on the public site (see lib/api.ts). Revisit in M6.
 */
export type RevalidateEntity =
  | 'project'
  | 'item'
  | 'brand'
  | 'photo'
  | 'category'
  | 'tag'
  | 'site_settings'
  | 'home_featured'

// A cache target to purge. A `path` target purges the full-route cache for a
// concrete URL. A `tag` target purges every cached public read carrying that
// tag (see lib/supabase/public.ts): reads are tagged `sb:<table>`, so a tag
// purge revalidates every detail page whose query hit that table — including
// cross-entity derived relations. Detail pages MUST use tags: a dynamic-pattern
// revalidatePath('/items/[slug]', 'page') does not invalidate the cached
// fetches of already-rendered concrete item pages in Next 14. The photo
// detail page (/photos/[id]) reads `photos` → tag `sb:photos`.
type Target = { path: string; type?: 'page' } | { tag: string }

const HOME: Target = { path: '/' }
const SITEMAP: Target = { path: '/sitemap.xml' }
const PROJECTS_LIST: Target = { path: '/projects' }
const ITEMS_LIST: Target = { path: '/items' }
const BRANDS_LIST: Target = { path: '/brands' }
const PHOTOS_LIST: Target = { path: '/photos' }
const PROJECT_DETAILS: Target = { tag: 'sb:projects' }
const ITEM_DETAILS: Target = { tag: 'sb:items' }
const BRAND_DETAILS: Target = { tag: 'sb:brands' }
const PHOTO_DETAILS: Target = { tag: 'sb:photos' }

/**
 * The exact set of cache targets a mutation of `type` (optionally a specific
 * `slug`) must purge. Cross-entity effects (e.g. an item appearing on project
 * detail pages) use per-table tags because the specific affected slugs are not
 * known at the call site. See docs/plans/2026-07-03-m2-revalidation.md.
 */
function targetsFor(type: RevalidateEntity, slug?: string): Target[] {
  switch (type) {
    case 'project':
      return [
        HOME,
        PROJECTS_LIST,
        PHOTOS_LIST, // photo feed shows project title + published-only filter
        SITEMAP,
        slug ? { path: `/projects/${slug}` } : PROJECT_DETAILS,
        ITEM_DETAILS, // item detail lists related published projects
        BRAND_DETAILS, // brand detail lists projects across its items
        PHOTO_DETAILS, // photo detail title + publish-gate (M5)
      ]
    case 'item':
      return [
        HOME,
        ITEMS_LIST,
        SITEMAP,
        slug ? { path: `/items/${slug}` } : ITEM_DETAILS,
        PROJECT_DETAILS, // project detail lists connected items
        BRAND_DETAILS, // brand detail lists its items
        PHOTO_DETAILS, // photo detail's "이 사진 속 가구" block (M5)
      ]
    case 'brand':
      return [
        HOME,
        BRANDS_LIST,
        ITEMS_LIST, // item summaries show the brand name
        SITEMAP,
        slug ? { path: `/brands/${slug}` } : BRAND_DETAILS,
        ITEM_DETAILS, // item detail shows its brand block
      ]
    case 'photo':
      return [
        HOME,
        PROJECTS_LIST, // project cover images
        ITEMS_LIST, // item images
        PHOTOS_LIST,
        SITEMAP, // photo URLs now live in the sitemap (M5)
        PROJECT_DETAILS, // project galleries
        ITEM_DETAILS, // item galleries
        BRAND_DETAILS, // brand's items' images
        PHOTO_DETAILS, // /photos/[id] bodies (M5)
      ]
    case 'category':
      return [
        HOME,
        PROJECTS_LIST,
        ITEMS_LIST,
        PHOTOS_LIST,
        PROJECT_DETAILS,
        ITEM_DETAILS,
        BRAND_DETAILS,
        PHOTO_DETAILS, // project category badges on photo detail (M5)
      ]
    case 'site_settings':
    case 'home_featured':
      return [HOME]
    case 'tag':
      return [] // tags are not rendered on the public site (see lib/api.ts)
  }
}

/**
 * Purges the public-site cache affected by a successful mutation. Best-effort:
 * never throws — revalidation failure must not fail the originating mutation
 * (spec §4: mutation success is primary). Call AFTER the DB write succeeds.
 */
export function revalidateEntity(type: RevalidateEntity, slug?: string): void {
  for (const target of targetsFor(type, slug)) {
    try {
      if ('tag' in target) revalidateTag(target.tag)
      else if (target.type) revalidatePath(target.path, target.type)
      else revalidatePath(target.path)
    } catch (error) {
      const label = 'tag' in target ? target.tag : target.path
      console.error(`[revalidate] failed for ${label} (${type})`, error)
    }
  }
}
