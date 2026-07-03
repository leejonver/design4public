# M2: On-Demand Revalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an admin creates/updates/deletes content in `/api/admin/*`, the public site reflects the change immediately instead of waiting up to 1 hour for ISR — by calling `revalidatePath()` for every affected route after each successful mutation.

**Architecture:** A single pure helper `lib/revalidation.ts` maps an entity type (+ optional slug) to the exact set of public-site cache targets, then calls Next's `revalidatePath`. Each mutating admin route handler calls `revalidateEntity(...)` after its DB write succeeds and before responding. Revalidation is best-effort: it never throws, so a revalidation failure can never fail the mutation. The `revalidate = 3600` ISR backstop on every site page is left untouched.

**Tech Stack:** Next.js 14.2.32 App Router (`revalidatePath` from `next/cache`, Node runtime), TypeScript 5.5, Vitest 3.2 (jsdom), Supabase JS (service-role client, already mocked in tests).

## Global Constraints

- **Branch:** all work on `unify/m2-revalidation`, branched from `unify/m1-repo-merge`. Never commit to `main` or `unify/m1-repo-merge`.
- **Failure semantics (spec §4):** mutation success is primary. Revalidation runs *after* the DB write succeeds and its failure is caught + logged, never propagated. A thrown `revalidatePath` must not change the HTTP status the handler returns.
- **Backstop unchanged:** do NOT remove or alter `export const revalidate = 3600` on any `app/(site)/**` page or `app/(site)/sitemap.ts`.
- **Surgical:** touch only `lib/revalidation.ts` (new), the mutating admin handlers, and new test files. Do not refactor handler logic, auth, or DTO mapping.
- **Runtime:** handlers are already Node runtime (same app as the site) — no secret/webhook needed; direct `revalidatePath` call only.
- **Gate (all must pass before final commit):** `npx tsc --noEmit` → 0 errors; `npx vitest run` → all green (60 existing + new); `npm run build` → success.
- **Route-group note:** pages live under `app/(site)/…` but route groups do not appear in URLs. The URL path for `app/(site)/projects/[slug]/page.tsx` is `/projects/[slug]`, and `app/(site)/sitemap.ts` is served at `/sitemap.xml`. Use URL paths (never `(site)`) in `revalidatePath`.
- **Dynamic vs literal target:** `revalidatePath('/projects')` purges that one concrete path. `revalidatePath('/projects/[slug]', 'page')` purges **every** page under that dynamic segment — used for cross-entity effects where the specific affected slug(s) are unknown at the call site.

---

## Background: the complete entity → path mapping (derived from `lib/api.ts` + site pages)

The public site is 8 data-backed routes. Their read dependencies (from `lib/api.ts`):

| Route (URL) | Source page | Reads (tables/relations) |
|---|---|---|
| `/` | `app/(site)/page.tsx` (`fetchHomeData`) | projects, items, brands, photos, project_photos, photo_items, site_settings.featured_project_id, home_featured, categories (names) |
| `/projects` | `projects/page.tsx` (`fetchProjects`,`fetchCategories`) | projects, project_photos, photos, project_categories, categories |
| `/projects/[slug]` | `projects/[slug]/page.tsx` (`fetchProjectBySlug`) | projects, project_photos, photos, project_categories, categories, project_items, items, brands, photo_items, item_categories |
| `/items` | `items/page.tsx` (`fetchItems`,`fetchCategories`) | items, photo_items, photos, brands, item_categories, categories |
| `/items/[slug]` | `items/[slug]/page.tsx` (`fetchItemBySlug`) | items, photo_items, photos, brands, item_categories, categories, **project_items, projects (published)**, project_categories |
| `/brands` | `brands/page.tsx` (`fetchBrands`) | brands, items (count) |
| `/brands/[slug]` | `brands/[slug]/page.tsx` (`fetchBrandBySlug`) | brands, items, photo_items, photos, item_categories, categories, **project_items, projects (published)**, project_categories |
| `/photos` | `photos/page.tsx` (`fetchPhotos`,`fetchCategories`) | photos, project_photos, projects, project_categories, categories |
| `/sitemap.xml` | `app/(site)/sitemap.ts` | projects, items, brands (via fetchProjects/Items/Brands) |

`/privacy` and `/terms` are static (no data) — never revalidated.

**Tags are NOT surfaced on the public site.** `lib/api.ts` selects no `project_tags` / `item_tags` / `photo_tags` (verified: the only "tag" strings on the site are the CSS class `.d4p-hero-tag`). So `tag` mutations map to an empty path set today (revisit in M6 when search indexes tag text).

Inverting the table gives the mapping implemented in Task 2:

