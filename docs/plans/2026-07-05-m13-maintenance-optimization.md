# Milestone 13 — Maintenance, Optimization & Legal Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This milestone is explicitly scoped so an **Opus/Sonnet/Codex** maintainer can execute it without a frontier model — every task carries exact files, complete code/content, and verification commands.

**Goal:** Six deliverables on the live `design4public.com` unified repo, all behavior-preserving except where noted: (1) tighten the harness/docs so future maintenance is done by non-frontier models — AGENTS.md, a leaner CLAUDE.md, fixed/stale docs, an env+recipe reference, and two npm-script automations; (2) apply the audit's high/medium architecture & readability fixes with bounded diffs; (3) convert 13 of 14 site `<img>` to `next/image`; (4) apply the SEO high/medium fixes (canonical host, admin noindex, sitemap encoding, list-page metadata, JSON-LD escaping); (5) raise the public-site type scale one Material-anchored step; (6) render item photos (detail hero + item thumbnail cards) 1:1; and (7) replace the placeholder legal pages with full Korean 개인정보처리방침 / 이용약관 정식판 (effective 2026-07-05). The 117-case vitest suite and 74-spec Playwright suite are the regression net.

**Architecture:** Every change is either (a) docs/config (harness restructure — inert), (b) a bounded readability refactor validated by `tsc`/`vitest` (two small shared helpers, one caching consistency fix), (c) a mechanical `<img>`→`next/image` swap made safe by four one-line CSS `position: relative` additions the image audit identified as blocking, (d) metadata/string edits (SEO), (e) a token + literal type-scale bump on the **public site only** (admin CMS untouched), (f) two `ratio` prop edits plus two CSS values (item 1:1), or (g) content-only replacement of the shared legal component's data (no component restructure beyond one `white-space` style prop). **No DB/migration changes** (additive-only rule; none needed). **No new runtime dependencies** — zod is evaluated and **declined** (see Global Constraints). The final task is a single-agent live gate.

**Tech Stack:** Next.js 15.5.20, React 19, TypeScript 5.5, ESLint 9 (flat config via `@eslint/eslintrc` FlatCompat), Vitest 3, Playwright 1.55, dotenv 17, `pg` 8, local Supabase (Docker, project_id `design4public`), Tailwind v4, npm (`package-lock.json`).

## Global Constraints

- **Branch** from `main`; new branch `unify/m13-maintenance`. This repo is checked out at `/Users/jaehwanlee/development/d4p/design4public-frontend`.
- **No dependency additions/removals/bumps.** No `package.json` dependency edits. The only permitted `package.json` edits are two new `scripts` entries (`db:reset`, `gate`) in Task 2. **zod is explicitly declined:** the arch audit's one systemic gap (no input validation) manifests concretely in exactly two bounded bugs — an unescaped PostgREST `or()` filter and an unvalidated upload folder — which are fixed with a ~15-line escaping helper (Task 3), not a new dependency and a whole-surface schema refactor. Adding zod would be an unbounded change disproportionate to the two defects.
- **Additive-only for anything DB.** This milestone expects **zero** DB/migration changes. Do not run `supabase gen types` against a mutated schema. No `supabase/migrations/*` edits.
- **No behavior changes outside the listed items.** Every changed line must trace to a task here (CLAUDE.md §3 Surgical Changes). Two intentional, documented behavior deltas are called out where they occur: `/projects` gains ISR caching + client-side `q` filtering to match its sibling list pages (Task 3), and item image containers become square (Task 4).
- **Public site only for typography.** The admin CMS (`app/admin`, `components/admin`) keeps Tailwind v4's stock text scale — do **not** add an `@theme` override to `app/admin/globals.css`. Decision rationale in Task 7.
- **Never weaken the gate.** No `// @ts-expect-error`, `as any`, `test.skip`, or loosened `tsconfig`/`eslint`. The **one** remaining `// eslint-disable-next-line @next/next/no-img-element` (the Gallery lightbox, `components/site/gallery.tsx`) is retained deliberately with its inline rationale — it is not weakening; it documents a `<img>` that cannot take `fill` (no determinate-size parent). If a genuine incompatibility surfaces, STOP and report.
- **One-agent-stack:** only the final gate (Task 10) starts the local Supabase stack or runs Playwright. Tasks 1–9 are `tsc`/`lint`/`vitest`/edit-only and touch no stack.
- **Kong quirk:** `supabase db reset` restarts Postgres/GoTrue but leaves Kong pointed at the pre-reset auth upstream → 502 on `/auth/v1/*`. After any `db reset` and before Playwright, run `docker restart supabase_kong_design4public`. Task 2 bakes this into a `db:reset` npm script; Task 10 performs it.
- **Expected gate baselines** (record exact numbers in Task 1; expected deltas):
  - `tsc`: **0 errors** (unchanged).
  - `lint`: **0 warnings / 0 errors** (unchanged count). Structurally, 13 of the 14 `no-img-element` disable comments are **removed** (those `<img>` become `<Image>`); **one** disable remains (Gallery lightbox).
  - `vitest`: **117 → ~123** — same cases minus none, **plus** new unit tests for `lib/pg-filter.ts` and `lib/list-query.ts` (Task 3, TDD). `seo.test.ts` gains no case but one expected value changes (apex→www host). Record the exact new total in Task 10.
  - `playwright`: **74 → 74** (no specs added/removed). Selectors are audited in Task 9; the site H1 specs (`PROJECTS`/`PHOTOS` headings) are preserved by changing only `<title>` metadata, not the hero H1.
