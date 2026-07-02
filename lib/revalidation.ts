import { revalidatePath } from 'next/cache'

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

// A full-route-cache target to purge. When `type` is 'page' the string is a
// route *pattern* (e.g. '/projects/[slug]') that purges every page under that
// dynamic segment; otherwise it is a concrete URL path.
type Target = { path: string; type?: 'page' }

const HOME: Target = { path: '/' }
const SITEMAP: Target = { path: '/sitemap.xml' }
const PROJECTS_LIST: Target = { path: '/projects' }
const ITEMS_LIST: Target = { path: '/items' }
const BRANDS_LIST: Target = { path: '/brands' }
const PHOTOS_LIST: Target = { path: '/photos' }
const PROJECT_DETAILS: Target = { path: '/projects/[slug]', type: 'page' }
const ITEM_DETAILS: Target = { path: '/items/[slug]', type: 'page' }
const BRAND_DETAILS: Target = { path: '/brands/[slug]', type: 'page' }

/**
 * The exact set of cache targets a mutation of `type` (optionally a specific
 * `slug`) must purge. Cross-entity effects (e.g. an item appearing on project
 * detail pages) use dynamic route patterns because the specific affected slugs
 * are not known at the call site. See docs/plans/2026-07-03-m2-revalidation.md.
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
      ]
    case 'item':
      return [
        HOME,
        ITEMS_LIST,
        SITEMAP,
        slug ? { path: `/items/${slug}` } : ITEM_DETAILS,
        PROJECT_DETAILS, // project detail lists connected items
        BRAND_DETAILS, // brand detail lists its items
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
        PROJECT_DETAILS, // project galleries
        ITEM_DETAILS, // item galleries
        BRAND_DETAILS, // brand's items' images
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
      if (target.type) revalidatePath(target.path, target.type)
      else revalidatePath(target.path)
    } catch (error) {
      console.error(`[revalidate] failed for ${target.path} (${type})`, error)
    }
  }
}