| Entity mutated | Concrete paths | Dynamic patterns (`,'page'`) | Rationale |
|---|---|---|---|
| `project` | `/`, `/projects`, `/photos`, `/sitemap.xml`, own `/projects/{slug}` | `/items/[slug]`, `/brands/[slug]` | home/list/sitemap list projects; photo feed shows project title + published-only filter; item & brand detail list related published projects |
| `item` | `/`, `/items`, `/sitemap.xml`, own `/items/{slug}` | `/projects/[slug]`, `/brands/[slug]` | home/list/sitemap list items; project detail lists connected items; brand detail lists its items |
| `brand` | `/`, `/brands`, `/items`, `/sitemap.xml`, own `/brands/{slug}` | `/items/[slug]` | home/list/sitemap list brands; item summaries show brand name; item detail shows its brand block |
| `photo` | `/`, `/projects`, `/items`, `/photos` | `/projects/[slug]`, `/items/[slug]`, `/brands/[slug]` | covers/feed + galleries; a photo may link to any project/item, so patterns cover all detail pages |
| `category` | `/`, `/projects`, `/items`, `/photos` | `/projects/[slug]`, `/items/[slug]`, `/brands/[slug]` | category names appear in every project/item summary + detail and the photo feed |
| `site_settings` | `/` | — | `featured_project_id` → home hero only |
| `home_featured` | `/` | — | curated showcase → home only |
| `tag` | — | — | not rendered on the public site |

Over-invalidation (dynamic patterns) is harmless: ISR regenerates a purged page lazily on its next request, and the 3600s backstop remains. Under-invalidation is the bug we are fixing, so we err toward covering cross-entity effects.

**Known limitation (documented, not fixed here):** on a *rename* that regenerates a slug (only `brands` PUT does this — `app/api/admin/brands/[id]/route.ts:42-59`), we revalidate the **new** slug's detail path; the **old** slug's stale page falls back to the 3600s backstop. Acceptable per spec §4 (backstop retained). See "Open questions".

---

## File Structure

**Created:**
- `lib/revalidation.ts` — the `revalidateEntity(type, slug?)` helper + `RevalidateEntity` type. Single source of the entity→path mapping.
- `tests/unit/lib/revalidation.test.ts` — mapping-table tests (mock `next/cache`, assert exact `revalidatePath` calls per entity type + no-throw guarantee).
- `tests/unit/admin/api/projects-revalidation.test.ts` — representative handler integration test (revalidatePath called on success; mutation still 201 when revalidatePath throws).

**Modified (add import + one call per successful mutation):**
- `app/api/admin/projects/route.ts` (POST)
- `app/api/admin/projects/[id]/route.ts` (PUT, DELETE)
- `app/api/admin/items/route.ts` (POST)
- `app/api/admin/items/[id]/route.ts` (PUT, DELETE)
- `app/api/admin/brands/route.ts` (POST)
- `app/api/admin/brands/[id]/route.ts` (PUT, DELETE)
- `app/api/admin/photos/[photo_id]/route.ts` (PUT, DELETE)
- `app/api/admin/categories/route.ts` (POST)
- `app/api/admin/categories/[id]/route.ts` (PUT, DELETE)
- `app/api/admin/tags/route.ts` (POST)
- `app/api/admin/tags/[id]/route.ts` (DELETE)
- `app/api/admin/home-settings/route.ts` (PUT)

**Deliberately NOT modified (no public-site surface — verified):**
- `app/api/admin/auth/{login,logout,signup}/route.ts` — session/cookies only.
- `app/api/admin/managers/route.ts`, `app/api/admin/managers/[id]/route.ts` — write only `profiles` (admin users); no site read touches `profiles`.
- `app/api/admin/upload/route.ts` — writes to Supabase Storage bucket `images` and returns a URL; the DB photo asset + join rows are created later by `lib/image-sync.ts` when that URL is attached through the projects/items/photos handlers (which DO revalidate).

---

## Task 1: Create the M2 branch

**Files:** none (git only).

- [ ] **Step 1: Branch from M1**

Run:
```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git checkout unify/m1-repo-merge
git pull --ff-only 2>/dev/null || true
git checkout -b unify/m2-revalidation
```
Expected: `Switched to a new branch 'unify/m2-revalidation'`

- [ ] **Step 2: Confirm clean baseline**

Run:
```bash
git status --short && npx vitest run --reporter=dot 2>&1 | tail -3
```
Expected: no uncommitted changes; `Tests  60 passed (60)`.

---

## Task 2: `lib/revalidation.ts` + mapping unit tests (TDD)