- Commit per task with a `docs(m13)`/`refactor(m13)`/`feat(m13)`/`fix(m13)`/`chore(m13)` message; push only at the end of Task 10 (push to `main`'s PR; production deploy is Vercel auto-deploy on merge — see Task 10).

---

## File Structure

**Docs / harness (Task 2)**
- `AGENTS.md` — **new**, symlink → `CLAUDE.md` (Codex parity).
- `CLAUDE.md` — add the OpenAI never-throws boundary contract + the root `migrations/` legacy note to the Project Context section.
- `docs/qa-checklist.md` — **rewrite** to match the current surface (admin CRUD, search KR/EN, revalidation, OG, robots, RLS) so `docs/runbooks/cutover.md` Step 3 is accurate.
- `docs/specs/2026-07-03-unified-repo-design.md` — fix the stale status line + the Next 14/React 18 decisions row.
- `docs/recipes.md` — **new**: env-var table + "add a new content entity" checklist.
- `package.json` — add `db:reset` and `gate` scripts.

**Architecture / readability (Task 3)**
- `lib/pg-filter.ts` — **new**: `orIlike(cols, term)` PostgREST-escaping helper.
- `lib/list-query.ts` — **new**: `parseListQuery(searchParams, opts)` pagination/sort helper.
- `app/api/admin/{projects,items,photos,brands,managers}/route.ts` — use `orIlike` (5 sites) + `parseListQuery` (these + `categories`, 6 sites).
- `app/api/admin/categories/route.ts` — use `parseListQuery`.
- `app/(site)/projects/page.tsx` — drop `force-dynamic` + server `q` plumbing; ISR-cache + client-filter `q` (matches items/brands/photos); switch `metadata` to `createPageMetadata`.
- `app/(site)/projects/projects-view.tsx` — filter by `q` client-side (already filters by category).
- `tests/unit/lib/pg-filter.test.ts`, `tests/unit/lib/list-query.test.ts` — **new** (TDD).

**next/image (Task 5)**
- `app/(site)/globals.css` — add `position: relative` to `.d4p-detailhero-slide`, `.d4p-pmast-slide`, `.d4p-srch-thumb` (`.d4p-detailhero-thumb` handled in Task 4).
- 13 `<img>` → `<Image fill sizes=…>` across `components/site/{gallery,cards,photo-grid,brand-search,project-masthead,featured-hero}.tsx` and `app/(site)/{page,brands/[slug]/page,photos/[id]/page,search/search-results}.tsx`. Gallery lightbox stays raw.

**SEO (Task 6)**
- `lib/seo.ts` — `SITE_URL` apex → `www`.
- `app/robots.ts` — disallow `/admin/`.
- `app/admin/layout.tsx` — `robots: { index: false, follow: false }`.
- `app/(site)/sitemap.ts` — `encodeURI` dynamic segments; fixed `lastModified` for `/privacy`,`/terms`.
- `app/(site)/{items,brands,photos}/page.tsx` — Korean-keyword `<title>` (metadata only).
- `components/json-ld.tsx` — escape `<` before injection.
- `tests/unit/lib/seo.test.ts` — update expected host to `www`.

**Typography (Task 7)**
- `app/(site)/globals.css` — bump `--fs-*` tokens + the six hardcoded class font-sizes.
- ~15 `app/(site)/**` + `components/site/**` files — bump inline `fontSize` literals per the mapping table.

**Item 1:1 (Task 4)**
- `components/site/cards.tsx` — `ItemCard` ratio `4 / 3` → `1 / 1`.
- `app/(site)/items/[slug]/page.tsx` — `DetailHero` ratio `4 / 3` → `1 / 1`.
- `app/(site)/globals.css` — `.d4p-detailhero-thumb` 72×56 → 60×60 + `position: relative`.

**Legal (Task 8)**
- `components/site/legal.tsx` — replace `META` with full 정식판 text; add `white-space: pre-line`; set effective date 2026-07-05.

**E2E (Task 9)**
- Any spec whose selector is invalidated by the above (audited in-task).

---

### Task 1: Branch + record the baseline

**Files:** none modified (snapshot only).

- [ ] **Step 1: Create the branch from `main`**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git checkout main
git pull --ff-only 2>/dev/null || true
git checkout -b unify/m13-maintenance
```

- [ ] **Step 2: Record the stack-free baseline**

```bash
npx tsc --noEmit && echo "TSC=0"
npm run lint 2>&1 | tail -3            # expect: 0 warnings, 0 errors (M12 left it clean)
npx vitest run 2>&1 | tail -5          # record "N passed" (expect ~117)
grep -rc "@next/next/no-img-element" app components | grep -v ':0' # expect 14 disable comments
```
Expected: `tsc` 0; lint `0 problems`; vitest all-green (~117); 14 `no-img-element` disables present. These are the floor. Task 10 must show 0 tsc / 0 lint warnings / vitest ≥117+new-tests / exactly **1** remaining `no-img-element` disable.

- [ ] **Step 3: Note the Playwright baseline (recorded fact, no run)**

74 specs (73 `test()` + `setup`), last green ×2 at the M12 gate. Task 10 restores this ×2.

- [ ] **Step 4: Commit the branch marker**

```bash
git commit --allow-empty -m "chore(m13): branch for maintenance/optimization/legal milestone"
```

---

### Task 2: Docs & harness restructure

Make the repo legible to a non-frontier maintainer: Codex parity (AGENTS.md), the two undocumented load-bearing facts (OpenAI never-throws boundary, legacy `migrations/`), a truthful QA checklist and design spec, an env+recipe reference, and two automations that replace multi-step tribal knowledge with one command each.

**Files:** create `AGENTS.md`, `docs/recipes.md`; modify `CLAUDE.md`, `docs/qa-checklist.md`, `docs/specs/2026-07-03-unified-repo-design.md`, `package.json`.

**Interfaces:** all inert (docs/config); the two npm scripts change no product code.

- [ ] **Step 1: AGENTS.md → CLAUDE.md symlink**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
ln -s CLAUDE.md AGENTS.md
git add AGENTS.md
test -L AGENTS.md && echo "symlink OK"
```
Rationale: Codex reads `AGENTS.md`, not `CLAUDE.md`; the repo already ships `codex:*` skills. A symlink keeps the two in sync with zero duplicate maintenance. (If a later Windows/zip checkout breaks the symlink, replace with a real file of identical content — not needed now.)

- [ ] **Step 2: CLAUDE.md — add the two undocumented facts**

In `CLAUDE.md`, inside the `## Project Context (design4public unified repo)` section, extend the **Search** sentence in the **Layout** paragraph and add the migrations note to **DB safety**. Apply two edits.

Edit A — append to the Layout paragraph's search sentence (after "GPT-4o-mini captions)."):

```markdown
OpenAI calls in `lib/search` **never throw** — a caption/embedding failure or a
non-public image URL degrades to `null`/skip and never breaks the calling admin
route or a backfill row (so an OpenAI outage can't 500 an edit or abort a batch).
Preserve this when touching `lib/search/*` or the backfill scripts.
```

Edit B — replace the DB safety paragraph's last sentence so it also documents the legacy dir:

```markdown
**DB safety:** production DB is additive-migration-only; the sole destructive
migration is gated separately (M11). **Live migrations are `supabase/migrations/`
only.** The root `migrations/` directory (31 numbered SQL files) is a frozen
pre-supabase-CLI historical record — **do not apply it**; `scripts/run-migration.mjs`
and `scripts/backup-before-020.mjs` operate on that legacy set for archival reasons.
See `docs/specs/2026-07-03-unified-repo-design.md`.
```

- [ ] **Step 3: Fix the self-contradictory design spec**

In `docs/specs/2026-07-03-unified-repo-design.md`:
- Change the status line (line ~4) from `상태: 초안 — 사용자 승인 대기` to:
  `상태: 구현 완료 (M1–M13), 프로덕션 반영됨 (design4public.com)`
- In the `확정된 결정` (confirmed decisions) table, change the toolchain row pinned to `Next 14.2.x / React 18.3.x` to `Next 15.5.x / React 19` and append: `(M9에서 업그레이드 완료 — package.json 기준)`. Leave the rest of the doc as historical record.

- [ ] **Step 4: Rewrite `docs/qa-checklist.md` to match the live surface**

Replace the entire file (stale pre-unification `/projects`,`/brands`,`/items`,`/photos` smoke content) with a checklist that matches what `docs/runbooks/cutover.md` Step 3 promises:

```markdown
# QA Checklist (pre-deploy / cutover)

Run against a preview deploy (or local stack). Check each before promoting.

## Admin CMS (`/admin`, authenticated)
- [ ] Login (`signInWithPassword`) + logout; unauthenticated `/admin/*` redirects to `/admin/login`.
- [ ] Projects / Items / Brands / Managers / Categories / Photos: list loads, search filters, create + edit + delete round-trip.
- [ ] Photo upload (drag-drop → Supabase Storage `images` bucket) + set is_main.

## Public site
- [ ] Home, `/projects`, `/items`, `/brands`, `/photos` render; cards link to detail pages.
- [ ] Detail pages (project/item/brand/photo) render galleries, specs, breadcrumbs.
- [ ] Item detail hero + item thumbnail cards are square (1:1); other imagery keeps its ratio.

## Search
- [ ] Korean query returns relevant results; English query returns results.
- [ ] Search page is `noindex` (view-source: `<meta name="robots" content="noindex">`).

## Revalidation
- [ ] Edit a project title in admin → the public detail page reflects it without redeploy.

## SEO / infra
- [ ] Canonical + og:url use `https://www.design4public.com` (no redirect hop).
- [ ] `/robots.txt` disallows `/api/` and `/admin/`; `/admin` responds `noindex`.
- [ ] `/sitemap.xml` loc URLs are percent-encoded (no raw Korean bytes).
- [ ] JSON-LD present on home + detail pages and validates (no broken `</script>`).

## RLS
- [ ] Anonymous REST read of `profiles`/`inquiries` is denied (see `tests/e2e/security/rls-rest.spec.ts`).
```

- [ ] **Step 5: Create `docs/recipes.md`**

```markdown
# Recipes

## Environment variables
| Var | Required where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | local, prod | Supabase project URL (browser + server). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local, prod | Anon key for RLS-scoped client/session. |
| `SUPABASE_SERVICE_ROLE_KEY` | prod, scripts | Service role for admin uploads + backfill (bypasses RLS). |
| `DATABASE_URL` | scripts | Direct Postgres URL for backfill scripts. |
| `OPENAI_API_KEY` | prod, scripts (optional) | Caption (GPT-4o-mini) + embedding (text-embedding-3-small). Absent → captions/embeddings degrade to skip. |
| `RESEND_API_KEY` | prod (optional) | Inquiry notification email. Absent → inquiry logged to server console instead. |

## Add a new content entity (the common maintenance task)
1. **Migration** — new additive `supabase/migrations/<ts>_<name>.sql` (table + indexes).
2. **RLS** — add policies + `GRANT`s; update `docs/security/rls-matrix.md`.
3. **Types** — `supabase db reset` then `npm run db:reset` (or `npm run gen:types`) so `lib/database.types.ts` picks up the columns; add the enum alias to `scripts/postprocess-types.mjs` if it introduces a text-enum.
4. **Admin API** — `app/api/admin/<entity>/route.ts` (list GET + POST) and `[id]/route.ts` (GET/PUT/DELETE); reuse `lib/list-query.ts` + `lib/pg-filter.ts` + `requireRole`.
5. **Admin UI** — `app/admin/<entity>/…` pages (client, @vapor-ui).
6. **Site** — fetcher in `lib/api.ts`, DTO in `lib/dto.ts`, page in `app/(site)/<entity>/…`.
7. **Revalidation** — add the tag to `lib/revalidation.ts` and call it from the admin write routes.
8. **Tests** — unit test the route; add an E2E spec if it has a public page.
```

- [ ] **Step 6: Add the two automation scripts to `package.json`**

Add to `scripts` (do not alter existing entries):

```json
    "db:reset": "supabase db reset && docker restart supabase_kong_design4public && npm run gen:types",
    "gate": "tsc --noEmit && npm run lint && vitest run && next build && playwright test && playwright test"
```
Rationale: these replace the two most-repeated prose procedures — the reset+Kong+gen:types sequence (one wrong order = broken local auth) and the full "one-agent-stack" gate — with one invocation each, usable by any maintainer model. `db:reset` is local-only (`supabase db reset` never targets prod). No dependency change.

- [ ] **Step 7: Verify + commit**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo "package.json valid"
test -L AGENTS.md && readlink AGENTS.md   # -> CLAUDE.md
git add AGENTS.md CLAUDE.md docs/qa-checklist.md docs/specs/2026-07-03-unified-repo-design.md docs/recipes.md package.json
git commit -m "docs(m13): AGENTS.md, harness facts, recipes, truthful QA/spec, db:reset+gate scripts"
```

---

### Task 3: Architecture & readability fixes (bounded)

Apply the arch audit's high/medium items only: extract two shared helpers that remove copy-pasted admin-route boilerplate and fix a latent PostgREST-filter bug, and restore ISR caching to `/projects` (the one public list page needlessly forced dynamic).

**Do NOT touch** (verified good, out of scope): the OpenAI never-throws boundary (`lib/search/*`), `lib/image-sync.ts` invariants, `lib/auth.ts` RBAC, `lib/revalidation.ts`, DTO mapping (`lib/dto.ts`/`lib/api.ts`), the `naraUrl`/`mallUrl` naming drift (cosmetic, dropped), the upload-folder allowlist (low, auth-gated, dropped), and the public catalog full-dataset client filtering (low watch-item, dropped).

**Files:** create `lib/pg-filter.ts`, `lib/list-query.ts`, `tests/unit/lib/pg-filter.test.ts`, `tests/unit/lib/list-query.test.ts`; modify the 6 admin list routes, `app/(site)/projects/page.tsx`, `app/(site)/projects/projects-view.tsx`.

**Interfaces:** `orIlike(cols: string[], term: string): string`; `parseListQuery(searchParams, { sortable, defaultSort, defaultLimit? })` → `{ page, limit, offset, sortCol, ascending }`. Behavior of every admin list route is unchanged except that a search term containing `,` `(` `)` `\` no longer breaks the request.

- [ ] **Step 1 (TDD): Write the escaping + list-query tests first**

Before implementing, read one existing admin list route (e.g. `app/api/admin/projects/route.ts`) to confirm the exact current `or()` string shape and the sort-allowlist variable names, so the extracted helpers match. Then create `tests/unit/lib/pg-filter.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { orIlike } from '@/lib/pg-filter'

describe('orIlike', () => {
  it('builds an ilike or-clause across columns', () => {
    expect(orIlike(['title', 'description'], 'chair')).toBe(
      'title.ilike.%chair%,description.ilike.%chair%',
    )
  })
  it('escapes PostgREST-reserved chars so a comma/paren cannot break out of the value', () => {
    // comma, parens and backslash must be escaped, not treated as clause separators
    const out = orIlike(['title'], 'a,b(c)')
    expect(out.startsWith('title.ilike.%')).toBe(true)
    expect(out).not.toMatch(/[^\\],ilike/) // no unescaped comma introduces a new clause
    expect(out).toContain('\\,')
    expect(out).toContain('\\(')
    expect(out).toContain('\\)')
  })
  it('trims and returns empty string for a blank term', () => {
    expect(orIlike(['title'], '   ')).toBe('')
  })
})
```

Create `tests/unit/lib/list-query.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseListQuery } from '@/lib/list-query'

const sp = (o: Record<string, string>) => new URLSearchParams(o)

describe('parseListQuery', () => {
  const opts = { sortable: ['created_at', 'title'] as const, defaultSort: 'created_at' }
  it('applies defaults', () => {
    expect(parseListQuery(sp({}), opts)).toMatchObject({
      page: 1, limit: 20, offset: 0, sortCol: 'created_at', ascending: false,
    })
  })
  it('computes offset from page/limit', () => {
    expect(parseListQuery(sp({ page: '3', limit: '10' }), opts).offset).toBe(20)
  })
  it('rejects a non-allowlisted sort column, falling back to default', () => {
    expect(parseListQuery(sp({ sort: 'id; drop table' }), opts).sortCol).toBe('created_at')
  })
  it('honours dir=asc', () => {
    expect(parseListQuery(sp({ dir: 'asc' }), opts).ascending).toBe(true)
  })
})
```
Run: `npx vitest run tests/unit/lib/pg-filter.test.ts tests/unit/lib/list-query.test.ts` — expect **red** (modules absent). Adjust the two default expectations (`limit` default, `ascending` default) to whatever the existing routes actually use once you read them in this step; the helpers must preserve current defaults exactly.

- [ ] **Step 2: Implement `lib/pg-filter.ts`**

```ts
// Escapes PostgREST-reserved characters before interpolating a user search term
// into an `.or(...)` filter string. PostgREST treats `,` as a clause separator
// and `()` as grouping; an unescaped term (e.g. a title with a comma) breaks out
// of the intended ilike value and 500s. Reserved chars are escaped with a
// backslash per PostgREST's documented rule.
function escapeTerm(term: string): string {
  return term.replace(/[\\,()]/g, (c) => `\\${c}`)
}

/** Build `col1.ilike.%term%,col2.ilike.%term%` with the term safely escaped. */
export function orIlike(cols: string[], term: string): string {
  const t = term.trim()
  if (!t) return ''
  const safe = escapeTerm(t)
  return cols.map((c) => `${c}.ilike.%${safe}%`).join(',')
}
```

- [ ] **Step 3: Implement `lib/list-query.ts`**

Match the current default `limit` and default sort direction found in Step 1 (the routes use these consistently). Template (adjust the two defaults to the observed values):

```ts
export interface ListQueryOptions {
  sortable: readonly string[]
  defaultSort: string
  defaultLimit?: number
}

export interface ListQuery {
  page: number
  limit: number
  offset: number
  sortCol: string
  ascending: boolean
}

/** Parse page/limit/sort/dir from an admin list request, with an allowlisted
 *  sort column (never lets an unvalidated column reach `.order()`). */
export function parseListQuery(
  searchParams: URLSearchParams,
  { sortable, defaultSort, defaultLimit = 20 }: ListQueryOptions,
): ListQuery {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10) || defaultLimit)
  const offset = (page - 1) * limit
  const sortParam = searchParams.get('sort') ?? defaultSort
  const sortCol = sortable.includes(sortParam) ? sortParam : defaultSort
  const ascending = searchParams.get('dir') === 'asc'
  return { page, limit, offset, sortCol, ascending }
}
```
Run the two test files again — expect **green**. If a route defaulted `ascending` to `true` or used a different default limit, encode that here and in the test; do not change any route's observable behavior.

- [ ] **Step 4: Adopt the helpers at the call sites**

For each of `app/api/admin/{projects,items,photos,brands,managers}/route.ts`: replace the hand-built `.or(\`…ilike…\`)` string with `orIlike([...cols], search)` (guard: only apply `.or(...)` when the returned string is non-empty, preserving today's "no search term → no filter" behavior). For each of those five **plus** `app/api/admin/categories/route.ts`: replace the inline `parseInt`/`offset`/sort-allowlist/`ascending` block with a single `parseListQuery(searchParams, { sortable: SORT_COLUMNS, defaultSort: '<current default>' })` call, reusing each route's existing allowlist array and default. Change nothing else in these files.

- [ ] **Step 5: `/projects` → ISR + client `q` filter + proper metadata**

`app/(site)/projects/page.tsx` currently sets `export const dynamic = 'force-dynamic'` solely to read `searchParams.q`, then server-filters `q` in JS — while `projects-view.tsx` already re-filters category/sort client-side over the same array. Make it match its siblings (items/brands/photos use `revalidate = 3600` and pass the full list to a client view):
- Remove `export const dynamic = 'force-dynamic'` and add `export const revalidate = 3600`.
- Remove the server-side `q` read/plumbing; call `fetchProjects()` with no query args and pass the full list to `ProjectsView` (mirror `app/(site)/items/page.tsx`).
- In `app/(site)/projects/projects-view.tsx`, read `q` from the client (it already uses client state for category/sort) and add a title/summary substring filter alongside the existing category filter — same predicate `fetchProjects` used server-side, moved client-side.
- Replace `export const metadata = { title: 'PROJECTS' }` with:
  ```ts
  export const metadata = createPageMetadata({
    title: '프로젝트 · 공공조달 가구 납품사례',
    description: '공공기관·공공공간에 납품된 가구 프로젝트 사례를 브랜드·연도·카테고리별로 살펴봅니다.',
    path: '/projects',
  })
  ```
  (import `createPageMetadata` from `@/lib/seo`.) **Leave the hero `<PageHero title="PROJECTS" …>` H1 unchanged** — the E2E spec asserts that H1 (Task 9); only the `<title>` tag changes here.

Behavior note (intentional, documented): a shared `?q=` URL now renders the full list in initial SSR HTML and filters client-side (identical to how `/items` handles its filters today), trading a filtered first paint for restored 3600 s ISR caching. No user-visible correctness change.

- [ ] **Step 6: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
npx vitest run tests/unit/lib/pg-filter.test.ts tests/unit/lib/list-query.test.ts 2>&1 | tail -5
npx vitest run tests/unit/admin 2>&1 | tail -6      # existing admin-route tests still green
git add lib/pg-filter.ts lib/list-query.ts tests/unit/lib "app/api/admin" "app/(site)/projects"
git commit -m "refactor(m13): orIlike/parseListQuery helpers; ISR-cache /projects with client q filter"
```
Expected: tsc 0; new helper tests green; existing admin route tests unchanged (behavior preserved). If an admin route test breaks, a default drifted — reconcile the helper to the route's prior behavior, do not change the test's intent.

---

### Task 4: Item images 1:1 (detail hero + thumbnail cards)

Per the design audit: `ItemCard` and the item detail hero each pass one explicit `ratio` to a shared component, so this is a two-line change plus a matching thumbnail-strip tweak — and it squares **only** item imagery (project/brand/photo components use their own independent ratios and are untouched).

**Files:** `components/site/cards.tsx`, `app/(site)/items/[slug]/page.tsx`, `app/(site)/globals.css`.

- [ ] **Step 1: Square the item card frame**

In `components/site/cards.tsx`, in `ItemCard` (the `CardFrame` call around line 80), change `ratio="4 / 3"` → `ratio="1 / 1"`. **Do not** touch `ProjectCard` (`3 / 2`) or `BrandCard` (`4 / 3`). This covers every item thumbnail sitewide (homepage, items list, brand/project/photo detail related-items) since all reuse `ItemCard`.

- [ ] **Step 2: Square the item detail hero**

In `app/(site)/items/[slug]/page.tsx` (the `<DetailHero images={item.gallery} ratio="4 / 3" />` around line 90), change `ratio="4 / 3"` → `ratio="1 / 1"`. `DetailHero` is consumed only by this page (grep-confirmed in the audit).

- [ ] **Step 3: Square the item hero thumbnail strip**

In `app/(site)/globals.css`, `.d4p-detailhero-thumb` (≈ lines 1131–1152) is a fixed 72×56 box. Change `width: 72px; height: 56px;` → `width: 60px; height: 60px;` and add `position: relative;` to the same rule (the `position: relative` is also the prerequisite for the Task 5 `next/image fill` conversion of this thumbnail — set it here). Keeps the thumbnail rail visually consistent with the now-square hero.

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
grep -n "position: relative" "app/(site)/globals.css" | grep -i detailhero-thumb  # sanity
git add components/site/cards.tsx "app/(site)/items/[slug]/page.tsx" "app/(site)/globals.css"
git commit -m "feat(m13): render item photos 1:1 (card + detail hero + thumb strip)"
```
Visual QA (deferred to Task 10 live run): item cards and the item detail hero are square; project/brand/photo imagery keeps its ratio.

---

### Task 5: Convert site `<img>` → `next/image`

Convert 13 of the 14 site `<img>` to `<Image fill sizes=…>`. Every one already uses a hand-rolled CSS-fill layout (positioned/aspect-ratioed parent + `width/height:100%;object-fit:cover`), which is exactly what `fill` automates — so with the parent's `position` fixed, each swap is visually identical. The Gallery lightbox (`components/site/gallery.tsx`) stays a raw `<img>` (no determinate-size parent; see Global Constraints). `next.config.mjs` already whitelists the Supabase object endpoint + webp/deviceSizes — no config change.

**Files:** `app/(site)/globals.css` (3 CSS additions) + the 13 conversion sites listed below. Import `Image from 'next/image'` in each converted file.

- [ ] **Step 1: Add the blocking `position: relative` CSS**

In `app/(site)/globals.css`, add `position: relative;` to these three rules (the fourth, `.d4p-detailhero-thumb`, already got it in Task 4):
- `.d4p-detailhero-slide` (flex track slide — without this, `fill`'s `position:absolute` anchors to the outer carousel box and every slide stacks, breaking the `translateX` track).
- `.d4p-pmast-slide` (same, project masthead carousel).
- `.d4p-srch-thumb` (42×42 search thumbnail box).

- [ ] **Step 2: Convert the 13 sites**

For each, replace `<img … />` with `<Image fill sizes="…" {priority?} … />`, dropping the width/height/objectFit inline styling that `fill` supplies (keep `alt`, keep `object-fit: cover` via the `style`/`className` on the Image where the parent expects cover — `fill` defaults to `object-fit:fill`, so set `style={{ objectFit: 'cover' }}` to preserve the current look; use `objectFit:'contain'` only for the PhotoModal). Remove the now-obsolete `{/* eslint-disable-next-line @next/next/no-img-element */}` comment above each converted `<img>`. Per-site parameters (from the image audit's per-file table):

| # | File (approx line) | `sizes` | `priority` | notes |
|---|---|---|---|---|
| 1 | `components/site/gallery.tsx` DetailHero slide (55) | `(max-width:860px) 100vw, 60vw` | idx 0 only | parent `.d4p-detailhero-slide` now `relative` |
| 2 | `components/site/gallery.tsx` DetailHero thumb (77) | `60px` | no | parent 60×60 (Task 4) |
| 3 | `components/site/gallery.tsx` masonry tile (137) | `(max-width:460px) 100vw, (max-width:720px) 50vw, (max-width:1080px) 33vw, (max-width:1500px) 25vw, (max-width:1980px) 20vw, 16vw` | no | parent already `relative` |
| — | `components/site/gallery.tsx` lightbox (194) | — | — | **KEEP RAW `<img>`** + its disable comment |
| 4 | `components/site/cards.tsx` CardFrame (27) | `.d4p-grid-3`→`(max-width:560px) 100vw, (max-width:860px) 50vw, 33vw`; `.d4p-grid-4`→`(max-width:560px) 100vw, (max-width:860px) 50vw, (max-width:1080px) 33vw, 25vw` | no | one component serves all three card types; pick the sizes by the grid class it renders into (simplest: use the `.d4p-grid-4` string — the wider superset — for all, acceptable per audit) |
| 5 | `components/site/photo-grid.tsx` masonry tile (56) | same masonry string as #3 | no | parent already `relative` |
| 6 | `components/site/photo-grid.tsx` PhotoModal (131) | `(max-width:860px) 92vw, 820px` | no | `objectFit:'contain'`; parent `.d4p-photo-stage` already sized+`relative` |
| 7 | `components/site/brand-search.tsx` thumb (44) | `42px` | no | parent `.d4p-srch-thumb` now `relative` |
| 8 | `components/site/project-masthead.tsx` slide (122) | `(max-width:860px) 100vw, 60vw` | idx 0 only | parent `.d4p-pmast-slide` now `relative` |
| 9 | `components/site/featured-hero.tsx` slide (40) | `100vw` | idx 0 only | parent already `absolute/inset:0` |
| 10 | `app/(site)/page.tsx` Latest-Photos tile (~84) | `.d4p-grid-4` string as #4 | no | parent Link `relative` + `aspectRatio 1/1` |
| 11 | `app/(site)/brands/[slug]/page.tsx` cover (~100) | `100vw` | **priority** | parent `relative` + `aspectRatio 21/9` (LCP) |
| 12 | `app/(site)/photos/[id]/page.tsx` main (~88) | `(max-width:860px) 100vw, 60vw` | **priority** | parent `.d4p-photo-tile` `relative` + `aspectRatio 4/3` (LCP) |
| 13 | `app/(site)/search/search-results.tsx` thumb (~49) | `42px` | no | parent `.d4p-srch-thumb` now `relative` |

For the three carousels (#1, #8, #9) that render every slide with an opacity toggle, set `priority` on the index-0 slide only; leave the rest at default lazy.

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
npm run lint 2>&1 | tail -3                                   # still 0 warnings
grep -rc "@next/next/no-img-element" app components | grep -v ':0'   # expect exactly ONE (gallery lightbox)
grep -rln "<img" "app/(site)" components/site | sort           # only gallery.tsx should remain
git add "app/(site)/globals.css" components/site "app/(site)/page.tsx" "app/(site)/brands" "app/(site)/photos" "app/(site)/search"
git commit -m "perf(m13): convert 13 site imgs to next/image (fill+sizes); keep lightbox raw"
```
Expected: tsc 0; lint 0; **exactly one** `no-img-element` disable remains; only `components/site/gallery.tsx` still contains a raw `<img>`. Rendering correctness (no stacked carousels, no CLS) is confirmed in the Task 10 live run.

---

### Task 6: SEO high/medium fixes

Canonical host, admin crawl/index blocking, sitemap encoding, list-page metadata/titles, and the JSON-LD injection escape.

**Files:** `lib/seo.ts`, `app/robots.ts`, `app/admin/layout.tsx`, `app/(site)/sitemap.ts`, `app/(site)/{items,brands,photos}/page.tsx`, `components/json-ld.tsx`, `tests/unit/lib/seo.test.ts`.

- [ ] **Step 1: Canonical host apex → www**

Confirm `www` is the primary domain in Vercel (see memory `d4p-deploy-facts`; the audit verified `curl -I https://design4public.com/` → 307 → `https://www.design4public.com/`). Then in `lib/seo.ts` line 3: `export const SITE_URL = "https://www.design4public.com";`. This propagates to `metadataBase`, canonical, og:url, JSON-LD `@id`/url, sitemap `<loc>`, and robots Host in one edit.

- [ ] **Step 2: Update the host-dependent unit test**

In `tests/unit/lib/seo.test.ts` line 25, change the expected `mainEntityOfPage` from `https://design4public.com/projects/gangnam-office` to `https://www.design4public.com/projects/gangnam-office`. (Grep the file for any other bare `https://design4public.com` literal and update to `www` to match.) This is an expected value change, not new coverage.

- [ ] **Step 3: Block `/admin` from crawl + index**

- `app/robots.ts`: add `"/admin/"` to the `disallow` array (alongside `"/api/"`).
- `app/admin/layout.tsx`: add `robots: { index: false, follow: false }` to the exported `metadata` (defense-in-depth — robots.txt stops crawling, not indexing of a linked URL).

- [ ] **Step 4: Percent-encode sitemap slugs + fix static lastmod**

In `app/(site)/sitemap.ts`: wrap each dynamic path segment in `encodeURI(...)` where slugs/ids are interpolated (projects, items, brands, photos) so raw Korean bytes become valid percent-encoded URLs. Separately, give the legal static routes a fixed date: `/privacy` and `/terms` → `lastModified: new Date('2026-07-05')` (matches the legal effective date, Task 8) instead of `now`. Leave entity `lastModified` (real `updatedAt`) and the other list routes as-is.

- [ ] **Step 5: Korean-keyword `<title>` on the three sibling list pages**

Change **only the metadata `title`** (the `<title>` tag) — leave each page's `<PageHero>` H1 unchanged (the E2E specs assert the H1 category words; Task 9). In `createPageMetadata({ title, … })`:
- `app/(site)/items/page.tsx`: `title: '아이템 · 오피스·공공가구 제품'`
- `app/(site)/brands/page.tsx`: `title: '브랜드 · 가구 제조사'`
- `app/(site)/photos/page.tsx`: `title: '포토 · 공공공간 가구 사진'`
(`/projects` was done in Task 3.)

- [ ] **Step 6: Escape `<` in JSON-LD injection**

In `components/json-ld.tsx`, change `JSON.stringify(data)` inside `dangerouslySetInnerHTML` to `JSON.stringify(data).replace(/</g, '\\u003c')` — prevents a CMS field containing `</script>` from closing the tag early (breaks structured data + stored-XSS vector).

- [ ] **Step 7: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
npx vitest run tests/unit/lib/seo.test.ts 2>&1 | tail -5
git add lib/seo.ts app/robots.ts app/admin/layout.tsx "app/(site)/sitemap.ts" "app/(site)/items/page.tsx" "app/(site)/brands/page.tsx" "app/(site)/photos/page.tsx" components/json-ld.tsx tests/unit/lib/seo.test.ts
git commit -m "fix(m13): www canonical, admin noindex, sitemap encoding, KR list titles, JSON-LD escape"
```
Expected: tsc 0; seo.test green with the www host.

---

### Task 7: Public-site type scale — up one step

Raise the public site one Material-anchored step. Per the design audit the public site does **not** use Tailwind `text-*` utilities — its scale is (a) the `--fs-*` custom properties in `app/(site)/globals.css :root`, (b) six hardcoded `font-size` px in globals.css class rules, and (c) ~90 inline `style={{ fontSize: N }}` literals across ~15 files. All three must move. **Admin is out of scope** (decision below). This is mechanical but non-trivial (the "hundreds of usages" restated as inline styles) — do it file-by-file with the grep checks.

**Admin decision (stated):** leave `app/admin/globals.css` at Tailwind v4 defaults; do **not** add an `@theme` block. "Fonts too small" was about the public-facing site; admin is a dense CMS (tables/sidebars/pickers) where a one-step bump risks row/column overflow, and its operators are not the complaining "users."

**Files:** `app/(site)/globals.css`; the ~15 site files enumerated in Step 3.

- [ ] **Step 1: Bump the `--fs-*` tokens (exact before → after)**

In `app/(site)/globals.css :root` (lines 112–123), replace with (values chosen as the next 1px/0.0625rem Material step; body stays ≥ Material body-large):

| Token | Before | After |
|---|---|---|
| `--fs-display` | `clamp(2.75rem, 5.5vw, 4.5rem)` | `clamp(3rem, 5.8vw, 4.75rem)` |
| `--fs-h1` | `clamp(2rem, 3.6vw, 3rem)` | `clamp(2.125rem, 3.8vw, 3.25rem)` |
| `--fs-h2` | `clamp(1.5rem, 2.4vw, 2rem)` | `clamp(1.625rem, 2.6vw, 2.125rem)` |
| `--fs-h3` | `1.375rem` | `1.5rem` |
| `--fs-h4` | `1.125rem` | `1.1875rem` |
| `--fs-lead` | `1.25rem` | `1.375rem` |
| `--fs-body` | `1rem` | `1.0625rem` |
| `--fs-sm` | `0.875rem` | `0.9375rem` |
| `--fs-xs` | `0.75rem` | `0.8125rem` |
| `--fs-label` | `0.6875rem` | `0.75rem` |

- [ ] **Step 2: Bump the six hardcoded globals.css class font-sizes**

Apply the literal mapping (Step 3 table) to these known rules:
- `.d4p-card-overline` `10.5px` → `12px` (≈ line 487)
- `.d4p-card-title` `15.5px` → `17px` (≈ 496)
- `.d4p-card-meta` `13px` → `14.5px` (≈ 505)
- `.d4p-srch-sec` `10px` → `11.5px` (≈ 761)
- `.d4p-hero-tag` `11px` → `12.5px` (≈ 878)
- `.d4p-spec-row` `13.5px` → `15px` (≈ 1171)

- [ ] **Step 3: Bump the inline `fontSize` literals**

Apply this deterministic mapping to **every `fontSize:` numeric literal** (and any missed `font-size:` px) — one Material step up. Do **not** touch `lineHeight`, spacing, `width`/`height`, or non-font rem values.

| Old | New | Old | New |
|---|---|---|---|
| 10 | 11.5 | 14.5 | 16 |
| 10.5 | 12 | 15 | 16.5 |
| 11 | 12.5 | 15.5 | 17 |
| 11.5 | 13 | 16 | 17.5 |
| 12 | 13.5 | 19 | 21 |
| 12.5 | 14 | 20 | 22 |
| 13 | 14.5 | 22 | 24 |
| 13.5 | 15 | 24 | 26 |
| 14 | 15.5 | 28 | 30 |

Catch-all for any value not in the table: **≤16px → +1.5px; 17–24px → +2px; >24px → ×1.08 rounded to nearest integer.** For inline `rem`/`clamp()` heading literals: multiply each `rem` value by **1.08**, rounded to the nearest `0.0625rem` (1px).

Files to sweep (from the audit): `app/(site)/page.tsx`, `app/(site)/brands/[slug]/page.tsx`, `app/(site)/projects/[slug]/page.tsx`, `app/(site)/items/[slug]/page.tsx`, `app/(site)/photos/[id]/page.tsx`, `app/(site)/search/search-results.tsx`, and `components/site/`: `sticky-title.tsx`, `gallery.tsx`, `site-footer.tsx`, `site-header.tsx`, `list-controls.tsx`, `primitives.tsx`, `photo-grid.tsx`, `contact-modal.tsx`, `project-masthead.tsx`, `legal.tsx`, `cards.tsx`, `brand-search.tsx`, `featured-hero.tsx`, `ui.tsx`, `page-chrome.tsx`. Work one file at a time; after each, `grep -n "fontSize" <file>` and confirm no un-bumped old value remains.

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
npm run lint 2>&1 | tail -3
# sanity: no stray old literals left (spot-check a few high-frequency ones)
grep -rn "fontSize: 13[^.]" "app/(site)" components/site || echo "no bare 13 left"
git add "app/(site)/globals.css" "app/(site)" components/site
git commit -m "feat(m13): raise public-site type scale one Material step (tokens + literals)"
```
Note: `components/site/legal.tsx` inline sizes (12.5→14, 16→17.5, 15→16.5, 13.5→15) are bumped here; its `META` content is rewritten in Task 8 (different region of the file). Manual visual QA of the item spec sheet and project-masthead nav overlay is a Task 10 checklist item (fixed-width columns near now-larger text).

---

### Task 8: Legal pages — 개인정보처리방침 / 이용약관 정식판

Replace the placeholder `META` in `components/site/legal.tsx` with full Korean legal text contextualized to the actual service (read-only public-procurement furniture catalog; inquiry form; no e-commerce, no public accounts, no UGC; internal CMS operators only). Component contract is preserved (`sections: [string, string][]`); the only structural change is one `white-space: pre-line` style so multi-line bodies render, plus the effective-date string. All facts are from the legal fact sheet (verified from source).

**Contact/officer decision:** unify on the operational address **d4p@design4public.com** (used in `lib/seo.ts` `CONTACT_EMAIL` and the footer) and phone **+82-31-599-2662**; drop the placeholder `privacy@design4public.kr`. The 개인정보 보호책임자 is named as the operations team (no individual name exists in code) — **the PR description must flag that the business should confirm a named DPO and that a lawyer should review before this is relied upon** (do not put that disclaimer on the public page).

**Files:** `components/site/legal.tsx`.

- [ ] **Step 1: Render multi-line bodies + set the effective date**

In `components/site/legal.tsx`:
- Add `whiteSpace: "pre-line"` to the section `<p>` style object (the one with `lineHeight: 1.75`) so `\n` in body strings renders as line breaks.
- Replace the hardcoded `최종 개정일 · 2026.01.01` string with `시행일 · 2026. 07. 05.`.

- [ ] **Step 2: Replace the `META` object with the full text**

Replace the entire `META` constant (privacy + terms) with the following. Use exactly this Korean content (bodies contain `\n` for line items):

```tsx
const META: Record<Kind, { title: string; lead: string; sections: [string, string][] }> = {
  privacy: {
    title: "개인정보처리방침",
    lead: "디자인포퍼블릭(design4public)은 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.",
    sections: [
      ["제1조 (개인정보의 처리 목적)",
        "회사는 다음의 목적을 위하여 개인정보를 처리하며, 목적 이외의 용도로는 이용하지 않습니다.\n1. 문의 응대: 이용자가 문의하기 양식을 통해 남긴 문의에 대한 확인·연락·답변\n2. 서비스 운영 및 개선: 카탈로그(프로젝트·아이템·브랜드·포토) 제공, 서비스 품질 개선\n3. 운영자 계정 관리: 콘텐츠 관리자(운영자) 계정의 가입 승인·인증·권한 관리"],
      ["제2조 (처리하는 개인정보의 항목)",
        "회사는 다음의 개인정보 항목을 처리합니다.\n1. 문의하기(공개 이용자): 이름, 이메일 주소, 회사명(선택), 문의 내용. 이용자가 답변을 위해 자발적으로 제공하는 연락처가 있는 경우 해당 정보\n2. 운영자 계정: 이메일 주소, 비밀번호(암호화 저장), 이름(선택), 접속·로그인 일시\n\n공개 사이트는 별도의 회원가입 절차가 없으며, 일반 방문자의 열람만으로는 개인정보가 수집되지 않습니다."],
      ["제3조 (개인정보의 처리 및 보유 기간)",
        "회사는 법령에 따른 보유 의무가 없는 한, 개인정보의 처리 목적이 달성되면 지체 없이 파기합니다.\n1. 문의 정보: 문의 응대 목적 달성 후 파기(자동 삭제 절차가 없으므로 정기 점검 또는 정보주체의 삭제 요청 시 파기)\n2. 운영자 계정: 계정 삭제 시 연동 정보와 함께 즉시 파기"],
      ["제4조 (개인정보의 제3자 제공)",
        "회사는 이용자의 개인정보를 제1조의 목적 범위를 넘어 제3자에게 제공하지 않습니다. 다만 정보주체의 사전 동의가 있거나 법령에 특별한 규정이 있는 경우에 한하여 제공할 수 있습니다."],
      ["제5조 (개인정보 처리의 위탁)",
        "회사는 안정적인 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.\n· Supabase — 데이터베이스·인증·이미지 스토리지 호스팅 (서버 위치: 대한민국 서울 리전)\n· Resend — 문의 알림 이메일 발송 (이름·이메일·문의 내용 전달)\n· Vercel — 애플리케이션 호스팅 및 서비스 운영\n\n참고: 사진 자동 캡션·검색 색인 생성에 OpenAI를 이용하나, 이는 운영자가 등록한 콘텐츠(사진·설명)에 한하며 이용자가 제출한 개인정보는 전송되지 않습니다."],
      ["제6조 (개인정보의 국외 이전)",
        "위탁에 따라 일부 개인정보가 국외로 이전될 수 있습니다.\n· 이전받는 자: Resend, Inc.(미국) — 이전 항목: 이름·이메일·문의 내용 / 이전 목적: 문의 알림 이메일 발송\n· 이전받는 자: Vercel Inc.(미국) — 이전 항목: 서비스 접속·운영 로그 / 이전 목적: 애플리케이션 호스팅\n이전 시기 및 방법: 서비스 이용 시점에 정보통신망을 통해 전송됩니다. 정보주체는 국외 이전을 거부할 수 있으며, 이 경우 관련 문의 접수가 제한될 수 있습니다."],
      ["제7조 (정보주체의 권리·의무 및 행사 방법)",
        "정보주체는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있습니다. 요청은 아래 개인정보 보호책임자에게 서면·이메일로 접수할 수 있으며, 회사는 지체 없이 조치합니다."],
      ["제8조 (개인정보의 안전성 확보 조치)",
        "회사는 개인정보의 안전성 확보를 위해 다음 조치를 취합니다.\n· 접근 권한 관리: 역할 기반 접근 제어(RBAC) 및 행 수준 보안(RLS) 적용\n· 전송 구간 암호화: 전 구간 HTTPS 통신\n· 인증 정보 보호: 비밀번호 암호화 저장\n· 최소 수집: 목적 달성에 필요한 최소한의 항목만 수집"],
      ["제9조 (쿠키 등 자동 수집 장치의 운영)",
        "공개 사이트는 방문자에 대해 쿠키를 사용하지 않으며, 분석·광고 목적의 추적 장치를 운영하지 않습니다. 운영자 전용 관리자(CMS) 화면에서만 로그인 유지를 위한 인증 세션 쿠키를 사용합니다."],
      ["제10조 (개인정보 보호책임자)",
        "개인정보 처리에 관한 문의·불만·피해 구제는 아래로 접수할 수 있습니다.\n· 개인정보 보호책임자: 디자인포퍼블릭 운영팀\n· 이메일: d4p@design4public.com\n· 전화: 031-599-2662\n\n기타 개인정보 침해에 대한 상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118) 등에 문의할 수 있습니다."],
      ["제11조 (개인정보처리방침의 변경)",
        "본 방침은 법령·서비스의 변경에 따라 개정될 수 있으며, 변경 시 사이트를 통해 공지하고 시행일을 명시합니다.\n· 시행일: 2026년 7월 5일"],
    ],
  },
  terms: {
    title: "이용약관",
    lead: "본 약관은 디자인포퍼블릭(design4public, 이하 ‘회사’)이 제공하는 공공조달 가구 카탈로그 서비스의 이용 조건과 절차, 회사와 이용자의 권리·의무를 규정합니다.",
    sections: [
      ["제1조 (목적)",
        "본 약관은 회사가 제공하는 카탈로그 서비스(이하 ‘서비스’)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다."],
      ["제2조 (정의)",
        "1. ‘서비스’란 회사가 제공하는 프로젝트·아이템·브랜드·포토 카탈로그 및 문의 등 부가 기능을 말합니다.\n2. ‘이용자’란 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 자를 말합니다.\n3. ‘운영자’란 콘텐츠 등록·관리 권한을 부여받은 회사의 내부 관리자를 말합니다."],
      ["제3조 (약관의 효력 및 변경)",
        "본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일과 함께 사이트에 공지합니다."],
      ["제4조 (서비스의 제공 및 변경)",
        "1. 서비스는 공공조달 가구 납품 사례와 제품·브랜드 정보를 열람할 수 있는 무료 카탈로그로 제공됩니다.\n2. 회사는 운영상·기술상 필요에 따라 서비스의 내용을 변경하거나 점검을 위해 일시 중단할 수 있습니다."],
      ["제5조 (서비스 이용)",
        "1. 이용자는 별도의 회원가입 없이 카탈로그를 열람할 수 있습니다.\n2. 문의하기 기능 이용 시 이용자는 정확한 정보를 제공하여야 하며, 제출한 개인정보는 개인정보처리방침에 따라 처리됩니다.\n3. 실제 제품 구매·조달은 본 서비스가 아닌 나라장터 등 외부 조달 경로를 통해 이루어집니다."],
      ["제6조 (콘텐츠의 저작권 및 지식재산권)",
        "1. 서비스에 게시된 프로젝트·제품·브랜드 이미지 및 정보의 저작권은 해당 브랜드·제조사 또는 프로젝트 권리자 등 각 권리자에게 있으며, 회사는 공공조달 납품 사례 소개를 위해 이를 정리·게재합니다.\n2. 이용자는 권리자의 동의 없이 서비스의 콘텐츠를 복제·배포·전송·크롤링하거나 상업적으로 이용할 수 없습니다."],
      ["제7조 (이용자의 의무)",
        "이용자는 서비스 이용 시 관련 법령과 본 약관을 준수하여야 하며, 무단 복제, 부정 접근, 시스템에 부하를 주는 행위, 기타 서비스의 정상적 운영을 방해하는 행위를 하여서는 안 됩니다."],
      ["제8조 (외부 링크)",
        "서비스는 나라장터 등 제3자가 운영하는 외부 사이트로 연결되는 링크를 포함할 수 있습니다. 회사는 외부 사이트의 내용·거래에 대해 관리하지 않으며 이에 대한 책임을 지지 않습니다."],
      ["제9조 (면책 조항)",
        "1. 회사는 게재된 정보의 정확성을 위해 노력하나, 정보의 완전성·최신성을 보증하지 않습니다.\n2. 회사는 천재지변, 불가항력, 이용자의 귀책 사유 또는 외부 링크로 인해 발생한 손해에 대하여 책임을 지지 않습니다."],
      ["제10조 (준거법 및 관할)",
        "본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생한 경우 관할은 민사소송법에 따른 법원으로 합니다.\n· 시행일: 2026년 7월 5일"],
    ],
  },
};
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && echo "TSC=0"
grep -c "privacy@design4public.kr" components/site/legal.tsx    # expect 0 (unified to d4p@)
grep -c "2026.01.01" components/site/legal.tsx                   # expect 0 (old date gone)
git add components/site/legal.tsx
git commit -m "feat(m13): full Korean privacy policy + terms of service (effective 2026-07-05)"
```
Expected: tsc 0; no placeholder email/date remains. Rendering (line breaks via `pre-line`, both pages) confirmed in Task 10.

---

### Task 9: E2E / test selector adjustments

Audit the specs for selectors invalidated by Tasks 3–8 and update only those. Most changes are metadata/style/content and do not touch the selectors the suite uses, but three areas need a check.

**Files:** whichever specs a grep in Step 1 flags (expected: none for image/legal; verify).

- [ ] **Step 1: Grep for at-risk selectors**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
# (a) H1 hero words — MUST still pass (we changed only <title>, not H1). Confirm the specs target the heading:
grep -rn "getByRole('heading'.*name: '\(PROJECTS\|ITEMS\|BRANDS\|PHOTOS\)'" tests/e2e/site
# (b) any spec asserting an exact <img src> / supabase URL on a PUBLIC page (would break on next/image):
grep -rn "img\[src\|getByRole('img'\|/storage/v1/object" tests/e2e/site
# (c) any spec asserting legal page text / revision date:
grep -rn "개정일\|개인정보처리방침\|이용약관\|privacy\|terms" tests/e2e
```

- [ ] **Step 2: Apply the (small) fixes**

- (a) The site H1 specs (`projects.spec.ts:6`, `photos.spec.ts:6`, and the items/brands equivalents) assert the hero H1 (`PROJECTS`/`PHOTOS`/…). Task 3/6 deliberately kept those H1s — **no change needed**; confirm they still match. If any spec instead asserted `toHaveTitle('PROJECTS…')` (the `<title>`), update it to the new Korean title string.
- (b) If a public site spec matches a raw Supabase `<img src>`, relax it to target the image by role/alt (`getByRole('img', { name: … })`) since `next/image` rewrites `src` to `/_next/image?url=…`. (Admin specs — `photo-upload.spec.ts` etc. — are unaffected; admin `<img>` was not converted.)
- (c) No legal E2E spec exists today (grep returns nothing) — nothing to update. If one appears, align it to the new section headings.

- [ ] **Step 3: Typecheck + commit (validation is in Task 10)**

```bash
npx tsc --noEmit && echo "TSC=0"
git add tests/e2e 2>/dev/null && git commit -m "test(m13): align E2E selectors to metadata/image changes" || echo "no spec changes needed"
```

---

### Task 10: Final gate — single-agent full-stack green run + deploy note

Run the full gate in **one agent sitting** (one-agent-stack) with the Kong restart. Fix-forward only; re-run the whole gate after any fix.

**Files:** none modified (gate).

- [ ] **Step 1: Static gate**

```bash
npx tsc --noEmit && echo "TSC=PASS"
npm run lint 2>&1 | tail -3                       # 0 warnings / 0 errors
grep -rc "@next/next/no-img-element" app components | grep -v ':0'   # exactly ONE (gallery lightbox)
npx vitest run 2>&1 | tail -8                      # ~123 (117 + pg-filter/list-query); record exact
```

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1 | tail -25
```
Expected: build succeeds; `next/image` routes compile; `/projects` shows as ISR (revalidate) not `ƒ` dynamic.

- [ ] **Step 3: Start stack + reset (with Kong) via the new script**

```bash
npx supabase start 2>&1 | tail -3
npm run db:reset 2>&1 | tail -6     # reset + Kong restart + gen:types (Task 2 script)
git diff --stat lib/database.types.ts   # expect NO change (schema unchanged; postprocess idempotent)
```
Expected: stack up, migrations+seed applied, Kong restarted, types byte-identical (no DB change this milestone).

- [ ] **Step 4: Full Playwright ×2 (live)**

```bash
npx playwright test 2>&1 | tail -12
npx playwright test 2>&1 | tail -12
```
Expected: **74 passed** both times. A failure in the item-aspect / next/image area means a selector or layout regressed — root-cause it (do not re-run away).

- [ ] **Step 5: Live visual QA (manual checklist, per `docs/qa-checklist.md`)**

- Item cards + item detail hero square (1:1); project/brand/photo imagery unchanged.
- No stacked/broken carousels (DetailHero, project masthead, featured hero); no CLS on brand cover / photo detail (priority images).
- Public type scale visibly larger; item spec sheet (110px label column) and project-masthead nav overlay not clipped/awkward.
- `/privacy` + `/terms` render full text with line breaks; effective date 2026. 07. 05.; footer/legal contact is d4p@design4public.com.
- View-source a detail page: canonical/og:url = `https://www.design4public.com/…`; JSON-LD intact.

- [ ] **Step 6: Commit + push (Vercel auto-deploys on merge to main)**

```bash
git add -A
git commit -m "chore(m13): maintenance/optimization/legal — gate green" || echo "nothing to commit"
git push -u origin unify/m13-maintenance
```
Open the PR against `main`. **PR description must include:** (1) the lawyer-review + named-DPO disclaimer for the legal pages (Task 8) — this belongs in the PR, not on the public pages; (2) the confirmed gate numbers (tsc 0, lint 0, vitest exact, playwright 74×2); (3) the two intentional behavior deltas (`/projects` ISR+client-filter; item images 1:1). Production deploys automatically when the PR merges to `main` (Vercel); no manual deploy step.

---

## Self-Review

**Spec coverage — user requirements (both inputs):**
1. Harness/docs for non-frontier maintainers — Task 2 (AGENTS.md, CLAUDE.md facts, qa-checklist rewrite, spec fix, recipes.md env+entity, `db:reset`+`gate` scripts). ✓ (2 automations, exactly as audit recommended.)
2. Review-and-apply: readability + robust architecture — Task 3 (helpers + /projects caching); image optimization — Tasks 4–5; SEO — Task 6. ✓
3. Item photos 1:1 (detail + thumbnail cards only; others unchanged) — Task 4 (ItemCard + DetailHero + thumb strip; project/brand/photo untouched). ✓
4. Type scale up one Material step — Task 7 (tokens + 6 class px + inline literals; explicit before/after; admin excluded with rationale). ✓
5. Full Korean 개인정보처리방침 + 이용약관 정식판, effective 2026-07-05, PIPA structure, lawyer disclaimer in PR — Task 8 (complete text, no placeholders). ✓

**Placeholder scan:** none. Every task carries exact files, complete code/content (both legal documents in full, both helpers in full, the full conversion table, the full token/literal mapping). No "TBD"/"similar to above".

**Type consistency:** new helpers are pure and unit-tested (Task 3); enum/type surfaces untouched; `createPageMetadata` reused for `/projects` metadata; tsc gates every task.

**Key decisions:**
- **zod: NO** — the two concrete input-validation defects are fixed with a ~15-line escaping helper + the existing sort allowlist; zod would be an unbounded new-dependency refactor.
- **Admin typography: NO bump** — public site only; admin CMS density risk, and the complaint was about public "users."
- **Which images stay raw: one** — the Gallery lightbox (`components/site/gallery.tsx`, no determinate-size parent); its documented `no-img-element` disable is retained. The two 42px search thumbnails ARE converted (low ROI but safe) so all other disables drop.
- **Canonical host: www** (apex 307-redirects). **Legal contact: d4p@design4public.com** (drop the `.kr` placeholder).

**Dropped audit items (low value / over-reach, with one-line reasons):**
- Upload-folder allowlist (arch, low) — auth-gated, Supabase-sandboxed; not worth the surface. 
- `naraUrl`/`mallUrl` naming drift (arch, low) — cosmetic; fold into a future item-form change.
- Public catalog full-dataset client filtering (arch, low) — audit itself says "no action needed now."
- Kong-restart 4-way de-duplication (harness, low) — CLAUDE.md is already concise; churn risk outweighs benefit (the `db:reset` script is the real fix).
- PR/commit convention doc (harness, low) — audit says skip for a single-maintainer repo.
- Sitemap list-route `lastmod` (SEO, low) — only the legal-page fixed dates are worth it (done in Task 6); list routes left as-is.
- Admin CLS on `photos/[photo_id]/edit` image (image, low) — admin-only, no Core Web Vitals stakes; out of scope.

**Expected gate baselines (new):** tsc 0 · lint 0 warnings/0 errors (13 of 14 img disables removed, 1 remains) · vitest ~123 (117 + new pg-filter/list-query tests; seo.test value updated) · playwright 74×2 · no DB/migration change (types byte-identical after `db:reset`).

**Open questions:** none — all decisions resolved in-plan. The only external confirmation is that `www` is the Vercel primary domain (memory `d4p-deploy-facts`; audit curl-verified the apex→www redirect), checked in Task 6 Step 1 before the one-line change.
