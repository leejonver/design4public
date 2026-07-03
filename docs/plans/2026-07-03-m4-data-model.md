# Milestone 4: Data-Model Integrity (Project ↔ Photo ↔ Item derived relations) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the project↔item connection from the legacy **direct** model (`project_items`) toward the **derived** model (project → `project_photos` → `photo_items` → item) — adding a read-only audit tool, a CMS per-photo item-tagging UI, a UNION site query (direct ∪ derived, so nothing regresses while content is retagged), and E2E/seed coverage — **without** dropping `project_items` or touching the production DB.

**Architecture:** `photo_items` already exists and is already synced by the photo-edit path. M4 makes the project-edit path *also* write `photo_items` (per-photo item tags) by extending `lib/image-sync.ts` — the existing `photos` payload gains an `itemIds` field that flows unchanged through the already-wired `POST`/`PUT` handlers. The public site's "related items" (project detail) and "related projects" (item detail) queries in `lib/api.ts` switch to a UNION of the direct links and the derived links, deduped by id, via a small reusable `lib/relations.ts`. A standalone `scripts/audit-relations.mjs` (read-only, `pg` over `DATABASE_URL`) reports direct-vs-derived coverage and orphan/integrity checks. Seed gains derived rows; Playwright gains admin + site + integration coverage.

**Tech Stack:** Next.js 14.2.32 (App Router), `@supabase/supabase-js` (site reads via anon client, admin writes via service-role `supabaseAdmin`), `@vapor-ui/core` (admin UI), `pg` 8 (audit script), Vitest 3, Playwright 1.55, Supabase CLI local stack (Docker).

## Global Constraints

- **Production DB is untouchable — NO migration in M4.** `photo_items`, `project_items`, `project_photos` tables all already exist (M3 baseline). M4 adds **zero** SQL migrations. The only DB writes are through the existing admin API (service-role) and additive seed rows for the local E2E stack. `project_items` is **kept** (not dropped) — the DROP is a later, separate destructive round (spec §7-1 stage 3).
- **Transition safety = UNION, never replace.** Site related-entity queries return `direct ∪ derived` deduped by id. A project/item that is only directly linked (not yet retagged) must keep showing exactly as before; a project/item that is only derived-linked must start showing. No visible regression at any retagging progress level (spec §7-1 stage 2).
- **Audit is read-only.** `scripts/audit-relations.mjs` issues only `SELECT`s, works against any `DATABASE_URL` (local stack or, read-only, production), and NEVER writes. It skips SSL verification only for non-loopback hosts.
- **Branch:** all work on `unify/m4-data-model`, branched from `unify/m3-e2e-harness`. Frequent commits per task.
- **Local Supabase endpoints (fixed CLI defaults, from M3):** API `http://127.0.0.1:54321`, DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Seed is additive-only (extends `supabase/seed.sql`; truncate+insert is idempotent).
- **Revalidation entity mapping (M2) is reused unchanged.** A project mutation already revalidates the project detail, the item-detail pattern (`/items/[slug]`), the projects/photos lists, and the sitemap (see `lib/revalidation.ts` `targetsFor('project')`). Because per-photo item tags are saved through the project `PUT`, tagging an item on a project photo already purges the affected item + project + photos-list caches — **no revalidation code change is required in M4**; a task verifies this end to end. (The M5 photo-detail page does not exist yet, so no photo-detail revalidation is in scope.)
- **`PhotoUploader` is shared** by project *and* item edit/new pages (`app/admin/{projects,items}/{new,[id]/edit}`). Per-photo item tagging must be **opt-in** via a new prop so item pages are unaffected.
- **Verification commands:** typecheck `npx tsc --noEmit` (expect 0 errors); unit `npx vitest run` (expect all green); e2e `npx playwright test` against the local stack (`supabase start` + seeded). No `typecheck` npm script exists — call `tsc` directly.

---

## File Structure

All paths relative to `design4public-frontend/`.

| Path | Responsibility | Action |
|---|---|---|
| `lib/relations.ts` | Reusable `dedupeById` / `unionById` helpers for the direct∪derived union (site queries + tests; kept reusable for M6 search body). | Create |
| `scripts/audit-relations.mjs` | Read-only direct-vs-derived audit + orphan/integrity checks over `DATABASE_URL`; exports pure diff helpers for unit tests. | Create |
| `lib/admin-types.ts` | `ImageData` gains `itemIds?: string[]`. | Modify |
| `lib/dto.ts` | `PROJECT_SELECT` nests `photo_items(items(id))` under project photos; `mapImagesFromPhotos` populates `itemIds`. | Modify |
| `lib/image-sync.ts` | `PhotoRef`/`ImageInput` gain `itemIds`; `resolvePhotoIds` carries it; `syncProjectPhotos` (re)writes `photo_items` per project photo. | Modify |
| `lib/api.ts` | `fetchProjectBySlug` related-items and `fetchItemBySlug` related-projects switch to `direct ∪ derived`. | Modify |
| `components/admin/ui/PhotoUploader.tsx` | New opt-in `itemTagging` prop renders a per-photo item `EntityPicker`. | Modify |
| `app/admin/projects/[project_id]/edit/page.tsx` | Enable `itemTagging`; send `itemIds` in the photos payload; demote "연결 아이템" to read-only "레거시 연결" + retag badge. | Modify |
| `app/admin/projects/new/page.tsx` | Enable `itemTagging`; send `itemIds`; drop the direct item picker. | Modify |
| `supabase/seed.sql` | Additive derived-model row: a project photo tagged with an item. | Modify |
| `tests/unit/lib/relations.test.ts` | Unit tests for `dedupeById` / `unionById`. | Create |
| `tests/unit/lib/audit-relations.test.ts` | Unit tests for `missingDerived` / `perProjectProgress` / `pairKey`. | Create |
| `tests/unit/admin/lib/dto.test.ts` | Extend: assert `mapImagesFromPhotos` populates `itemIds`. | Modify |
| `tests/e2e/site/project-detail.spec.ts` | Add: derived-only related item appears on a project with no direct links. | Modify |
| `tests/e2e/site/item-detail.spec.ts` | Add: item detail shows direct + derived "도입 프로젝트". | Create |
| `tests/e2e/admin/project-item-tagging.spec.ts` | Tag an item on a project photo → derived relation appears (via API + site). | Create |
| `tests/e2e/integration/derived-relations.spec.ts` | Tag → site reflects immediately (revalidation over the derived path). | Create |

---

## Task 1: Branch + `lib/relations.ts` union helpers