**Files:**
- Create: `lib/revalidation.ts`
- Test: `tests/unit/lib/revalidation.test.ts`

**Interfaces:**
- Produces:
  - `export type RevalidateEntity = 'project' | 'item' | 'brand' | 'photo' | 'category' | 'tag' | 'site_settings' | 'home_featured'`
  - `export function revalidateEntity(type: RevalidateEntity, slug?: string): void` — calls `revalidatePath` for each affected target; never throws.

- [ ] **Step 1: Write the failing mapping test**

Create `tests/unit/lib/revalidation.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { revalidateEntity } from '@/lib/revalidation'

// next/cache has no request scope under Vitest; mock it so we can inspect calls.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mock = vi.mocked(revalidatePath)

// Normalize mock.calls into comparable [path, type?] tuples.
const calls = () => mock.mock.calls.map((c) => (c.length > 1 ? [c[0], c[1]] : [c[0]]))

beforeEach(() => mock.mockReset())

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/revalidation.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/revalidation"` (module does not exist yet).

- [ ] **Step 3: Implement `lib/revalidation.ts`**

Create `lib/revalidation.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/revalidation.test.ts`
Expected: PASS — 10 tests passed.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (0 errors). The `switch` is exhaustive over `RevalidateEntity`, so every branch returns.

- [ ] **Step 6: Commit**

```bash
git add lib/revalidation.ts tests/unit/lib/revalidation.test.ts
git commit -m "feat(revalidation): add revalidateEntity path-mapping helper

Maps each content entity (+ optional slug) to the exact public-site
routes it affects and calls revalidatePath. Best-effort: never throws.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Wire projects handlers + representative integration test

**Files:**
- Modify: `app/api/admin/projects/route.ts` (POST)
- Modify: `app/api/admin/projects/[id]/route.ts` (PUT, DELETE)
- Test: `tests/unit/admin/api/projects-revalidation.test.ts` (create)

**Interfaces:**
- Consumes: `revalidateEntity` from `@/lib/revalidation` (Task 2).

- [ ] **Step 1: Write the failing integration test**

Create `tests/unit/admin/api/projects-revalidation.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { SessionUser } from '@/lib/auth'
import { POST } from '@/app/api/admin/projects/route'
import { requireUser, requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/auth', () => {
  class AuthError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'AuthError'
      this.status = status
    }
  }
  const authErrorResponse = (error: unknown) => {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: error.status,
        headers: { 'content-type': 'application/json' },
      })
    }
    throw error
  }
  return { AuthError, authErrorResponse, requireUser: vi.fn(), requireRole: vi.fn() }
})

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

vi.mock('@/lib/image-sync', () => ({
  syncProjectPhotos: vi.fn().mockResolvedValue(undefined),
  syncProjectItems: vi.fn().mockResolvedValue(undefined),
  syncCategories: vi.fn().mockResolvedValue(undefined),
  syncFreeTags: vi.fn().mockResolvedValue(undefined),
}))

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json' },
  })
}

type QBResult = { data: unknown; error: unknown; count?: number }
function makeQB(result: QBResult): Record<string, unknown> {
  const qb: Record<string, unknown> = {}
  ;['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'or', 'order', 'range', 'limit', 'single', 'maybeSingle', 'in', 'not'].forEach(
    (m) => (qb[m] = vi.fn(() => qb)),
  )
  qb.then = (resolve: (r: QBResult) => unknown) => resolve(result)
  return qb
}

const fromMock = supabaseAdmin.from as unknown as Mock
const revalidateMock = vi.mocked(revalidatePath)
const fakeUser: SessionUser = { id: 'u1', email: 'a@b.c', name: 'admin', role: 'master', status: 'approved' }

const projectRow = { id: 'p1', title: 'T', description: '', slug: 'test-project', status: 'published', project_tags: [], project_items: [], project_photos: [], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }

function makeRequest(url: string, body: unknown): NextRequest {
  return new Request(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) as unknown as NextRequest
}

// POST does: slug-dup check → insert → final select. Three from() calls.
function primePostSuccess() {
  fromMock
    .mockReturnValueOnce(makeQB({ data: null, error: null })) // slug dup check
    .mockReturnValueOnce(makeQB({ data: { id: 'p1' }, error: null })) // insert
    .mockReturnValueOnce(makeQB({ data: projectRow, error: null })) // final select
}

describe('projects POST revalidation wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(NextResponse, 'json').mockImplementation(jsonResponse as unknown as typeof NextResponse.json)
    fromMock.mockReset()
    revalidateMock.mockReset()
    vi.mocked(requireUser).mockResolvedValue(fakeUser)
    vi.mocked(requireRole).mockResolvedValue(fakeUser)
  })
  afterEach(() => vi.restoreAllMocks())

  it('revalidates the project routes on a successful create', async () => {
    primePostSuccess()
    const res = await POST(makeRequest('http://localhost/api/admin/projects', { name: '새 프로젝트' }))
    expect(res.status).toBe(201)
    const paths = revalidateMock.mock.calls.map((c) => c[0])
    // uses the freshly generated slug for the detail path
    expect(paths).toContain('/')
    expect(paths).toContain('/projects')
    expect(paths).toContain('/sitemap.xml')
    expect(paths.some((p) => p.startsWith('/projects/'))).toBe(true)
    expect(revalidateMock).toHaveBeenCalledWith('/items/[slug]', 'page')
    expect(revalidateMock).toHaveBeenCalledWith('/brands/[slug]', 'page')
  })

  it('still returns 201 when revalidatePath throws (mutation is primary)', async () => {
    primePostSuccess()
    revalidateMock.mockImplementation(() => {
      throw new Error('revalidatePath called outside request scope')
    })
    const res = await POST(makeRequest('http://localhost/api/admin/projects', { name: '새 프로젝트' }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/admin/api/projects-revalidation.test.ts`
Expected: FAIL — first test fails because `revalidatePath` is never called (POST handler not wired yet); `revalidateMock.mock.calls` is empty.

- [ ] **Step 3: Wire `app/api/admin/projects/route.ts` (POST)**

Add the import after line 6 (`import { syncProjectPhotos, ... } from '@/lib/image-sync'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

Then insert the revalidation call after the final `full` select and before the `return`. Change:

```ts
    const { data: full } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', project.id)
      .single()

    return NextResponse.json(
      { success: true, data: full ? mapProject(full) : null, message: '프로젝트가 생성되었습니다.' },
      { status: 201 },
    )
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', project.id)
      .single()

    revalidateEntity('project', slug)

    return NextResponse.json(
      { success: true, data: full ? mapProject(full) : null, message: '프로젝트가 생성되었습니다.' },
      { status: 201 },
    )
```

(`slug` is the generated unique slug from line 63 — always defined here.)

- [ ] **Step 4: Wire `app/api/admin/projects/[id]/route.ts` (PUT + DELETE)**

Add the import after line 5 (`import { syncProjectPhotos, ... } from '@/lib/image-sync'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

**PUT** — insert after the final `full` select, before its `return`. Change:

```ts
    const { data: full } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapProject(full) : null,
      message: '프로젝트가 수정되었습니다.',
    })
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', params.id)
      .single()

    revalidateEntity('project', full?.slug)

    return NextResponse.json({
      success: true,
      data: full ? mapProject(full) : null,
      message: '프로젝트가 수정되었습니다.',
    })
```

**DELETE** — capture the slug before deletion (the row is gone afterward). Change:

```ts
    await requireRole('content_manager')
    // project_photos / project_tags / project_items links cascade on project delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' })
```

to:

```ts
    await requireRole('content_manager')
    // Capture the slug before deletion so we can purge the project's detail page.
    const { data: existing } = await supabaseAdmin
      .from('projects')
      .select('slug')
      .eq('id', params.id)
      .maybeSingle()
    // project_photos / project_tags / project_items links cascade on project delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('project', existing?.slug)
    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' })
```

- [ ] **Step 5: Run the new test + the existing projects test**

Run: `npx vitest run tests/unit/admin/api/projects-revalidation.test.ts tests/unit/admin/api/projects.test.ts`
Expected: PASS — new file 2 tests pass; existing `projects.test.ts` still passes (revalidateEntity swallows the real `revalidatePath` error there, so status stays 201/200).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors. (`full?.slug` is valid: `PROJECT_SELECT` begins with `*`, so `slug` is on the row type; `existing?.slug` likewise.)

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/projects tests/unit/admin/api/projects-revalidation.test.ts
git commit -m "feat(revalidation): wire projects POST/PUT/DELETE to revalidateEntity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: Wire items + brands handlers

**Files:**
- Modify: `app/api/admin/items/route.ts` (POST)
- Modify: `app/api/admin/items/[id]/route.ts` (PUT, DELETE)
- Modify: `app/api/admin/brands/route.ts` (POST)
- Modify: `app/api/admin/brands/[id]/route.ts` (PUT, DELETE)

**Interfaces:**
- Consumes: `revalidateEntity` from `@/lib/revalidation`.

- [ ] **Step 1: Wire `app/api/admin/items/route.ts` (POST)**

Add after line 6 (`import { syncItemPhotos, ... } from '@/lib/image-sync'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

Insert after the final `full` select, before the `return`. Change:

```ts
    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', item.id)
      .single()

    return NextResponse.json(
      { success: true, data: full ? mapItem(full) : null, message: '아이템이 생성되었습니다.' },
      { status: 201 },
    )
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', item.id)
      .single()

    revalidateEntity('item', slug)

    return NextResponse.json(
      { success: true, data: full ? mapItem(full) : null, message: '아이템이 생성되었습니다.' },
      { status: 201 },
    )
```

- [ ] **Step 2: Wire `app/api/admin/items/[id]/route.ts` (PUT + DELETE)**

Add after line 5 (`import { syncItemPhotos, ... } from '@/lib/image-sync'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

**PUT** — change:

```ts
    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapItem(full) : null,
      message: '아이템이 수정되었습니다.',
    })
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('items')
      .select(ITEM_SELECT)
      .eq('id', params.id)
      .single()

    revalidateEntity('item', full?.slug)

    return NextResponse.json({
      success: true,
      data: full ? mapItem(full) : null,
      message: '아이템이 수정되었습니다.',
    })
```

**DELETE** — change:

```ts
    await requireRole('content_manager')
    // photo_items / item_tags / project_items links cascade on item delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('items').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '아이템이 삭제되었습니다.' })
```

to:

```ts
    await requireRole('content_manager')
    // Capture the slug before deletion so we can purge the item's detail page.
    const { data: existing } = await supabaseAdmin
      .from('items')
      .select('slug')
      .eq('id', params.id)
      .maybeSingle()
    // photo_items / item_tags / project_items links cascade on item delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('items').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('item', existing?.slug)
    return NextResponse.json({ success: true, message: '아이템이 삭제되었습니다.' })
```

- [ ] **Step 3: Wire `app/api/admin/brands/route.ts` (POST)**

Add after line 5 (`import { uniqueSlug } from '@/lib/slug'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

Insert after the final `full` select, before the `return`. Change:

```ts
    const { data: full } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', brand.id)
      .single()

    return NextResponse.json(
      { success: true, data: full ? mapBrand(full) : null, message: '브랜드가 생성되었습니다.' },
      { status: 201 },
    )
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', brand.id)
      .single()

    revalidateEntity('brand', slug)

    return NextResponse.json(
      { success: true, data: full ? mapBrand(full) : null, message: '브랜드가 생성되었습니다.' },
      { status: 201 },
    )
```

- [ ] **Step 4: Wire `app/api/admin/brands/[id]/route.ts` (PUT + DELETE)**

Add after line 5 (`import { uniqueSlug } from '@/lib/slug'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

**PUT** — the handler may regenerate `slug` on rename; the final `full` select returns the current slug. Change:

```ts
    const { data: full } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapBrand(full) : null,
      message: '브랜드가 수정되었습니다.',
    })
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', params.id)
      .single()

    // On a rename the slug changes; we revalidate the new slug's detail page.
    // The old slug's stale page falls back to the 3600s ISR backstop.
    revalidateEntity('brand', full?.slug)

    return NextResponse.json({
      success: true,
      data: full ? mapBrand(full) : null,
      message: '브랜드가 수정되었습니다.',
    })
```

**DELETE** — capture the slug before the detach + delete. Change:

```ts
    await requireRole('content_manager')
    // §6-3: detach the brand's items first (items.brand_id -> NULL) before deleting the brand,
    // so the brand FK can never block the delete.
    const { error: detachError } = await supabaseAdmin
      .from('items')
      .update({ brand_id: null })
      .eq('brand_id', params.id)
    if (detachError) throw detachError

    const { error } = await supabaseAdmin.from('brands').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '브랜드가 삭제되었습니다.' })