**Files:**
- Create: `lib/relations.ts`
- Test: `tests/unit/lib/relations.test.ts`

**Interfaces:**
- Produces: `dedupeById<T extends { id: string }>(rows: T[]): T[]` and `unionById<T extends { id: string }>(direct: T[], derived: T[]): T[]`. Consumed by Task 5 (`lib/api.ts`).

- [ ] **Step 1: Branch from M3**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git checkout unify/m3-e2e-harness
git checkout -b unify/m4-data-model
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/lib/relations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { dedupeById, unionById } from '@/lib/relations'

describe('dedupeById', () => {
  it('keeps first occurrence and drops later duplicates by id', () => {
    const rows = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'a', n: 3 }]
    expect(dedupeById(rows)).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 2 }])
  })

  it('ignores rows with a falsy id', () => {
    expect(dedupeById([{ id: '', n: 1 }, { id: 'a', n: 2 }])).toEqual([{ id: 'a', n: 2 }])
  })
})

describe('unionById', () => {
  it('lists direct rows first, then derived-only rows, deduped', () => {
    const direct = [{ id: 'a' }, { id: 'b' }]
    const derived = [{ id: 'b' }, { id: 'c' }]
    expect(unionById(direct, derived).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns direct unchanged when derived is empty (no regression)', () => {
    const direct = [{ id: 'a' }, { id: 'b' }]
    expect(unionById(direct, [])).toEqual(direct)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/relations.test.ts`
Expected: FAIL — `Cannot find module '@/lib/relations'`.

- [ ] **Step 4: Write the implementation**

Create `lib/relations.ts`:

```ts
// Union helpers for the project↔item transition (spec §7-1 stage 2).
// Related entities are the UNION of the legacy DIRECT links (project_items)
// and the DERIVED links (project → project_photos → photo_items → item),
// deduped by id. Direct rows are listed first (stable, preferred order);
// derived-only rows follow. Kept dependency-free so M6 search can reuse it.

export function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    if (r.id && !seen.has(r.id)) {
      seen.add(r.id)
      out.push(r)
    }
  }
  return out
}

export function unionById<T extends { id: string }>(direct: T[], derived: T[]): T[] {
  return dedupeById([...direct, ...derived])
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/relations.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/relations.ts tests/unit/lib/relations.test.ts
git commit -m "feat(m4): add dedupeById/unionById relation union helpers"
```

---

## Task 2: `scripts/audit-relations.mjs` (read-only audit + pure helpers)

**Files:**
- Create: `scripts/audit-relations.mjs`
- Test: `tests/unit/lib/audit-relations.test.ts`

**Interfaces:**
- Produces (pure, exported for tests): `pairKey(p: { project_id: string; item_id: string }): string`, `missingDerived(direct, derived): Pair[]`, `perProjectProgress(direct, derived): { project_id, total, covered, missing }[]`.
- CLI: `DATABASE_URL=... node scripts/audit-relations.mjs` prints a report; connects only when run directly.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/audit-relations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pairKey, missingDerived, perProjectProgress } from '../../../scripts/audit-relations.mjs'

const P = (project_id: string, item_id: string) => ({ project_id, item_id })

describe('pairKey', () => {
  it('joins project and item ids stably', () => {
    expect(pairKey(P('p1', 'i1'))).toBe('p1::i1')
  })
})

describe('missingDerived', () => {
  it('returns direct pairs with no derived counterpart', () => {
    const direct = [P('p1', 'i1'), P('p1', 'i2')]
    const derived = [P('p1', 'i1')]
    expect(missingDerived(direct, derived)).toEqual([P('p1', 'i2')])
  })

  it('returns [] when direct ⊆ derived (fully migrated)', () => {
    const direct = [P('p1', 'i1')]
    const derived = [P('p1', 'i1'), P('p2', 'i9')]
    expect(missingDerived(direct, derived)).toEqual([])
  })
})

describe('perProjectProgress', () => {
  it('counts covered vs missing direct pairs per project', () => {
    const direct = [P('p1', 'i1'), P('p1', 'i2'), P('p2', 'i3')]
    const derived = [P('p1', 'i1')]
    const rows = perProjectProgress(direct, derived).sort((a, b) => a.project_id.localeCompare(b.project_id))
    expect(rows).toEqual([
      { project_id: 'p1', total: 2, covered: 1, missing: 1 },
      { project_id: 'p2', total: 1, covered: 0, missing: 1 },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/audit-relations.test.ts`
Expected: FAIL — `Cannot find module '../../../scripts/audit-relations.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/audit-relations.mjs`:

```js
// Read-only relations audit: compares the legacy DIRECT project↔item model
// (project_items) against the DERIVED model (project → project_photos →
// photo_items → item), reports per-project retagging progress, and flags
// orphan/integrity issues. Works against any Postgres URL via DATABASE_URL
// (local E2E stack or, read-only, production). NEVER writes.
//
// Usage:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
//     node scripts/audit-relations.mjs
//   (falls back to DATABASE_URL in .env.local when the env var is unset)
import { readFileSync } from 'node:fs'
import pg from 'pg'

export function pairKey(p) {
  return `${p.project_id}::${p.item_id}`
}

/** Direct pairs that have no derived counterpart (still need retagging). */
export function missingDerived(direct, derived) {
  const derivedKeys = new Set(derived.map(pairKey))
  return direct.filter((p) => !derivedKeys.has(pairKey(p)))
}

/** Per-project { total, covered, missing } counts of direct pairs vs derived. */
export function perProjectProgress(direct, derived) {
  const derivedKeys = new Set(derived.map(pairKey))
  const byProject = new Map()
  for (const p of direct) {
    const row = byProject.get(p.project_id) ?? { project_id: p.project_id, total: 0, covered: 0, missing: 0 }
    row.total += 1
    if (derivedKeys.has(pairKey(p))) row.covered += 1
    else row.missing += 1
    byProject.set(p.project_id, row)
  }
  return [...byProject.values()]
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith('DATABASE_URL='))
      ?.slice('DATABASE_URL='.length)
      .replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

async function main() {
  const url = resolveDatabaseUrl()
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
  const client = new pg.Client({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  await client.connect()
  try {
    const direct = (await client.query('select project_id, item_id from project_items')).rows
    const derived = (
      await client.query(
        'select distinct pp.project_id, pi.item_id from project_photos pp join photo_items pi on pi.photo_id = pp.photo_id',
      )
    ).rows

    const missing = missingDerived(direct, derived)
    const progress = perProjectProgress(direct, derived).sort((a, b) => b.missing - a.missing)

    const orphanPhotos = (
      await client.query(
        `select count(*)::int n from photos p
           where not exists (select 1 from project_photos pp where pp.photo_id = p.id)
             and not exists (select 1 from photo_items pi where pi.photo_id = p.id)`,
      )
    ).rows[0].n
    const brandlessItems = (
      await client.query('select count(*)::int n from items where brand_id is null')
    ).rows[0].n
    const publishedNoMain = (
      await client.query(
        `select count(*)::int n from projects pr
           where pr.status = 'published'
             and not exists (select 1 from project_photos pp where pp.project_id = pr.id and pp.is_main)`,
      )
    ).rows[0].n

    console.log('=== project↔item relation audit ===')
    console.log(`direct pairs (project_items):      ${direct.length}`)
    console.log(`derived pairs (photo→item):        ${derived.length}`)
    console.log(`direct WITHOUT derived (retag):    ${missing.length}`)
    console.log(`fully migrated (direct ⊆ derived): ${missing.length === 0 ? 'YES' : 'NO'}`)
    console.log('\n--- per-project retagging progress (worst first) ---')
    for (const r of progress) {
      console.log(`  ${r.project_id}  ${r.covered}/${r.total} covered  (${r.missing} to retag)`)
    }
    console.log('\n--- integrity checks ---')
    console.log(`orphan photos (no project & no item):     ${orphanPhotos}`)
    console.log(`items without a brand:                    ${brandlessItems}`)
    console.log(`published projects without a main photo:  ${publishedNoMain}`)
  } finally {
    await client.end()
  }
}

// Only hit the DB when run directly, so tests can import the pure helpers.
if (process.argv[1] && process.argv[1].endsWith('audit-relations.mjs')) {
  main().catch((e) => {
    console.error(e)
    process.exit(2)
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/audit-relations.test.ts`
Expected: PASS (4 tests). Importing the `.mjs` does NOT open a DB connection (guarded by the `process.argv[1]` check).

- [ ] **Step 5: Commit**

```bash
git add scripts/audit-relations.mjs tests/unit/lib/audit-relations.test.ts
git commit -m "feat(m4): add read-only relations audit script + pure diff helpers"
```

---

## Task 3: Expose per-photo item tags in the project DTO (`ImageData.itemIds`)

**Files:**
- Modify: `lib/admin-types.ts` (add `itemIds` to `ImageData`)
- Modify: `lib/dto.ts` (`PROJECT_SELECT` nested embed + `mapImagesFromPhotos`)
- Test: `tests/unit/admin/lib/dto.test.ts` (extend)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ImageData.itemIds?: string[]` — the ids of items tagged on that photo. Populated by `mapImagesFromPhotos` for project photos (via `PROJECT_SELECT`). Consumed by Task 4/6/7 (the project edit UI pre-populates the per-photo picker).

- [ ] **Step 1: Extend the failing test**

In `tests/unit/admin/lib/dto.test.ts`, add `photo_items` to one project photo fixture and assert `itemIds`. Change the `projectRow.project_photos` block to:

```ts
  project_photos: [
    { is_main: false, order: 1, photos: { id: 'pp2', image_url: 'pp2.jpg', alt_text: 'a' } },
    {
      is_main: true,
      order: 9,
      photos: {
        id: 'pp1',
        image_url: 'pp1.jpg',
        alt_text: 'b',
        photo_items: [{ items: { id: 'tagged-item-1' } }, { items: null }],
      },
    },
  ],
```

Then add a test inside `describe('mapProject', ...)`:

```ts
  it('maps per-photo item tags to images[].itemIds, dropping null items', () => {
    const project = mapProject(projectRow)
    const main = project.images.find((i) => i.id === 'pp1')
    expect(main?.itemIds).toEqual(['tagged-item-1'])
    const other = project.images.find((i) => i.id === 'pp2')
    expect(other?.itemIds).toBeUndefined()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/admin/lib/dto.test.ts`
Expected: FAIL — `main.itemIds` is `undefined` (mapper does not yet read `photo_items`).

- [ ] **Step 3: Add `itemIds` to `ImageData`**

In `lib/admin-types.ts`, in the `ImageData` interface, add after `order?`:

```ts
  order?: number; // 표시 순서 (0-기반)
  itemIds?: string[]; // 이 사진에 태깅된 아이템 id (프로젝트→사진→아이템 파생 모델)
```

- [ ] **Step 4: Nest `photo_items` in `PROJECT_SELECT` and populate `itemIds`**

In `lib/dto.ts`, change `PROJECT_SELECT` so project photos carry their item tags:

```ts
export const PROJECT_SELECT =
  '*, project_categories(categories(*)), project_tags(tags(*)), project_items(items(*, brands(*))), project_photos(is_main, order, photos(*, photo_items(items(id))))'
```

Then in `mapImagesFromPhotos`, add `itemIds` to the mapped object. Replace the `.map((j, i) => ({ ... }))` body with:

```ts
    .map((j, i) => {
      const itemIds = (j.photos.photo_items ?? [])
        .map((pi: Row) => pi.items?.id)
        .filter((id: unknown): id is string => Boolean(id))
      return {
        id: j.photos.id,
        url: j.photos.image_url,
        alt: j.photos.alt_text ?? '',
        isMain: !!j.is_main,
        title: j.photos.title ?? undefined,
        order: j.order ?? i,
        itemIds: itemIds.length ? itemIds : undefined,
      }
    })
```

(`ITEM_SELECT` does not nest `photo_items` under item photos, so item images get `itemIds: undefined` — correct; per-photo item tagging is a project-only concern.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/admin/lib/dto.test.ts`
Expected: PASS (existing tests + the new one).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add lib/admin-types.ts lib/dto.ts tests/unit/admin/lib/dto.test.ts
git commit -m "feat(m4): expose per-photo item tags as ImageData.itemIds in project DTO"
```

---

## Task 4: Persist per-photo item tags on project save (`lib/image-sync.ts`)

**Files:**
- Modify: `lib/image-sync.ts`

**Interfaces:**
- Consumes: `syncPhotoItems(photoId, itemIds)` (already exists in this module).
- Produces: `PhotoRef` / `ImageInput` accept an optional `itemIds?: string[]`; `syncProjectPhotos` (re)writes `photo_items` for each project photo whose ref carries an explicit `itemIds`. The `POST`/`PUT` project handlers already call `syncProjectPhotos(id, photos)` with the raw body array — **no handler change is needed**; the `itemIds` field flows through untouched.

- [ ] **Step 1: Extend `ImageInput` and `PhotoRef`**

In `lib/image-sync.ts`, update the input types:

```ts
export interface ImageInput {
  url: string
  alt?: string | null
  title?: string | null
  isMain?: boolean
  itemIds?: string[]
}

/** Accepts uploaded image descriptors (or bare URL strings) or existing photo ids. */
export type PhotoRef = string | ImageInput | { photoId: string; isMain?: boolean; itemIds?: string[] }
```

- [ ] **Step 2: Carry `itemIds` through `resolvePhotoIds`**

Replace the `resolvePhotoIds` signature and body up to the main-enforcement loop:

```ts
async function resolvePhotoIds(
  refs: PhotoRef[],
): Promise<{ photoId: string; isMain: boolean; itemIds?: string[] }[]> {
  const out: { photoId: string; isMain: boolean; itemIds?: string[] }[] = []
  for (let i = 0; i < refs.length; i += 1) {
    const ref = refs[i]
    if (typeof ref === 'string') {
      out.push({ photoId: await ensurePhotoId(ref), isMain: i === 0 })
    } else if ('photoId' in ref) {
      out.push({ photoId: ref.photoId, isMain: ref.isMain ?? i === 0, itemIds: ref.itemIds })
    } else {
      out.push({
        photoId: await ensurePhotoId(ref.url, ref.alt, ref.title),
        isMain: ref.isMain ?? i === 0,
        itemIds: ref.itemIds,
      })
    }
  }
  // enforce a single main
  let mainSeen = false
  for (const r of out) {
    if (r.isMain && !mainSeen) mainSeen = true
    else r.isMain = false
  }
  if (!mainSeen && out.length) out[0].isMain = true
  return out
}
```

- [ ] **Step 3: (Re)write `photo_items` in `syncProjectPhotos`**

Replace the body of `syncProjectPhotos` after the `upsert` with the item-tag sync loop:

```ts
export async function syncProjectPhotos(projectId: string, refs: PhotoRef[]): Promise<void> {
  await supabaseAdmin.from('project_photos').delete().eq('project_id', projectId)
  const resolved = await resolvePhotoIds(refs ?? [])
  if (!resolved.length) return
  const rows = resolved.map((r, i) => ({
    project_id: projectId,
    photo_id: r.photoId,
    is_main: r.isMain,
    order: i,
  }))
  const { error } = await supabaseAdmin
    .from('project_photos')
    .upsert(rows, { onConflict: 'project_id,photo_id' })
  if (error) throw error

  // Derived project↔item model (spec §7-1): persist per-photo item tags.
  // Only photos whose ref carried an explicit itemIds array are (re)synced —
  // legacy callers omit the field, leaving existing photo_items untouched.
  for (const r of resolved) {
    if (r.itemIds !== undefined) await syncPhotoItems(r.photoId, r.itemIds)
  }
}
```

(`syncPhotoItems` is defined later in the same file — a function declaration, hoisted, so the forward reference is fine.)

- [ ] **Step 4: Typecheck + run existing API unit tests (regression guard)**

Run: `npx tsc --noEmit && npx vitest run tests/unit/admin/api/projects.test.ts tests/unit/admin/api/projects-revalidation.test.ts`
Expected: 0 tsc errors; all project API tests still green (they mock `@/lib/image-sync`, so behavior is unchanged for them).

- [ ] **Step 5: Commit**

```bash
git add lib/image-sync.ts
git commit -m "feat(m4): sync photo_items per project photo on project save (derived model)"
```

---

## Task 5: `PhotoUploader` opt-in per-photo item tagging

**Files:**
- Modify: `components/admin/ui/PhotoUploader.tsx`

**Interfaces:**
- Consumes: `EntityPicker` (kind `'item'`, `value`/`onChange` over id arrays — existing component), `ImageData.itemIds` (Task 3).
- Produces: `PhotoUploader` accepts `itemTagging?: boolean`; when true, each photo row renders an item `EntityPicker` bound to `photo.itemIds`. Default (false) leaves the item pages unchanged.

- [ ] **Step 1: Add the import and prop**

In `components/admin/ui/PhotoUploader.tsx`, add `EntityPicker` to the local imports (below the existing `import type { ImageData }`):

```ts
import EntityPicker from './EntityPicker';
```

Extend the props interface:

```ts
export interface PhotoUploaderProps {
  value: ImageData[];
  onChange: (photos: ImageData[]) => void;
  folder: string;
  max?: number;
  itemTagging?: boolean; // 프로젝트 전용: 사진별 아이템 태깅 (project→photo→item 파생 모델)
}
```

Update the destructure:

```ts
export default function PhotoUploader({ value, onChange, folder, max, itemTagging }: PhotoUploaderProps) {
```

- [ ] **Step 2: Add the per-photo update handler**

After the existing `updateTitle` function, add:

```ts
  const updateItemIds = (index: number, itemIds: string[]) => {
    onChange(normalize(value.map((p, i) => (i === index ? { ...p, itemIds } : p))));
  };
```

(`normalize` spreads `...p`, so `itemIds` survives re-normalization.)

- [ ] **Step 3: Restructure the photo row to host the picker**

Replace the per-photo row element. The current row is:

```tsx
            <div
              key={photo.id}
              data-testid="uploaded-photo"
              className="flex items-center gap-3 rounded-md border border-gray-200 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt}
                className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              />

              <TextInput
                className="flex-1"
                placeholder="사진 제목 (선택)"
                value={photo.title ?? ''}
                onValueChange={(v) => updateTitle(index, v)}
              />

              <label className="flex cursor-pointer select-none items-center gap-1.5">
                <Checkbox.Root
                  checked={!!photo.isMain}
                  onCheckedChange={(checked) => {
                    if (checked) setMain(index);
                  }}
                  aria-label="대표 사진으로 설정"
                />
                <Text typography="body3" className="text-gray-600">
                  대표
                </Text>
              </label>

              <div className="flex flex-shrink-0 items-center gap-1">
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="secondary"
                  aria-label="위로 이동"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUpOutlineIcon size={16} />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="secondary"
                  aria-label="아래로 이동"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDownOutlineIcon size={16} />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="danger"
                  aria-label="사진 삭제"
                  onClick={() => remove(index)}
                >
                  <TrashOutlineIcon size={16} />
                </IconButton>
              </div>
            </div>
```

Replace it with (wrap the existing controls in an inner flex row, add the picker block below when `itemTagging`):

```tsx
            <div
              key={photo.id}
              data-testid="uploaded-photo"
              className="rounded-md border border-gray-200 p-2"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                />

                <TextInput
                  className="flex-1"
                  placeholder="사진 제목 (선택)"
                  value={photo.title ?? ''}
                  onValueChange={(v) => updateTitle(index, v)}
                />

                <label className="flex cursor-pointer select-none items-center gap-1.5">
                  <Checkbox.Root
                    checked={!!photo.isMain}
                    onCheckedChange={(checked) => {
                      if (checked) setMain(index);
                    }}
                    aria-label="대표 사진으로 설정"
                  />
                  <Text typography="body3" className="text-gray-600">
                    대표
                  </Text>
                </label>

                <div className="flex flex-shrink-0 items-center gap-1">
                  <IconButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    colorPalette="secondary"
                    aria-label="위로 이동"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUpOutlineIcon size={16} />
                  </IconButton>
                  <IconButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    colorPalette="secondary"
                    aria-label="아래로 이동"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDownOutlineIcon size={16} />
                  </IconButton>
                  <IconButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    colorPalette="danger"
                    aria-label="사진 삭제"
                    onClick={() => remove(index)}
                  >
                    <TrashOutlineIcon size={16} />
                  </IconButton>
                </div>
              </div>

              {itemTagging ? (
                <div className="mt-2 border-t border-gray-100 pt-2" data-testid="photo-item-tagging">
                  <Text typography="body3" className="mb-1 text-gray-500">
                    이 사진에 사용된 아이템
                  </Text>
                  <EntityPicker
                    kind="item"
                    value={photo.itemIds ?? []}
                    onChange={(ids) => updateItemIds(index, ids)}
                  />
                </div>
              ) : null}
            </div>
```

- [ ] **Step 4: Typecheck + build (no unit test — exercised by E2E in Task 8)**

Run: `npx tsc --noEmit`
Expected: 0 errors.

Note the tradeoff (leave as-is): each per-photo `EntityPicker` fetches `/items` on mount, so N project photos issue N identical list fetches. Acceptable for the admin-only, low-cardinality CMS; do not add caching in M4.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ui/PhotoUploader.tsx
git commit -m "feat(m4): add opt-in per-photo item tagging to PhotoUploader"
```

---

## Task 6: Wire the project **edit** page (enable tagging + demote direct links to read-only legacy)

**Files:**
- Modify: `app/admin/projects/[project_id]/edit/page.tsx`

**Interfaces:**
- Consumes: `PhotoUploader` `itemTagging` prop (Task 5), `ImageData.itemIds` (Task 3).
- Produces: the edit form sends `photos[].itemIds` on save (round-trips existing tags, adds new ones) and displays the legacy `project_items` links read-only with a "재태깅 필요" badge for any direct item not yet present on a photo.

- [ ] **Step 1: Track legacy item names + compute derived coverage**

The page currently stores only `connectedItems: string[]` (ids). We keep sending those ids unchanged (union safety — `project_items` is preserved) but need names + a retag badge. Add a state for the legacy items’ display metadata. After the existing `const [connectedItems, setConnectedItems] = useState<string[]>([]);` line, add:

```tsx
  const [legacyItems, setLegacyItems] = useState<{ id: string; name: string }[]>([]);
```

In the `fetchData` effect, alongside `setConnectedItems(...)`, capture names too. Replace:

```tsx
          setConnectedItems(proj.connectedItems?.map((i) => i.id) || []);
```

with:

```tsx
          setConnectedItems(proj.connectedItems?.map((i) => i.id) || []);
          setLegacyItems(proj.connectedItems?.map((i) => ({ id: i.id, name: i.name })) || []);
```

- [ ] **Step 2: Send `itemIds` in the save payload**

In `handleSubmit`, change the `photos` mapping in `body` to include `itemIds` (default `[]` so a save always writes the photo's current tags — an idempotent round-trip):

```tsx
        photos: photos.map((p, index) => ({
          url: p.url,
          title: p.title,
          isMain: p.isMain,
          order: index,
          itemIds: p.itemIds ?? [],
        })),
```

- [ ] **Step 3: Enable `itemTagging` on the project photo uploader**

In the "프로젝트 사진" card, change:

```tsx
              <PhotoUploader folder="projects" value={photos} onChange={setPhotos} />
```

to:

```tsx
              <PhotoUploader folder="projects" value={photos} onChange={setPhotos} itemTagging />
```

- [ ] **Step 4: Replace the editable "연결 아이템" card with read-only "레거시 연결"**

Compute the derived coverage set from the photos in render scope. Immediately before the `return (` of the component, add:

```tsx
  const derivedItemIds = new Set(photos.flatMap((p) => p.itemIds ?? []));
```

Then replace the whole "연결 아이템" card:

```tsx
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                연결 아이템
              </Text>
            </Card.Header>
            <Card.Body>
              <EntityPicker kind="item" value={connectedItems} onChange={setConnectedItems} />
            </Card.Body>
          </Card.Root>
```

with a read-only legacy display:

```tsx
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                레거시 연결 (아이템)
              </Text>
              <Text typography="body3" render={<p />} className="mt-2 text-gray-500">
                직접 연결은 읽기 전용입니다. 아이템 연결은 위 “프로젝트 사진”에서 사진별로 태깅하세요.
              </Text>
            </Card.Header>
            <Card.Body>
              {legacyItems.length === 0 ? (
                <p className="text-sm text-gray-400">레거시 직접 연결이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2" data-testid="legacy-items">
                  {legacyItems.map((it) => {
                    const needsRetag = !derivedItemIds.has(it.id);
                    return (
                      <span
                        key={it.id}
                        className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700"
                      >
                        {it.name}
                        {needsRetag ? (
                          <span
                            data-testid="retag-badge"
                            className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700"
                          >
                            재태깅 필요
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card.Root>
```

- [ ] **Step 5: Remove the now-unused `setConnectedItems` writes / keep the value passthrough**

`connectedItems` is still sent in `body` (unchanged, preserving `project_items`). It is no longer mutated by UI, so `setConnectedItems` is only called in the effect — that is fine and keeps the array populated. `EntityPicker` is no longer referenced on this page; remove it from the import if it is otherwise unused. Check the import line:

```tsx
import { CategorySelect, EntityPicker, FreeTagSelect, PageHeader, PhotoUploader } from '@/components/admin/ui';
```

Since `EntityPicker` is now unused on the edit page, drop it:

```tsx
import { CategorySelect, FreeTagSelect, PageHeader, PhotoUploader } from '@/components/admin/ui';
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors (no unused-import or unused-symbol errors).

- [ ] **Step 7: Commit**

```bash
git add "app/admin/projects/[project_id]/edit/page.tsx"
git commit -m "feat(m4): project edit — per-photo item tagging + read-only legacy links with retag badge"
```

---

## Task 7: Wire the project **new** page (per-photo tagging, drop direct picker)

**Files:**
- Modify: `app/admin/projects/new/page.tsx`

**Interfaces:**
- Consumes: `PhotoUploader` `itemTagging` (Task 5).
- Produces: new projects tag items on photos (derived model); the direct-item picker is removed. `connectedItems` is no longer sent (POST calls `syncProjectItems(id, connectedItems ?? [])`, so omitting it leaves `project_items` empty — correct for the target model).

- [ ] **Step 1: Remove the `connectedItems` state**

Delete the line:

```tsx
  const [connectedItems, setConnectedItems] = useState<string[]>([]);
```

- [ ] **Step 2: Drop `connectedItems` from the save payload and add `itemIds`**

In `handleSubmit`'s `body`, remove the `connectedItems,` line and update the `photos` mapping:

```tsx
        status,
        categories,
        tags,
        photos: photos.map((p, index) => ({
          url: p.url,
          title: p.title,
          isMain: p.isMain,
          order: index,
          itemIds: p.itemIds ?? [],
        })),
        inquiryUrl: inquiryUrl.trim(),
```

- [ ] **Step 3: Enable `itemTagging`; remove the "연결 아이템" card**

Change the uploader:

```tsx
              <PhotoUploader folder="projects" value={photos} onChange={setPhotos} itemTagging />
```

Delete the entire "연결 아이템" `Card.Root` block (the one containing `<EntityPicker kind="item" value={connectedItems} onChange={setConnectedItems} />`).

- [ ] **Step 4: Drop the now-unused `EntityPicker` import**

Change:

```tsx
import { CategorySelect, EntityPicker, FreeTagSelect, PageHeader, PhotoUploader } from '@/components/admin/ui';
```

to:

```tsx
import { CategorySelect, FreeTagSelect, PageHeader, PhotoUploader } from '@/components/admin/ui';
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/projects/new/page.tsx
git commit -m "feat(m4): project new — per-photo item tagging, drop direct item picker"
```

---

## Task 8: Site UNION queries — related items (project) + related projects (item)

**Files:**
- Modify: `lib/api.ts`

**Interfaces:**
- Consumes: `unionById` (Task 1).
- Produces: `fetchProjectBySlug(...).items` = `direct(project_items) ∪ derived(project_photos→photo_items→item)`; `fetchItemBySlug(...).projects` = `direct(project_items) ∪ derived(photo_items→project_photos→project)`, published-only, deduped. Return types (`ProjectDetail.items`, `ItemDetail.projects`) are unchanged.

- [ ] **Step 1: Import the union helper**

At the top of `lib/api.ts`, after the `import { supabase } ...` line, add:

```ts
import { unionById } from "./relations";
```

- [ ] **Step 2: Add a detail select that nests derived items under project photos**

After the existing `ITEM_SUMMARY_SELECT` constant, add:

```ts
/* Project detail select: like the summary, but project photos also carry the
   items tagged on them (derived project→photo→item model). galleryFrom/coverFrom
   ignore the extra nested photo_items. */
const PROJECT_DETAIL_SELECT = `
  id,slug,title,description,year,area,location,client,inquiry_url,status,updated_at,
  project_photos(is_main,order,photos(id,image_url,alt_text,title,photo_items(items(${ITEM_SUMMARY_SELECT})))),
  project_categories(categories(id,name))
`;
```

- [ ] **Step 3: Rewrite `fetchProjectBySlug` to union direct + derived items**

Replace the whole `fetchProjectBySlug` function body:

```ts
export async function fetchProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  slug = safeDecodeSlug(slug);
  const { data, error } = await supabase
    .from("projects")
    .select(
      `${PROJECT_DETAIL_SELECT},
       project_items(items(${ITEM_SUMMARY_SELECT}))`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const summary = normalizeProjectSummary(data);

  // Direct links (legacy project_items) ∪ derived links (this project's photos'
  // tagged items). Union keeps direct first, dedupes by id — no regression while
  // content is being retagged (spec §7-1 stage 2).
  const direct: ItemSummary[] = ((data as Raw).project_items ?? [])
    .map((pi: Raw) => pi.items)
    .filter(Boolean)
    .map(normalizeItemSummary);
  const derived: ItemSummary[] = ((data as Raw).project_photos ?? [])
    .flatMap((pp: Raw) => pp.photos?.photo_items ?? [])
    .map((pi: Raw) => pi.items)
    .filter(Boolean)
    .map(normalizeItemSummary);
  const items = unionById(direct, derived);

  return { ...summary, gallery: galleryFrom((data as Raw).project_photos), items };
}
```

- [ ] **Step 4: Rewrite `fetchItemBySlug` to union direct + derived projects**

In `fetchItemBySlug`, change the `.select(...)` string so the item's photos also carry their projects, then union. Replace the `photo_items(...)` embed line and the `project_items(...)` line in the select with:

```ts
      `id,slug,name,description,nara_url,status,brand_id,
       brands(id,slug,name_ko,name_en,description,logo_image_url,cover_image_url,website_url),
       photo_items(is_main,order,photos(id,image_url,alt_text,title,project_photos(projects(${PROJECT_SUMMARY_SELECT})))),
       item_categories(categories(id,name)),
       project_items(projects(${PROJECT_SUMMARY_SELECT}))`
```

Then replace the `const projects = ...` block at the end of the function:

```ts
  const directProjects: ProjectSummary[] = ((data as Raw).project_items ?? [])
    .map((pi: Raw) => pi.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const derivedProjects: ProjectSummary[] = ((data as Raw).photo_items ?? [])
    .flatMap((pi: Raw) => pi.photos?.project_photos ?? [])
    .map((pp: Raw) => pp.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const projects = unionById(directProjects, derivedProjects);

  return { ...summary, gallery, brand, projects };
```

(The `gallery` mapping above it is unchanged — it reads `r.photos.image_url` and ignores the extra nested `project_photos`.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add lib/api.ts
git commit -m "feat(m4): site related-items/related-projects = direct ∪ derived (transition-safe)"
```

---

## Task 9: Additive derived-model seed rows

**Files:**
- Modify: `supabase/seed.sql`

**Interfaces:**
- Consumes: existing seed ids (photos `55555555-...004`, item `44444444-...001`).
- Produces: a derived project↔item pair with **no** direct counterpart — project `pangyo-library` (`66666666-...002`, zero `project_items`) has its main photo `office…library-1` (`55555555-...004`) tagged with the aeron item (`44444444-...001`). This makes: (a) pangyo detail show a *derived-only* related item; (b) aeron detail show pangyo as a *derived-only* related project (aeron is directly linked only to gangnam).

- [ ] **Step 1: Add the derived photo_items row**

In `supabase/seed.sql`, replace the existing "Photo ↔ item links" block:

```sql
-- Photo ↔ item links (item galleries) -----------------------------------
insert into public.photo_items (photo_id, item_id, is_main, "order") values
  ('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', true, 0),
  ('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000002', true, 0);
```

with (adds one derived row; existing rows unchanged):

```sql
-- Photo ↔ item links -----------------------------------------------------
--  * rows 1-2: item-gallery usage (photo not in any project_photos)
--  * row 3: DERIVED model — a project photo (pangyo library main photo, id …004,
--    in project_photos for project …002 which has NO direct project_items) tagged
--    with the aeron item. Exercises the direct∪derived union on both detail pages.
insert into public.photo_items (photo_id, item_id, is_main, "order") values
  ('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', true, 0),
  ('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000002', true, 0),
  ('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', false, 1);
```

- [ ] **Step 2: Reset + reseed the local stack**

Run: `supabase db reset` (re-applies migrations + seed against the LOCAL stack).
Expected: completes without SQL error.

- [ ] **Step 3: Verify the audit script sees the derived pair**

Run: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node scripts/audit-relations.mjs`
Expected output includes `direct pairs (project_items):      2`, `derived pairs (photo→item):        3` (gangnam photo003→aeron, item-gallery eames photo006→eames, pangyo photo004→aeron), and a per-project line for `66666666-…002` with `0/0` (no direct pairs) — i.e. pangyo's aeron link is derived-only.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "test(m4): seed a derived-only project↔item pair (pangyo photo → aeron)"
```

---

## Task 10: Site E2E — derived relations appear on detail pages

**Files:**
- Modify: `tests/e2e/site/project-detail.spec.ts`
- Create: `tests/e2e/site/item-detail.spec.ts`

**Interfaces:**
- Consumes: Task 8 queries + Task 9 seed. Site cards render `a.d4p-card[href=...]` (project detail `ItemCard`, item detail `ProjectCard`); related-item heading is `이 공간에 사용된 가구` (h2), related-project heading is `도입 프로젝트` (h2).

- [ ] **Step 1: Add the derived-related-item test to project-detail**

Append to `tests/e2e/site/project-detail.spec.ts` inside the `test.describe('프로젝트 상세', ...)` block:

```ts
  test('직접 연결이 없어도 파생(사진→아이템) 관련 아이템이 표시된다', async ({ page }) => {
    // pangyo-library has zero project_items; its main photo is tagged with aeron
    // (seed derived row), so the union surfaces aeron as a related item.
    await page.goto('/projects/pangyo-library')
    await expect(page.getByRole('heading', { level: 2, name: '이 공간에 사용된 가구' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/items/aeron-chair"]')).toBeVisible()
  })
```

- [ ] **Step 2: Create the item-detail spec**

Create `tests/e2e/site/item-detail.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('아이템 상세', () => {
  test('도입 프로젝트에 직접 연결(강남) + 파생 연결(판교)이 모두 표시된다', async ({ page }) => {
    // aeron is directly linked only to gangnam (project_items). It is tagged on a
    // pangyo project photo (seed derived row), so the union adds pangyo.
    await page.goto('/items/aeron-chair')
    await expect(page.getByRole('heading', { level: 2, name: '도입 프로젝트' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()
  })
})
```

- [ ] **Step 3: Run the site suite (requires the seeded local stack + dev server via Playwright webServer)**

Run: `npx playwright test tests/e2e/site/project-detail.spec.ts tests/e2e/site/item-detail.spec.ts`
Expected: PASS. (If the derived assertions fail, re-run `supabase db reset` — Task 9 seed must be applied.)

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/site/project-detail.spec.ts tests/e2e/site/item-detail.spec.ts
git commit -m "test(m4): site e2e — derived related items/projects on detail pages"
```

---

## Task 11: Admin + integration E2E — tag on project photo → derived relation + immediate reflect

**Files:**
- Create: `tests/e2e/admin/project-item-tagging.spec.ts`
- Create: `tests/e2e/integration/derived-relations.spec.ts`

**Interfaces:**
- Consumes: the project edit UI (Task 6), `EntityPicker` dialog pattern (open trigger `아이템 선택`, pick option by accessible name, confirm `확인`), the `data-testid="uploaded-photo"` / `photo-item-tagging` hooks, and M2 revalidation (project mutation purges `/items/[slug]`).
- Note on ids: the admin projects list API returns `{ success, data: { items, total } }`, project field is `.name` (mapProject maps title→name). Slug is not echoed; for ASCII titles compute it via the shared `slugify` used in existing specs.

- [ ] **Step 1: Admin — tag an item on an existing project photo, assert derived pair via API**

Create `tests/e2e/admin/project-item-tagging.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Seeded project "강남 오피스 리노베이션" (gangnam-office). We add an item tag
// to its second photo (라운지, currently untagged) and confirm the derived
// relation is persisted (project GET echoes images[].itemIds).
const GANGNAM_ID = '66666666-0000-0000-0000-000000000001'
const EAMES_NAME = '이임스 라운지' // item 44444444-…002

test.describe('프로젝트 사진 아이템 태깅', () => {
  test('사진에 아이템을 태깅하면 파생 연결이 저장된다', async ({ page }) => {
    await page.goto(`/admin/projects/${GANGNAM_ID}/edit`)

    // The photo rows are rendered; open the item picker on the 2nd photo row.
    const secondRow = page.getByTestId('uploaded-photo').nth(1)
    await secondRow.getByTestId('photo-item-tagging').getByRole('button', { name: '아이템 선택' }).click()
    await page.getByRole('button', { name: EAMES_NAME }).click()
    await page.getByRole('button', { name: '확인' }).click()

    await page.getByRole('button', { name: '변경사항 저장' }).click()
    await page.waitForURL(new RegExp(`/admin/projects/${GANGNAM_ID}`))

    // Verify via the admin API that a project photo now carries the eames item tag.
    const res = await page.request.get(`/api/admin/projects/${GANGNAM_ID}`)
    const { data } = await res.json()
    const taggedItemIds = (data.images ?? []).flatMap((img: { itemIds?: string[] }) => img.itemIds ?? [])
    expect(taggedItemIds).toContain('44444444-0000-0000-0000-000000000002')
  })
})
```

- [ ] **Step 2: Run the admin spec**

Run: `npx playwright test tests/e2e/admin/project-item-tagging.spec.ts`
Expected: PASS.

- [ ] **Step 3: Integration — tag → item detail reflects immediately (revalidation over derived path)**

Create `tests/e2e/integration/derived-relations.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Regression for the derived-relation transition: tagging an item on a project
// photo in the CMS must make that project appear on the item's detail page
// immediately (project mutation revalidates the /items/[slug] pattern — M2).
const GANGNAM_ID = '66666666-0000-0000-0000-000000000001'
const EAMES_SLUG = 'eames-lounge' // item 44444444-…002
const EAMES_NAME = '이임스 라운지'

test('사진에 아이템 태깅 → 아이템 상세의 도입 프로젝트에 즉시 반영', async ({ page }) => {
  // eames is directly linked to gangnam but has NO relation to pangyo in the seed
  // (pangyo has zero project_items and no eames photo_items). Tagging eames on a
  // pangyo photo must make pangyo appear on eames' detail immediately.
  const PANGYO_ID = '66666666-0000-0000-0000-000000000002'

  await page.goto(`/items/${EAMES_SLUG}`)
  await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toHaveCount(0)

  // Tag eames onto a pangyo project photo.
  await page.goto(`/admin/projects/${PANGYO_ID}/edit`)
  const firstRow = page.getByTestId('uploaded-photo').first()
  await firstRow.getByTestId('photo-item-tagging').getByRole('button', { name: '아이템 선택' }).click()
  await page.getByRole('button', { name: EAMES_NAME }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await page.getByRole('button', { name: '변경사항 저장' }).click()
  await page.waitForURL(new RegExp(`/admin/projects/${PANGYO_ID}`))

  // No manual revalidate/wait: the project PUT called revalidateEntity('project'),
  // which purges the /items/[slug] pattern. pangyo now shows on eames' detail.
  await page.goto(`/items/${EAMES_SLUG}`)
  await expect(page.getByRole('heading', { level: 2, name: '도입 프로젝트' })).toBeVisible()
  await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()
})
```

- [ ] **Step 4: Run the integration spec**

Run: `npx playwright test tests/e2e/integration/derived-relations.spec.ts`
Expected: PASS. This proves M2 revalidation already covers the derived write path (no revalidation code change needed in M4).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin/project-item-tagging.spec.ts tests/e2e/integration/derived-relations.spec.ts
git commit -m "test(m4): e2e — tag item on project photo → derived relation + immediate site reflect"
```

---

## Task 12: Gate — full typecheck, unit, e2e, audit smoke

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Full unit suite**

Run: `npx vitest run`
Expected: all green (includes `relations`, `audit-relations`, extended `dto`, and the unchanged project API tests).

- [ ] **Step 3: Reseed + full Playwright suite on the local stack**

Run: `supabase db reset && npx playwright test`
Expected: setup + `site` + `admin` + `integration` projects all green, including the four new/extended M4 specs. (Fallback if Docker is unavailable at gate time: run `npx tsc --noEmit && npx vitest run` and the static assertions, then complete the Playwright run in CI where the M3 workflow boots `supabase start` — per M3 plan `.github/workflows/ci.yml`.)

- [ ] **Step 4: Audit smoke against the seeded local stack**

Run: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node scripts/audit-relations.mjs`
Expected: prints direct=2, derived=3, integrity checks all 0 (seed has no orphan photos, no brandless items, both published projects have a main photo).

- [ ] **Step 5: Final commit (if any incidental fixes were needed)**

```bash
git add -A
git commit -m "chore(m4): gate — tsc/vitest/playwright green + audit smoke"
```

---

## Self-Review

**Spec §7-1 coverage:**
- Target model (project→photo→item derived; brand = item attribute) — Tasks 3-8 implement per-photo tagging + derived reads; brand unchanged (still `items.brand_id`). ✓
- Production reality (no migration, `photo_items` exists, additive only) — Global Constraints + Task 9 additive seed; zero migrations. ✓
- Stage 1 CMS UI (per-photo tagging via `photo_items` upsert in project context; legacy direct UI → read-only + retag badge; photo-edit item tagging unchanged) — Tasks 5-7; photo edit page untouched. ✓
- Stage 2 site (project related-items / item related-projects → derived, with direct∪derived transition union; search body same rule) — Task 8 union via reusable `lib/relations.ts` (kept generic for M6 search). ✓
- Stage 3 DROP explicitly out of scope — Global Constraints ("`project_items` is kept"). ✓
- Audit tool (`scripts/audit-relations.mjs`: direct-vs-derived, per-project progress, orphan/brandless/no-main checks, read-only, any URL) — Task 2. ✓

**Consistency with M2 / M3 conventions:** revalidation reused unchanged (project mutation → `/items/[slug]` pattern), verified by Task 11 integration spec; seed extends the existing truncate+insert idempotent file with fixed UUIDs; specs follow the existing `a.d4p-card[href]` / `status-trigger` / `uploaded-photo` selector conventions and the `{ data: { items } }` admin-list shape; unit tests live under `tests/**/*.test.ts` per `vitest.config.ts`.

**Placeholder scan:** no TBD/TODO/"similar to"; every code step shows full code; every command has an expected result.

**Type consistency:** `ImageData.itemIds?: string[]` (Task 3) is produced by `mapImagesFromPhotos`, sent by the edit/new forms as `photos[].itemIds` (Tasks 6-7), typed on `ImageInput.itemIds`/`PhotoRef` and consumed by `resolvePhotoIds`→`syncProjectPhotos`→`syncPhotoItems` (Task 4). `unionById`/`dedupeById` signatures (Task 1) match their `lib/api.ts` call sites (Task 8). `pairKey`/`missingDerived`/`perProjectProgress` (Task 2) match the unit test and the CLI report.

**Open question (flagged, not blocking):** Task 11 Step 3’s integration spec tags **eames** onto a **pangyo** photo. Confirm at execution time that eames (`…002`) has no pre-existing relation to pangyo in the seed (it does not: pangyo has zero `project_items`, and no seed `photo_items` links eames to a pangyo photo) so the "before" assertion (`toHaveCount(0)`) holds. If a future seed change adds one, switch the target item to a freshly created one.