```

to:

```ts
    await requireRole('content_manager')
    // Capture the slug before deletion so we can purge the brand's detail page.
    const { data: existing } = await supabaseAdmin
      .from('brands')
      .select('slug')
      .eq('id', params.id)
      .maybeSingle()
    // §6-3: detach the brand's items first (items.brand_id -> NULL) before deleting the brand,
    // so the brand FK can never block the delete.
    const { error: detachError } = await supabaseAdmin
      .from('items')
      .update({ brand_id: null })
      .eq('brand_id', params.id)
    if (detachError) throw detachError

    const { error } = await supabaseAdmin.from('brands').delete().eq('id', params.id)
    if (error) throw error
    // Detaching items cleared their brand — refresh item surfaces too.
    revalidateEntity('brand', existing?.slug)
    revalidateEntity('item')
    return NextResponse.json({ success: true, message: '브랜드가 삭제되었습니다.' })
```

(Brand delete nulls `items.brand_id`, so item summaries/detail that showed this brand must refresh — hence the extra `revalidateEntity('item')` with no slug, covering all item detail pages via the pattern.)

- [ ] **Step 5: Typecheck + full suite**

Run: `npx tsc --noEmit && npx vitest run --reporter=dot 2>&1 | tail -3`
Expected: 0 tsc errors; `Tests  72 passed (72)` (60 existing + 10 mapping + 2 projects-revalidation).

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/items app/api/admin/brands
git commit -m "feat(revalidation): wire items and brands handlers to revalidateEntity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 5: Wire photos, categories, tags, home-settings handlers

**Files:**
- Modify: `app/api/admin/photos/[photo_id]/route.ts` (PUT, DELETE)
- Modify: `app/api/admin/categories/route.ts` (POST)
- Modify: `app/api/admin/categories/[id]/route.ts` (PUT, DELETE)
- Modify: `app/api/admin/tags/route.ts` (POST)
- Modify: `app/api/admin/tags/[id]/route.ts` (DELETE)
- Modify: `app/api/admin/home-settings/route.ts` (PUT)

**Interfaces:**
- Consumes: `revalidateEntity` from `@/lib/revalidation`.

- [ ] **Step 1: Wire `app/api/admin/photos/[photo_id]/route.ts` (PUT + DELETE)**

Add after line 5 (`import { syncPhotoItems, syncFreeTags } from '@/lib/image-sync'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

**PUT** — change:

```ts
    const { data: full } = await supabaseAdmin
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', params.photo_id)
      .single()

    return NextResponse.json({
      success: true,
      data: full ? mapPhoto(full) : null,
      message: '사진이 수정되었습니다.',
    })
```

to:

```ts
    const { data: full } = await supabaseAdmin
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('id', params.photo_id)
      .single()

    revalidateEntity('photo')

    return NextResponse.json({
      success: true,
      data: full ? mapPhoto(full) : null,
      message: '사진이 수정되었습니다.',
    })
```

**DELETE** — change:

```ts
    // photo_items / photo_tags / project_photos links cascade on photo delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('photos').delete().eq('id', params.photo_id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '사진이 삭제되었습니다.' })
```

to:

```ts
    // photo_items / photo_tags / project_photos links cascade on photo delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('photos').delete().eq('id', params.photo_id)
    if (error) throw error
    revalidateEntity('photo')
    return NextResponse.json({ success: true, message: '사진이 삭제되었습니다.' })
```

(No slug — the public `/photos/[id]` detail page does not exist yet, M5. `revalidateEntity('photo')` purges the feed, lists, home, and all detail-page galleries via patterns.)

- [ ] **Step 2: Wire `app/api/admin/categories/route.ts` (POST)**

Add after line 5 (`import type { CategoryType } from '@/lib/database.types'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

Change:

```ts
    if (error) throw error

    return NextResponse.json(
      { success: true, data: mapCategory(category), message: '카테고리가 생성되었습니다.' },
      { status: 201 },
    )
```

to:

```ts
    if (error) throw error

    revalidateEntity('category')

    return NextResponse.json(
      { success: true, data: mapCategory(category), message: '카테고리가 생성되었습니다.' },
      { status: 201 },
    )
```

- [ ] **Step 3: Wire `app/api/admin/categories/[id]/route.ts` (PUT + DELETE)**

Add after line 5 (`import type { CategoryType } from '@/lib/database.types'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

**PUT** — change:

```ts
    if (error || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: mapCategory(category),
      message: '카테고리가 수정되었습니다.',
    })
```

to:

```ts
    if (error || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    revalidateEntity('category')

    return NextResponse.json({
      success: true,
      data: mapCategory(category),
      message: '카테고리가 수정되었습니다.',
    })
```

**DELETE** — change:

```ts
    // project_categories / item_categories links cascade on category delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '카테고리가 삭제되었습니다.' })
```

to:

```ts
    // project_categories / item_categories links cascade on category delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('category')
    return NextResponse.json({ success: true, message: '카테고리가 삭제되었습니다.' })
```

- [ ] **Step 4: Wire `app/api/admin/tags/route.ts` (POST)**

Add after line 4 (`import { mapTag } from '@/lib/dto'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

This handler has three success return points (existing tag found, race re-fetch winner, fresh insert). `revalidateEntity('tag')` maps to `[]` today (no-op) but keep the calls for symmetry + future M6 search. Add the call before **each** of the three `return NextResponse.json(... status: 201 ...)` success returns.

Change the first (existing tag):

```ts
    if (existing) {
      return NextResponse.json(
        { success: true, data: mapTag(existing), message: '태그가 생성되었습니다.' },
        { status: 201 },
      )
    }
```

to:

```ts
    if (existing) {
      revalidateEntity('tag')
      return NextResponse.json(
        { success: true, data: mapTag(existing), message: '태그가 생성되었습니다.' },
        { status: 201 },
      )
    }
```

Change the race re-fetch winner:

```ts
      if (again) {
        return NextResponse.json(
          { success: true, data: mapTag(again), message: '태그가 생성되었습니다.' },
          { status: 201 },
        )
      }
```

to:

```ts
      if (again) {
        revalidateEntity('tag')
        return NextResponse.json(
          { success: true, data: mapTag(again), message: '태그가 생성되었습니다.' },
          { status: 201 },
        )
      }
```

Change the fresh-insert return:

```ts
    return NextResponse.json(
      { success: true, data: mapTag(tag), message: '태그가 생성되었습니다.' },
      { status: 201 },
    )
```

to:

```ts
    revalidateEntity('tag')
    return NextResponse.json(
      { success: true, data: mapTag(tag), message: '태그가 생성되었습니다.' },
      { status: 201 },
    )
```

- [ ] **Step 5: Wire `app/api/admin/tags/[id]/route.ts` (DELETE)**

Add after line 4 (`import { mapTag } from '@/lib/dto'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

Change:

```ts
    // project_tags / item_tags / photo_tags links cascade on tag delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('tags').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: '태그가 삭제되었습니다.' })
```

to:

```ts
    // project_tags / item_tags / photo_tags links cascade on tag delete (FK ON DELETE CASCADE).
    const { error } = await supabaseAdmin.from('tags').delete().eq('id', params.id)
    if (error) throw error
    revalidateEntity('tag')
    return NextResponse.json({ success: true, message: '태그가 삭제되었습니다.' })
```

- [ ] **Step 6: Wire `app/api/admin/home-settings/route.ts` (PUT)**

Add after line 4 (`import type { HomeFeaturedItem } from '@/lib/admin-types'`):

```ts
import { revalidateEntity } from '@/lib/revalidation'
```

The PUT mutates both `site_settings.featured_project_id` and the whole `home_featured` list; both affect only `/`. Change:

```ts
    if (rows.length) {
      const { error: fErr } = await supabaseAdmin.from('home_featured').insert(rows)
      if (fErr) throw fErr
    }

    return NextResponse.json({ success: true, message: '홈 설정이 저장되었습니다.' })
```

to:

```ts
    if (rows.length) {
      const { error: fErr } = await supabaseAdmin.from('home_featured').insert(rows)
      if (fErr) throw fErr
    }

    // Both featured_project_id and the home_featured list only affect the home page.
    revalidateEntity('home_featured')

    return NextResponse.json({ success: true, message: '홈 설정이 저장되었습니다.' })
```

- [ ] **Step 7: Typecheck + full suite**

Run: `npx tsc --noEmit && npx vitest run --reporter=dot 2>&1 | tail -3`
Expected: 0 tsc errors; `Tests  72 passed (72)`.

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/photos app/api/admin/categories app/api/admin/tags app/api/admin/home-settings
git commit -m "feat(revalidation): wire photos, categories, tags, home-settings handlers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: Final gate — typecheck, tests, build

**Files:** none (verification only).

- [ ] **Step 1: Confirm every content mutation is wired (self-check)**

Run:
```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
echo "handlers importing revalidateEntity:"; grep -rl "revalidateEntity" app/api/admin | sort
echo "count of revalidateEntity CALL sites:"; grep -rn "revalidateEntity(" app/api/admin | grep -vc "import"
```
Expected: 12 files listed (projects×2, items×2, brands×2, photos, categories×2, tags×2, home-settings); 20 call sites — projects 3, items 3, brands 4 (POST + PUT + DELETE's brand + DELETE's extra `item` refresh), photos 2, categories 3, tags 4 (POST has 3 success returns + DELETE 1), home-settings 1. Confirm auth/, managers/, upload/ do NOT appear.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (0 errors).

- [ ] **Step 3: Full unit suite**

Run: `npx vitest run 2>&1 | tail -4`
Expected: `Test Files  10 passed (10)` / `Tests  72 passed (72)`.

- [ ] **Step 4: Production build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully` and the route table printed, no errors. (`revalidatePath` in a route handler is valid at build time; handlers are dynamic `ƒ` functions.)

- [ ] **Step 5: Final commit (if any build-touched files) + branch summary**

```bash
git add -A
git commit -m "chore(revalidation): M2 gate — tsc, vitest, next build green" --allow-empty
git log --oneline unify/m1-repo-merge..HEAD
```
Expected: 5–6 commits listed for the M2 work.

---

## Self-Review

**1. Spec §4 coverage:**
- "`lib/revalidation.ts`: `revalidateEntity(type, slug?)` 헬퍼" → Task 2. ✓
- Entity→path mapping (project/item/brand/photo/category/site_settings/home_featured) → Task 2 `targetsFor`, with the complete cross-entity mapping derived from `lib/api.ts` (item/brand detail show related projects; project detail shows connected items; brand name on item surfaces; category names everywhere; photo galleries). ✓
- "모든 `/api/admin/*` mutation 핸들러 성공 시 `revalidatePath()` 호출" → Tasks 3–5 wire all 12 content-mutating handler files (20 call sites). ✓
- "`revalidate = 3600`은 백스톱으로 유지" → Global Constraints forbid touching it; no task removes it. ✓
- Node runtime / same app / no secret → handlers already Node; direct call. ✓
- E2E integration verification ("admin 수정 → 사이트 즉시 반영") → explicitly deferred to M3 per the task brief; this plan proves the wiring at unit level (mapping tests + representative handler test). ✓
- Failure semantics (mutation success primary) → `revalidateEntity` never throws (Task 2 try/catch + test); representative handler test asserts 201 when `revalidatePath` throws (Task 3). ✓

**2. Placeholder scan:** No "TBD/TODO/similar to/handle edge cases". Every code step shows full before/after. Cross-entity rationale is inline, not deferred. ✓

**3. Type consistency:** `revalidateEntity(type: RevalidateEntity, slug?: string): void` is used identically at every call site. Slug sources verified per handler: POST uses the local generated `slug`; PUT uses `full?.slug` (all SELECT strings begin with `*`, so `slug` is present on the row); DELETE pre-fetches `existing?.slug` before the row is removed. `photo`/`category`/`tag`/`home_featured` calls pass no slug (correct — no own-detail path or no slug column). ✓

---

## Mutation handlers found (complete enumeration, from `grep -rE "export async function (POST|PUT|DELETE|PATCH)" app/api/admin`)

**Wired (content → public site), 20 call sites across 12 files:**
1. `projects/route.ts` — POST
2. `projects/[id]/route.ts` — PUT, DELETE
3. `items/route.ts` — POST
4. `items/[id]/route.ts` — PUT, DELETE
5. `brands/route.ts` — POST
6. `brands/[id]/route.ts` — PUT (brand), DELETE (brand + extra `item` refresh)
7. `photos/[photo_id]/route.ts` — PUT, DELETE
8. `categories/route.ts` — POST
9. `categories/[id]/route.ts` — PUT, DELETE
10. `tags/route.ts` — POST (3 success returns; no-op mapping today)
11. `tags/[id]/route.ts` — DELETE (no-op mapping today)
12. `home-settings/route.ts` — PUT

**Not wired (no public-site surface — verified), 6 handlers:**
- `auth/login/route.ts` POST, `auth/logout/route.ts` POST, `auth/signup/route.ts` POST — session/cookies only.
- `managers/[id]/route.ts` PUT, DELETE — write only `profiles`; no site read touches `profiles`.
- `upload/route.ts` POST — writes Storage bucket `images` only; the DB photo/join rows are created later via `lib/image-sync.ts` through the projects/items/photos handlers (which revalidate).

Total mutating handlers: 23 methods (POST/PUT/DELETE). Wired: 17 handler methods (20 call sites, since tags POST has 3 success returns and brands DELETE calls twice). Excluded: 6 handler methods.

## Open questions

1. **Brand rename → old slug staleness.** `brands` PUT is the only handler that regenerates a slug. We revalidate the new slug's `/brands/{new}` and rely on the 3600s backstop for `/brands/{old}`. If instant purge of the old URL is required, the PUT would need to fetch the pre-update slug and revalidate both. Left to the backstop per spec §4 — flag for review.
2. **`tag` no-op today.** Tags aren't rendered on the public site (`lib/api.ts` selects no `*_tags`), so `revalidateEntity('tag')` maps to `[]`. The calls are wired for symmetry and will start mattering in M6 (search indexes tag text). Confirm this is the intended stance vs. omitting the tag calls entirely.
3. **Dynamic-pattern aggressiveness.** Cross-entity effects use `revalidatePath('/x/[slug]', 'page')`, which purges all detail pages of a type. On this small dataset (~83 projects, 22 items) with lazy ISR regeneration this is cheap; if the catalog grows large, revisit toward slug-targeted cross-entity revalidation (would require extra lookup queries).
