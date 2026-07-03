# Milestone 10 — 검색 2단계: 이미지 내용 검색 (Image-Content Search) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make photos searchable by what they actually depict (interior scene, furniture, materials, colors, style) — not just their human-entered `title`/`alt_text`. Achieved by generating a Korean visual caption per photo with GPT-4o-mini vision, storing it on `photos.ai_caption`, folding it into the existing `search_source` composition, and letting the existing `text-embedding-3-small` + `hybrid_search` pipeline consume it. Zero new search infra, zero new vendor key.

**Architecture:** One additive migration adds two nullable columns (`photos.ai_caption`, `photos.ai_caption_model`) and `CREATE OR REPLACE`s the `search_source` view to append `ph.ai_caption` to the photo body expression (output columns unchanged). A new never-throws `lib/search/vision.ts#describePhoto(url)` calls GPT-4o-mini via the Chat Completions vision API and returns a Korean caption (null on no-key/failure). A new `lib/search/indexer.ts#captionAndReindexPhoto(id)` generates+stores the caption (when missing or when the image changed) then calls the **existing** `reindexEntity('photo', id)` — which already reads `search_source` and embeds `title+body`, so the caption flows into both the trigram body and the vector embedding with no read-path change. The photo PUT handler swaps its `reindexEntity('photo')` call for `captionAndReindexPhoto`. A resumable `scripts/backfill-captions.mjs` captions all photos missing `ai_caption`; the gate re-runs `backfill-search.mjs --all` to re-embed the caption-enriched bodies. Photo search results already exist in the M6 UI (the `photo` group in `/search` and the header dropdown), so no UI section is added — this milestone only enriches relevance.

**Tech Stack:** Next.js 15.5.20 App Router, React 19, Supabase (Postgres 15 + pgvector + pg_trgm), `@supabase/supabase-js` ^2.57, OpenAI GPT-4o-mini vision via `fetch` (Chat Completions, `image_url` content block) + existing `text-embedding-3-small` (1536-dim), Vitest 3 (unit), Playwright 1.55 (E2E), `pg` ^8 (backfill script).

---

## Rationale — Image-embedding provider decision (the one design decision)

**Hard constraint:** `OPENAI_API_KEY` is the only external key available (in `.env.local`; its value is never read by this plan). No local GPU, no Replicate/Vertex/HF/Cohere key.

**Verified fact (OpenAI docs, July 2026):** OpenAI has **no image-embedding endpoint**. `v1/embeddings` accepts text only (`text-embedding-3-small`/`-large`). Vision is served through `v1/chat/completions` (and `v1/responses`) by passing an `image_url` content block — the model returns *text*, not a vector. So a true image→vector CLIP embedding is impossible with an OpenAI key alone. (Sources: [Images and vision | OpenAI API](https://developers.openai.com/api/docs/guides/images-vision), [GPT-4o mini Model | OpenAI API](https://platform.openai.com/docs/models/gpt-4o-mini).)

**Chosen route — caption-then-text-embed (vision-to-text bridge):**
GPT-4o-mini vision → a structured Korean description of each photo (공간 유형 · 보이는 가구/조명/오브제 · 마감재 · 색감 · 스타일) → stored on `photos.ai_caption` → embedded by the **existing** `text-embedding-3-small` pipeline → lands in the **existing** `search_index` (`entity_type='photo'`) → served by the **existing** `hybrid_search` RPC.

Why this over alternatives:
- **Zero new infra / zero new key.** No second embedding column, no second HNSW index, no cross-modal query-time embedding, no new vendor. It reuses `search_source` → `reindexEntity` → `search_index` → `hybrid_search` untouched. The only schema delta is two additive nullable columns.
- **Both search branches benefit.** The caption enters the trigram `body` (Korean substring/`similarity()` matches like "가죽 소파", "우드 톤") **and** the vector embedding (semantic matches). A raw CLIP vector would only help the vector branch and would need a whole parallel query path.
- **CMS-reviewable.** A human-readable Korean caption on a real column means content managers can later read/correct it (spec §7 keeps `search_source` as the single composition truth; the caption is just another text input to it). A 768-float CLIP vector is opaque.
- **Cost is negligible at this scale.** Dataset is "수백 행" (spec §12). GPT-4o-mini vision at `detail:'low'` is a flat ~85-token image cost per photo; captioning the whole library is a one-time cents-scale backfill.

**Where the caption lives — decided: additive column, not caption-only-in-`search_index`.** `photos.ai_caption` (+ `photos.ai_caption_model` for provenance/regeneration) rather than stuffing the text only into `search_index.body`. Reasons: (1) `search_index` is *derived* data that is dropped and rebuilt from `search_source` (migration header, line 4) — a caption stored only there is destroyed on every rebuild/backfill and would have to be regenerated (paid) each time; a column survives. (2) CMS visibility — a column is queryable/editable; a derived-index field is not. (3) It keeps `search_source` the single source of truth: the view reads `ph.ai_caption` like any other photo field.

**Deferred (FUTURE upgrade, NOT in this milestone) — true cross-modal CLIP.** A genuine image-vector path (e.g. Replicate `CLIP ViT-L/14`, 768-dim) would add: an additive `search_index.embedding_clip vector(768)` column, a second HNSW cosine index, an image→vector backfill, and a **query-time image/text→CLIP embedding** third branch fused into `hybrid_search`'s RRF. It requires a **new vendor key** (`REPLICATE_API_TOKEN` or equivalent) and a GPU-backed endpoint, so it is out of scope until such a key exists. The caption route chosen here is forward-compatible: adding a CLIP branch later does not remove `ai_caption` (they stack). No tasks below implement this.

---

## Global Constraints

- Branch from `unify/m9-next15`; new branch `unify/m10-clip-search`. This repo is checked out at `/Users/jaehwanlee/development/d4p/design4public-frontend`. Do **not** switch to any other branch during implementation.
- **Do NOT bump `next`/`react`/`react-dom`.** Stay on `next@15.5.20`, `react@^19` (19.2.x), `react-dom@^19`. No dependency-version changes at all — this milestone adds only source files, one migration, and one npm script.
- **Additive migrations only.** New migration timestamp **≥ `20260703160000`** (after `20260703150000_public_grants.sql`, the current latest). It DROPs nothing: `add column if not exists` + `create or replace view` (same output columns). Production DB is untouchable until the M7 cutover; this migration must apply cleanly to production later.
- **`OPENAI_API_KEY` is the only external key.** Every OpenAI call (vision *and* embedding) is **never-throws** (returns `null` on no-key/failure) and uses **`cache: 'no-store'`** — a cached transient failure must never pin a photo to "no caption" or a query to trigram-only with no self-heal window. This mirrors `lib/search/embedding.ts`.
- **One-agent-stack gate.** Only the final gate task (Task 7) touches the local Supabase stack. Do not `supabase start`/`db reset` in earlier tasks except the single migration-apply check in Task 1 (which the implementer may run once; it does not need Playwright).
- **`supabase db reset` breaks Kong auth.** After a reset, Kong holds a stale GoTrue upstream and returns **502 on `/auth/v1/*`**, which fails admin-authenticated Playwright specs. The gate MUST run `docker restart supabase_kong_design4public` after every `db reset`, before Playwright. This is baked into Task 7's commands.
- **`gen:types` WARNING — do NOT run `npm run gen:types`.** Regenerating `lib/database.types.ts` drops the 6 manual alias exports + the `profiles` narrowing (M6 lesson, `.superpowers/sdd/progress.md`). The two new `photos` columns are added to the committed types **by hand** in Task 1 instead. If types ever get regenerated, the 6 aliases + `profiles` narrowing + these two columns must all be re-applied.
- **Service-role boundary (M8).** Caption writes and reindex use `supabaseAdmin` (service role) and are `server-only`, exactly like the existing `reindexEntity`. Route-level authz stays `requireRole('content_manager')`. Do not widen any RLS policy.
- **Never weaken the gate.** No `// @ts-expect-error`, `eslint-disable`, `test.skip`, `as any`, or tsconfig/eslint loosening to pass. Narrow casts (`as unknown as {…}`) are acceptable only where the codebase already uses them (see `lib/search/query.ts`). If a real incompatibility surfaces, STOP and report.
- **Test-mock hygiene.** Vitest specs reset with `afterEach` (not `beforeEach` — vitest 3.2.x throwing-mock quirk, house standard). New `fetch`-mocking specs follow `tests/unit/lib/search/embedding.test.ts` exactly (`afterEach` restores `OPENAI_API_KEY`, `vi.restoreAllMocks()`, `vi.unstubAllGlobals()`).

---

## File Structure

Files created or modified in this milestone:

- **Create** `supabase/migrations/20260703160000_photo_captions.sql` — `photos.ai_caption`/`ai_caption_model` columns + `create or replace view public.search_source` (photo body gains `ph.ai_caption`).
- **Modify** `lib/database.types.ts` — **by hand**: add `ai_caption`/`ai_caption_model` to `photos` Row/Insert/Update (no `gen:types`).
- **Create** `lib/search/vision.ts` — `describePhoto(imageUrl)`: GPT-4o-mini vision → Korean caption, never-throws, `cache:'no-store'`.
- **Create** `tests/unit/lib/search/vision.test.ts` — unit tests (mocked `fetch`, `afterEach` reset).
- **Modify** `lib/search/indexer.ts` — add `captionAndReindexPhoto(id, opts)`; `reindexEntity` unchanged.
- **Create** `tests/unit/lib/search/indexer-caption.test.ts` — unit tests for `captionAndReindexPhoto`.
- **Modify** `app/api/admin/photos/[photo_id]/route.ts` — PUT swaps `reindexEntity('photo', …)` → `captionAndReindexPhoto(…, { regenerate: imageUrl !== undefined })`.
- **Modify** the photo-PUT vitest spec (if one mocks the indexer — verify in Task 4) — mock `captionAndReindexPhoto`.
- **Create** `scripts/backfill-captions.mjs` — resumable, rate-limit-aware caption backfill; skips photos that already have `ai_caption`.
- **Modify** `package.json` — add `"backfill:captions"` script (no dependency changes).
- **Modify** `supabase/seed.sql` — set one seeded photo's `ai_caption` to a deterministic Korean string (proves the `ai_caption → search_source → search_index → hybrid_search` wiring with **no** OpenAI dependency).
- **Modify** `tests/e2e/site/search.spec.ts` — one spec asserting the seeded caption makes its photo findable; confirms photo search degrades gracefully when the caption/embedding is absent.

No changes to `hybrid_search`, `search_index`, `lib/search/embedding.ts`, `lib/search/query.ts`, `scripts/backfill-search.mjs`, or any search UI component.

---

### Task 1: Branch + additive migration (caption columns + `search_source` view) + hand-edited types

**Files:**
- Create: `supabase/migrations/20260703160000_photo_captions.sql`
- Modify: `lib/database.types.ts` (by hand — no `gen:types`)

**Interfaces:**
- Produces: `photos.ai_caption text` + `photos.ai_caption_model text` (nullable); `search_source` photo `body` now includes `ph.ai_caption`.
- Consumed by: Task 3 (`captionAndReindexPhoto` writes the columns; `reindexEntity` reads the enriched body), Task 5 (backfill).

- [ ] **Step 1: Create the branch from `unify/m9-next15`**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git checkout unify/m9-next15
git pull --ff-only 2>/dev/null || true
git checkout -b unify/m10-clip-search
```

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/20260703160000_photo_captions.sql` with exactly:

```sql
-- M10: image-content search. ADDITIVE ONLY — adds an AI-generated Korean visual
-- caption to photos and folds it into the search_source composition so the
-- existing text-embedding + hybrid_search pipeline searches on what a photo
-- depicts. Drops nothing; safe to apply to production at the M7 cutover.
-- (OpenAI has no image-embedding endpoint — the caption is the vision→text
-- bridge into the existing 1536-dim text embedding. See docs/plans M10.)

-- Additive columns -------------------------------------------------------
-- ai_caption: GPT-4o-mini vision description (공간/가구/마감재/색감/스타일).
-- ai_caption_model: provenance so a future model bump can target re-captioning.
alter table public.photos add column if not exists ai_caption text;
alter table public.photos add column if not exists ai_caption_model text;

-- Recompose search_source: the ONLY change is the photo branch's body, which now
-- includes ph.ai_caption. All four branches and the output column list are
-- restated verbatim from 20260703120000_search_index.sql (create-or-replace
-- requires the identical column set/order). Nothing else changes.
create or replace view public.search_source as
  select
    'project'::text as entity_type,
    p.id as entity_id,
    p.slug,
    p.title,
    concat_ws(' ',
      p.title, p.description, p.location, p.client,
      (select string_agg(distinct c.name, ' ')
         from public.project_categories pc
         join public.categories c on c.id = pc.category_id
        where pc.project_id = p.id),
      (select string_agg(distinct i.name, ' ')
         from (
           select item_id from public.project_items where project_id = p.id
           union
           select ph_i.item_id
             from public.project_photos pp
             join public.photo_items ph_i on ph_i.photo_id = pp.photo_id
            where pp.project_id = p.id
         ) links
         join public.items i on i.id = links.item_id)
    ) as body,
    (select ph.image_url
       from public.project_photos pp
       join public.photos ph on ph.id = pp.photo_id
      where pp.project_id = p.id
      order by pp.is_main desc nulls last, pp."order" asc nulls last
      limit 1) as image_url
  from public.projects p
  where p.status = 'published'

  union all
  select
    'item'::text, i.id, i.slug, i.name,
    concat_ws(' ',
      i.name, i.description, b.name_ko, b.name_en,
      (select string_agg(distinct c.name, ' ')
         from public.item_categories ic
         join public.categories c on c.id = ic.category_id
        where ic.item_id = i.id)
    ),
    (select ph.image_url
       from public.photo_items pit
       join public.photos ph on ph.id = pit.photo_id
      where pit.item_id = i.id
      order by pit.is_main desc nulls last, pit."order" asc nulls last
      limit 1)
  from public.items i
  left join public.brands b on b.id = i.brand_id
  where i.status <> 'hidden'

  union all
  select
    'brand'::text, b.id, b.slug, b.name_ko,
    concat_ws(' ', b.name_ko, b.name_en, b.description),
    coalesce(b.cover_image_url, b.logo_image_url)
  from public.brands b

  union all
  select
    'photo'::text, ph.id, null::text, coalesce(ph.title, ph.alt_text, ''),
    concat_ws(' ',
      ph.title, ph.alt_text, ph.description, ph.ai_caption,
      (select string_agg(distinct pr.title, ' ')
         from public.project_photos pp
         join public.projects pr on pr.id = pp.project_id
        where pp.photo_id = ph.id and pr.status = 'published'),
      (select string_agg(distinct it.name, ' ')
         from public.photo_items pit
         join public.items it on it.id = pit.item_id
        where pit.photo_id = ph.id)
    ),
    ph.image_url
  from public.photos ph
  where exists (
    select 1 from public.project_photos pp
    join public.projects pr on pr.id = pp.project_id
    where pp.photo_id = ph.id and pr.status = 'published'
  );

-- search_source grants are unchanged by create-or-replace, but restate to be safe.
revoke all on public.search_source from anon, authenticated;
grant select on public.search_source to service_role;
```

> The **only** substantive edit vs. M6's view is `ph.ai_caption` inserted into the photo branch's `concat_ws` (line beginning `ph.title, ph.alt_text, ph.description, ph.ai_caption,`). Restate the whole view verbatim — `create or replace view` cannot alter a subset.

- [ ] **Step 3: Hand-edit `lib/database.types.ts` (NO `gen:types`)**

In `lib/database.types.ts`, the `photos:` block (around line 348). Add `ai_caption` and `ai_caption_model` to all three shapes, alphabetically placed to match generator output:

Row (insert after `alt_text`):
```ts
        Row: {
          ai_caption: string | null
          ai_caption_model: string | null
          alt_text: string | null
```
Insert (insert after `alt_text`):
```ts
        Insert: {
          ai_caption?: string | null
          ai_caption_model?: string | null
          alt_text?: string | null
```
Update (insert after `alt_text`):
```ts
        Update: {
          ai_caption?: string | null
          ai_caption_model?: string | null
          alt_text?: string | null
```
Leave the rest of the `photos` block (and the whole file) untouched. Do **not** run `npm run gen:types`.

- [ ] **Step 4: Apply the migration locally and verify (single db reset — allowed here)**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
supabase db reset 2>&1 | tail -8
```
Expected: reset applies `20260703000000` → `20260703120000` → `20260703140000` → `20260703150000` → `20260703160000_photo_captions.sql` → `seed.sql` with **no** SQL error, ending `Finished supabase db reset`.

Verify the column + view wiring:
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c \
  "select column_name from information_schema.columns where table_name='photos' and column_name like 'ai_caption%' order by 1;"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c \
  "update public.photos set ai_caption='가죽 소파와 우드 마감 라운지' where id='55555555-0000-0000-0000-000000000001';
   select body ilike '%가죽 소파%' as caption_in_body from public.search_source where entity_type='photo' and entity_id='55555555-0000-0000-0000-000000000001';"
```
Expected: two rows (`ai_caption`, `ai_caption_model`); `caption_in_body = t`. (This is a throwaway probe — the seed fixture is set properly in Task 6; a subsequent `db reset` clears this manual update.)

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit && echo "TSC=PASS"
git add supabase/migrations/20260703160000_photo_captions.sql lib/database.types.ts
git commit -m "feat(m10): photos.ai_caption columns + search_source view; hand-edit types"
```
Expected: `TSC=PASS` (the two new nullable columns are backward-compatible; no consumer breaks).

---

### Task 2: `lib/search/vision.ts` — GPT-4o-mini caption generator (never-throws)

Mirrors `lib/search/embedding.ts`: single `fetch`, no SDK, `cache:'no-store'`, returns `null` on no-key/failure so every caller degrades gracefully.

**Files:**
- Create: `lib/search/vision.ts`
- Create: `tests/unit/lib/search/vision.test.ts`

**Interfaces:**
- Produces: `describePhoto(imageUrl: string): Promise<string | null>` and `export const VISION_MODEL`.
- Consumes: `process.env.OPENAI_API_KEY`; OpenAI `v1/chat/completions` with an `image_url` content block.

- [ ] **Step 1: Write `lib/search/vision.ts`**

```ts
// GPT-4o-mini vision → a Korean visual caption for a photo (spec §7 image search).
// OpenAI has NO image-embedding endpoint, so we bridge image→text here and let the
// existing text-embedding-3-small pipeline (lib/search/embedding.ts) vectorize the
// caption. Graceful by contract: returns null whenever OPENAI_API_KEY is absent or
// the call fails, so indexing falls back to the human-entered photo text. No SDK —
// a single fetch keeps the bundle lean and works in Node routes and the mjs backfill.
export const VISION_MODEL = 'gpt-4o-mini'

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// One-shot instruction: a compact Korean description optimized for search recall,
// not prose. Enumerates the search-relevant facets so captions are consistent.
const PROMPT = [
  '이 인테리어/공간 사진을 한국어로 검색에 활용할 수 있게 묘사해줘.',
  '다음을 한 문단으로: 공간 유형(예: 오피스 라운지, 주방), 보이는 가구·조명·오브제,',
  '주요 마감재(우드/메탈/패브릭/석재 등), 색감, 전체 스타일(모던/미니멀/인더스트리얼 등).',
  '추측성 브랜드명은 넣지 말고 보이는 것만. 80~120자 이내, 마침표로 끝맺기.',
].join(' ')

/** Describe a photo for search. null on no-key/failure. Never throws. */
export async function describePhoto(imageUrl: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !imageUrl) return null

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              // detail:'low' downsamples to a flat ~85-token image cost — plenty for
              // a scene/material caption and keeps the whole-library backfill cheap.
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
      // Same rationale as embedding.ts: never let Next's Data Cache pin a transient
      // failure — a cached null would leave the photo permanently un-captioned.
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[vision] OpenAI error', res.status, await res.text().catch(() => ''))
      return null
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = json.choices?.[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch (err) {
    console.error('[vision] fetch failed', err)
    return null
  }
}
```

- [ ] **Step 2: Write `tests/unit/lib/search/vision.test.ts`** (follow `embedding.test.ts` exactly)

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { describePhoto } from '@/lib/search/vision'

const OLD_KEY = process.env.OPENAI_API_KEY

afterEach(() => {
  process.env.OPENAI_API_KEY = OLD_KEY
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('describePhoto', () => {
  it('returns null when OPENAI_API_KEY is unset (no fetch)', async () => {
    delete process.env.OPENAI_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for an empty image url (no fetch)', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await describePhoto('')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the trimmed caption text on success', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '  모던 오피스 라운지, 우드 톤 가구.  ' } }] }),
      }),
    )
    expect(await describePhoto('https://img/1.jpg')).toBe('모던 오피스 라운지, 우드 톤 가구.')
  })

  it('returns null (never throws) on a non-ok response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' }),
    )
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })

  it('returns null (never throws) when fetch rejects', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })

  it('returns null when the response has no content', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }))
    expect(await describePhoto('https://img/1.jpg')).toBeNull()
  })
})
```

- [ ] **Step 3: Run the new spec + typecheck**

```bash
npx vitest run tests/unit/lib/search/vision.test.ts 2>&1 | tail -12
npx tsc --noEmit && echo "TSC=PASS"
```
Expected: 6 passed; `TSC=PASS`.

- [ ] **Step 4: Commit**

```bash
git add lib/search/vision.ts tests/unit/lib/search/vision.test.ts
git commit -m "feat(m10): describePhoto — GPT-4o-mini Korean caption, never-throws"
```

---

### Task 3: `captionAndReindexPhoto` in `lib/search/indexer.ts`

Generate+store the caption (when missing, or forced on image change), then call the **existing** `reindexEntity('photo', id)` — which re-reads `search_source` (now caption-enriched) and re-embeds. `reindexEntity` is **unchanged**.

**Files:**
- Modify: `lib/search/indexer.ts` (append one function + one import)
- Create: `tests/unit/lib/search/indexer-caption.test.ts`

**Interfaces:**
- Produces: `captionAndReindexPhoto(photoId: string, opts?: { regenerate?: boolean }): Promise<void>` — never throws.
- Consumes: `describePhoto` (Task 2), `supabaseAdmin`, existing `reindexEntity`.

- [ ] **Step 1: Add the import and function to `lib/search/indexer.ts`**

Add to the imports at the top (after the existing `import { embedText } from './embedding'`):
```ts
import { describePhoto, VISION_MODEL } from './vision'
```

Append at the end of the file:
```ts
/**
 * Ensure a photo has an AI caption, then reindex it. The caption is generated only
 * when it is missing OR `regenerate` is set (image changed) — captioning is a paid
 * vision call, so we don't repeat it on every unrelated edit. On no-key/failure the
 * caption stays null and reindex proceeds on the human-entered photo text (graceful
 * degradation — same contract as reindexEntity). Never throws.
 *
 * The caption is written to photos.ai_caption, which search_source folds into the
 * photo body (migration 20260703160000), so the subsequent reindexEntity('photo')
 * picks it up for BOTH the trigram body and the vector embedding with no extra step.
 */
export async function captionAndReindexPhoto(
  photoId: string,
  opts: { regenerate?: boolean } = {},
): Promise<void> {
  try {
    const { data: photo } = await supabaseAdmin
      .from('photos')
      .select('image_url, ai_caption')
      .eq('id', photoId)
      .maybeSingle()

    if (photo?.image_url && (opts.regenerate || !photo.ai_caption)) {
      const caption = await describePhoto(photo.image_url)
      if (caption) {
        await supabaseAdmin
          .from('photos')
          .update({ ai_caption: caption, ai_caption_model: VISION_MODEL })
          .eq('id', photoId)
      }
    }
  } catch (err) {
    console.error('[search] captionAndReindexPhoto caption step failed', photoId, err)
  }
  // Always reindex (itself never-throws) — a caption failure must not skip indexing.
  await reindexEntity('photo', photoId)
}
```

- [ ] **Step 2: Write `tests/unit/lib/search/indexer-caption.test.ts`**

Mock `supabaseAdmin`, `./vision`, and `./embedding` so no network/DB is touched. Assert the generate/skip branches and that `reindexEntity` (via the mocked admin `upsert`) always runs.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A chainable Supabase mock: from().select().eq().maybeSingle() and
// from().update().eq() and from().upsert()/delete() used by reindexEntity.
const photoRow = { image_url: 'https://img/1.jpg', ai_caption: null as string | null }
const maybeSingle = vi.fn(async () => ({ data: photoRow, error: null }))
const updateEq = vi.fn(async () => ({ error: null }))
const update = vi.fn(() => ({ eq: updateEq }))
const upsert = vi.fn(async () => ({ error: null }))
// reindexEntity reads search_source then upserts search_index; give it a row.
const sourceMaybeSingle = vi.fn(async () => ({
  data: { entity_type: 'photo', entity_id: 'p1', slug: null, title: 't', body: 'b', image_url: 'u' },
  error: null,
}))

const from = vi.fn((table: string) => {
  if (table === 'search_source') {
    return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: sourceMaybeSingle }) }) }) }
  }
  if (table === 'search_index') {
    return { upsert, delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }
  }
  // photos
  return {
    select: () => ({ eq: () => ({ maybeSingle }) }),
    update,
  }
})

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from } }))
const describePhoto = vi.fn(async () => '모던 라운지 캡션')
vi.mock('@/lib/search/vision', () => ({ describePhoto, VISION_MODEL: 'gpt-4o-mini' }))
vi.mock('@/lib/search/embedding', () => ({ embedText: vi.fn(async () => null) }))

import { captionAndReindexPhoto } from '@/lib/search/indexer'

beforeEach(() => {
  photoRow.ai_caption = null
})
afterEach(() => vi.clearAllMocks())

describe('captionAndReindexPhoto', () => {
  it('generates + stores a caption when missing, then reindexes', async () => {
    await captionAndReindexPhoto('p1')
    expect(describePhoto).toHaveBeenCalledWith('https://img/1.jpg')
    expect(update).toHaveBeenCalledWith({ ai_caption: '모던 라운지 캡션', ai_caption_model: 'gpt-4o-mini' })
    expect(upsert).toHaveBeenCalled() // reindexEntity ran
  })

  it('skips caption generation when one already exists and regenerate is false', async () => {
    photoRow.ai_caption = '기존 캡션'
    await captionAndReindexPhoto('p1')
    expect(describePhoto).not.toHaveBeenCalled()
    expect(upsert).toHaveBeenCalled() // still reindexes
  })

  it('regenerates when regenerate=true even if a caption exists', async () => {
    photoRow.ai_caption = '기존 캡션'
    await captionAndReindexPhoto('p1', { regenerate: true })
    expect(describePhoto).toHaveBeenCalled()
    expect(update).toHaveBeenCalled()
  })

  it('reindexes even when caption generation returns null (no store)', async () => {
    describePhoto.mockResolvedValueOnce(null)
    await captionAndReindexPhoto('p1')
    expect(update).not.toHaveBeenCalled()
    expect(upsert).toHaveBeenCalled()
  })
})
```

> If the chainable-mock shape drifts from how `reindexEntity` calls the client, align it to the real call chain in `lib/search/indexer.ts` (`from('search_source').select(...).eq('entity_type',…).eq('entity_id',…).maybeSingle()` and `from('search_index').upsert(..., { onConflict })`). Do not change `indexer.ts` to fit the mock.

- [ ] **Step 3: Run the spec + typecheck**

```bash
npx vitest run tests/unit/lib/search/indexer-caption.test.ts 2>&1 | tail -12
npx tsc --noEmit && echo "TSC=PASS"
```
Expected: 4 passed; `TSC=PASS`. The `photos.update({ ai_caption, ai_caption_model })` typechecks against the hand-edited `TablesUpdate<'photos'>` from Task 1.

- [ ] **Step 4: Commit**

```bash
git add lib/search/indexer.ts tests/unit/lib/search/indexer-caption.test.ts
git commit -m "feat(m10): captionAndReindexPhoto — caption then reindex, never-throws"
```

---

### Task 4: Wire the photo PUT handler to caption on save

**Files:**
- Modify: `app/api/admin/photos/[photo_id]/route.ts`
- Modify (if present): the vitest spec that exercises this route (verify in Step 1)

**Interfaces:**
- Consumes: `captionAndReindexPhoto` (Task 3). Regenerates the caption when the image itself changed (`imageUrl` present in the PUT body), otherwise only fills a missing caption.

- [ ] **Step 1: Check for an existing unit spec on this route**

```bash
grep -rln "photos/\[photo_id\]\|reindexEntity('photo'\|captionAndReindexPhoto" tests/unit tests/e2e
```
Note any vitest spec that imports/mocks `@/lib/search/indexer` for the photo route — it must mock `captionAndReindexPhoto` after Step 2 (the E2E `search-index.spec.ts` covers projects, not photos; the photo route may have no unit spec, in which case skip the spec edit).

- [ ] **Step 2: Swap the reindex call in the PUT handler**

In `app/api/admin/photos/[photo_id]/route.ts`:

Change the import (line 7) from:
```ts
import { reindexEntity, deleteFromIndex } from '@/lib/search/indexer'
```
to:
```ts
import { reindexEntity, deleteFromIndex, captionAndReindexPhoto } from '@/lib/search/indexer'
```
(`reindexEntity` import is retained only if still referenced elsewhere in the file — after this change the PUT no longer uses it; if the DELETE path uses only `deleteFromIndex`, drop `reindexEntity` from the import to avoid an unused-import lint error. Verify with the grep in Step 4.)

In `PUT`, replace line 59:
```ts
    await reindexEntity('photo', photo_id)
```
with:
```ts
    // Regenerate the caption when the image changed; otherwise fill only if missing.
    await captionAndReindexPhoto(photo_id, { regenerate: imageUrl !== undefined })
```
Leave the `revalidateEntity('photo')` call (line 58) and everything else unchanged. The DELETE handler's `deleteFromIndex('photo', …)` is untouched.

- [ ] **Step 3: Update the route's unit spec if one exists (from Step 1)**

If a vitest spec mocks `@/lib/search/indexer` for this route, add `captionAndReindexPhoto: vi.fn()` to that mock's returned object so the call is a no-op (mirrors how M6 mocked `reindexEntity` in the revalidation specs). If no such spec exists, skip.

- [ ] **Step 4: Verify no unused import + typecheck + lint**

```bash
grep -n "reindexEntity" app/api/admin/photos/[photo_id]/route.ts   # only in import + DELETE-adjacent if used
npx tsc --noEmit && echo "TSC=PASS"
npm run lint 2>&1 | tail -5
```
Expected: `TSC=PASS`; lint 0 errors (no `no-unused-vars` for `reindexEntity` — remove it from the import if the grep shows it is now import-only).

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/photos/[photo_id]/route.ts" tests/unit
git commit -m "feat(m10): caption photo on CMS save (regenerate on image change)"
```

---

### Task 5: `scripts/backfill-captions.mjs` — resumable caption backfill

Mirrors `scripts/backfill-search.mjs` (env-driven, `pg`, resumable). Captions every photo missing `ai_caption`; each photo is committed before the next so a crash resumes from the first still-null row. Rate-limit-aware (sequential + retry/backoff on 429/5xx). Per-photo failures are non-fatal — they stay null and retry on the next run.

**Files:**
- Create: `scripts/backfill-captions.mjs`
- Modify: `package.json` (add `"backfill:captions"` script)

**Interfaces:**
- Produces: `photos.ai_caption`/`ai_caption_model` populated. Run **before** `backfill:search --all` (which re-embeds the now caption-enriched bodies).
- Consumes: `DATABASE_URL`, `OPENAI_API_KEY` (from env or `.env.local`). Without a key it exits early (nothing to do — no captions can be made).

- [ ] **Step 1: Write `scripts/backfill-captions.mjs`**

```js
// Backfill photos.ai_caption with GPT-4o-mini vision descriptions (spec §7 image
// search). Env-driven, resumable, rate-limit-aware. Runs against ANY Postgres via
// DATABASE_URL (local E2E stack or, at the M7 gate, production). Requires
// OPENAI_API_KEY — without it there is nothing to generate, so it exits 0.
// Idempotent: only photos with a NULL ai_caption are processed unless --all.
//
// Run this BEFORE scripts/backfill-search.mjs --all so the re-embed sees the
// caption-enriched search_source body.
//
// Usage:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
//   OPENAI_API_KEY=sk-... node scripts/backfill-captions.mjs
//   Flags: --all  (re-caption every photo, not just NULL ai_caption)
import { readFileSync } from 'node:fs'
import pg from 'pg'

const MODEL = 'gpt-4o-mini'
const PROMPT = [
  '이 인테리어/공간 사진을 한국어로 검색에 활용할 수 있게 묘사해줘.',
  '다음을 한 문단으로: 공간 유형(예: 오피스 라운지, 주방), 보이는 가구·조명·오브제,',
  '주요 마감재(우드/메탈/패브릭/석재 등), 색감, 전체 스타일(모던/미니멀/인더스트리얼 등).',
  '추측성 브랜드명은 넣지 말고 보이는 것만. 80~120자 이내, 마침표로 끝맺기.',
].join(' ')

function fromEnvFile(key) {
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`))
      ?.slice(key.length + 1)
      .replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Single-photo caption with retry/backoff on 429/5xx. Returns null on give-up so
// the row stays NULL and is retried on the next run (resumable).
async function describe(imageUrl, apiKey) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      const text = json.choices?.[0]?.message?.content
      return typeof text === 'string' && text.trim() ? text.trim() : null
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 1000 * 2 ** attempt // 1s, 2s, 4s, 8s
      console.warn(`[captions] ${res.status} — backoff ${wait}ms`)
      await sleep(wait)
      continue
    }
    console.error(`[captions] OpenAI ${res.status}: ${await res.text().catch(() => '')}`)
    return null
  }
  return null
}

async function main() {
  const url = process.env.DATABASE_URL || fromEnvFile('DATABASE_URL')
  const apiKey = process.env.OPENAI_API_KEY || fromEnvFile('OPENAI_API_KEY')
  const recaptionAll = process.argv.includes('--all')
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  if (!apiKey) {
    console.warn('[captions] OPENAI_API_KEY missing — nothing to generate. Exiting.')
    return
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const where = recaptionAll ? '' : 'where ai_caption is null'
    const { rows } = await client.query(
      `select id, image_url from public.photos ${where} order by created_at asc, id`,
    )
    console.log(`[captions] ${rows.length} photo(s) to caption (${recaptionAll ? 'all' : 'missing only'}).`)

    let done = 0
    let filled = 0
    for (const row of rows) {
      const caption = row.image_url ? await describe(row.image_url, apiKey) : null
      if (caption) {
        // Committed per-photo → a crash resumes from the first still-NULL row.
        await client.query(
          'update public.photos set ai_caption = $1, ai_caption_model = $2, updated_at = now() where id = $3',
          [caption, MODEL, row.id],
        )
        filled += 1
      }
      done += 1
      if (done % 10 === 0 || done === rows.length) {
        console.log(`[captions] processed ${done}/${rows.length} (captioned ${filled})`)
      }
      await sleep(200) // gentle pacing to stay under rate limits
    }
    console.log('[captions] done. Now run: node scripts/backfill-search.mjs --all')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('[captions] failed:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the npm script**

In `package.json`, after `"backfill:search": "node scripts/backfill-search.mjs"`, add:
```json
    "backfill:captions": "node scripts/backfill-captions.mjs",
```
(Comma placement: the existing `backfill:search` line gets a trailing comma if it is not the last script.)

- [ ] **Step 3: Smoke-test the no-key path (no network, deterministic)**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  node -e "process.env.OPENAI_API_KEY='';" scripts/backfill-captions.mjs 2>&1 | tail -3 || \
  OPENAI_API_KEY= DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node scripts/backfill-captions.mjs 2>&1 | tail -3
```
Expected: `OPENAI_API_KEY missing — nothing to generate. Exiting.` and exit 0 (no DB writes, no throw). The live caption run against a real key is a manual/production step, not part of the local gate (the seed provides deterministic caption coverage instead — Task 6).

- [ ] **Step 4: Commit**

```bash
git add scripts/backfill-captions.mjs package.json
git commit -m "feat(m10): backfill-captions script (resumable, rate-limit-aware)"
```

---

### Task 6: Seed a caption fixture + E2E proving the caption search path (no OpenAI dependency)

The E2E dev server has **no** `OPENAI_API_KEY` (playwright.config `E2E_ENV` forwards only the 3 Supabase vars), so live captioning can't run in tests. Instead, seed one deterministic `ai_caption` to prove the `ai_caption → search_source → search_index → hybrid_search` wiring, and confirm photo search still works when captions/embeddings are absent (graceful degradation).

**Files:**
- Modify: `supabase/seed.sql`
- Modify: `tests/e2e/site/search.spec.ts`

**Interfaces:**
- Consumes: the migration's `photos.ai_caption` column + view change (Task 1); the seed rebuild of `search_index` from `search_source` (existing `seed.sql` tail, lines 96–101).

- [ ] **Step 1: Set an `ai_caption` on a published-linked seed photo**

In `supabase/seed.sql`, the photos insert (lines 43–49) currently inserts `(id, image_url, title, alt_text)`. Photo `…001` (`강남 오피스 회의실`) is linked to the published `강남 오피스` project via `project_photos` (line 63), so it appears in `search_source`. Give it a caption whose words do **not** already occur in its title/alt/project text, so the assertion proves the caption (not other fields) drove the hit.

Change the photos insert to include `ai_caption` for `…001`. Replace the insert block (lines 43–49) with an `ai_caption`-aware form — set it only on `…001`, leave the others `null`:
```sql
insert into public.photos (id, image_url, title, alt_text, ai_caption) values
  ('55555555-0000-0000-0000-000000000001', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/office-1.jpg', '강남 오피스 회의실', '회의실 전경', '가죽 소파와 우드 마감이 어우러진 모던 라운지, 따뜻한 색감.'),
  ('55555555-0000-0000-0000-000000000002', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/office-2.jpg', '강남 오피스 라운지', '라운지', null),
  ('55555555-0000-0000-0000-000000000003', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/aeron.jpg', '아에론 체어 클로즈업', '아에론', null),
  ('55555555-0000-0000-0000-000000000004', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/library-1.jpg', '판교 도서관 열람실', '열람실', null),
  ('55555555-0000-0000-0000-000000000005', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/library-2.jpg', '판교 도서관 외관', '외관', null),
  ('55555555-0000-0000-0000-000000000006', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/eames.jpg', '이임스 라운지', '이임스', null);
```
The `search_index` rebuild at the seed tail (`insert … select … from public.search_source`) then carries `가죽 소파` into photo `…001`'s `body` automatically. Embedding stays `null` (trigram drives E2E) — the caption is found by the trigram branch, exactly the no-key degradation path.

- [ ] **Step 2: Add the E2E assertion**

In `tests/e2e/site/search.spec.ts`, append inside the `test.describe('통합 검색', …)` block:
```ts
  test('AI 캡션으로 사진이 검색된다 (가죽 소파)', async ({ page }) => {
    // '가죽 소파' appears ONLY in photo …001's ai_caption (not its title/alt/project),
    // so a hit proves the caption flows into search_source → search_index → hybrid_search.
    await page.goto('/search?q=가죽 소파')
    await expect(page.getByRole('heading', { level: 2, name: /포토/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /강남 오피스 회의실/ })).toBeVisible()
  })
```
This also implicitly confirms graceful degradation: the E2E server has no OpenAI key, embeddings are null, yet the photo is found via the trigram body — the exact behavior when captioning hasn't run.

- [ ] **Step 3: Apply the seed and verify locally**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
supabase db reset 2>&1 | tail -4
docker restart supabase_kong_design4public && sleep 4
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c \
  "select title from public.hybrid_search('가죽 소파', null, 24);"
```
Expected: `db reset` clean; the RPC returns `강남 오피스 회의실` among the rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql tests/e2e/site/search.spec.ts
git commit -m "test(m10): seed ai_caption fixture + E2E caption search path"
```

---

### Task 7: Final gate — single-agent full-stack green run (with Kong restart)

Run every check in **one agent sitting** so migration/seed/types/tests share one environment. `supabase db reset` breaks Kong's GoTrue upstream (502 on `/auth/v1`), so **restart Kong after every reset, before Playwright** — this is the load-bearing gate step.

**Files:**
- None modified (gate). Fix-forward only if a check fails, then re-run the whole gate.

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: M10 gate evidence — tsc 0, lint 0 errors, full vitest green (M9 baseline + the ~10 new caption/vision tests), migration applies clean, `next build` success, Playwright green ×2 live (including the new caption-search spec).

- [ ] **Step 1: Typecheck + lint**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
npx tsc --noEmit && echo "TSC=PASS"
npm run lint 2>&1 | tail -10
```
Expected: `TSC=PASS`; lint 0 errors.

- [ ] **Step 2: Unit tests (full suite)**

```bash
npx vitest run 2>&1 | tail -12
```
Expected: all pass — the M9 baseline count **plus** 6 (vision) + 4 (indexer-caption) new tests, and any photo-route mock added in Task 4. No failures; if `captionAndReindexPhoto` leaked real network/DB, a spec would hang — it must be fully mocked.

- [ ] **Step 3: Reset the stack, re-seed, and restart Kong**

```bash
supabase db reset 2>&1 | tail -6
docker restart supabase_kong_design4public
# Wait for Kong to re-resolve the GoTrue upstream before auth-dependent specs.
sleep 5
curl -s -o /dev/null -w '%{http_code}\n' "$(supabase status -o env | sed -n 's/^API_URL=//p')/auth/v1/health"
```
Expected: `db reset` applies all five migrations + seed clean; the `curl` prints `200` (Kong → GoTrue healthy). A `502` means Kong hasn't re-resolved — wait and re-curl before proceeding; do **not** run Playwright against a 502 (admin specs will fail spuriously).

- [ ] **Step 4: Production build**

```bash
npm run build 2>&1 | tail -20
```
Expected: build succeeds; all routes compile (the photo route now importing `captionAndReindexPhoto`, `lib/search/vision.ts` bundled server-side only). No type errors.

- [ ] **Step 5: Playwright ×2 against the live stack**

```bash
npx playwright test 2>&1 | tail -14
npx playwright test 2>&1 | tail -14
```
Expected: full suite green **both** runs, including `tests/e2e/site/search.spec.ts` (the new `가죽 소파` caption spec) and `tests/e2e/integration/search-index.spec.ts` (unchanged project-reindex path). Two green runs is the evidence bar. If the caption spec fails, confirm Task 6 Step 3's RPC probe returned the photo (seed/view wiring) before suspecting the UI.

> If a reset happened between the two Playwright runs for any reason, re-run the Kong restart from Step 3. Any `/auth/v1` 502 in a trace is a stale-Kong artifact, not a real regression.

- [ ] **Step 6: Final commit + push**

```bash
git add -A
git commit -m "chore(m10): image-content search (ai_caption) — gate green" || echo "nothing to commit"
git push -u origin unify/m10-clip-search
```

---

## Self-Review

**Spec coverage (확장목표 10 + M10 row "검색 2단계: CLIP 이미지 임베딩 (사진 내용 자체 검색)" + orchestrator brief):**
1. Provider decision resolved with rationale — caption-then-text-embed via GPT-4o-mini; true-CLIP documented as deferred (Rationale section). ✓
2. Additive migration: `photos.ai_caption`/`ai_caption_model` columns + `search_source` view folds the caption in — Task 1 (timestamp `20260703160000` ≥ required). ✓
3. `lib/search/vision.ts#describePhoto` — GPT-4o-mini vision, never-throws, `cache:'no-store'`, unit tests in `afterEach` style — Task 2. ✓
4. Indexer extension: photo caption enriches the indexed text via `search_source` (no `reindexEntity` change), new `captionAndReindexPhoto` — Task 3. ✓
5. CMS hook: photo PUT fires caption+index best-effort, regenerating on image change, respecting never-throws + service-role boundary — Task 4. ✓
6. Backfill: new `scripts/backfill-captions.mjs`, resumable, rate-limit-aware, skips captioned photos — Task 5. ✓
7. Search UI: photos already surface in M6 results (`photo` group), so no new UI — verified against `search-results.tsx`; the E2E is the thin verify + caption-path proof — Task 6. ✓
8. E2E graceful degradation with absent OpenAI key (captions/embeddings null, trigram finds the seeded caption) + live gate with Kong restart baked in — Tasks 6–7. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Every task carries complete file contents (migration SQL, `vision.ts`, both test files, `backfill-captions.mjs`) or an exact before/after edit (photo route line 7 + line 59; `database.types.ts` three shapes; `seed.sql` insert; `search.spec.ts` appended test).

**Type consistency:** `describePhoto(imageUrl: string): Promise<string | null>` and `VISION_MODEL` (Task 2) are consumed exactly by `captionAndReindexPhoto` (Task 3). `photos.update({ ai_caption, ai_caption_model })` typechecks against the hand-edited `TablesUpdate<'photos'>` (Task 1 Step 3) — the reason `gen:types` is avoided and the columns are added by hand (Global Constraints). `captionAndReindexPhoto(id, { regenerate })` signature matches the call site `{ regenerate: imageUrl !== undefined }` (Task 4). Migration view output columns are unchanged, so no `search_source` type edit is needed. Next/React versions are asserted unchanged (`15.5.20`/`^19`) in Global Constraints and no task bumps them.

**Open questions:** none. Two design points resolved by repo evidence rather than deferred:
- *New photos created during project/item save aren't auto-captioned.* Photos are created implicitly via `lib/image-sync.ts#ensurePhotoId` during project/item save, and M6's existing behavior does **not** reindex individual photos there (only the parent project/item). So M10 follows the same model: a new photo is captioned by the next `backfill:captions` run, or when a content manager opens/saves it (Task 4). This is consistent with how photos already enter `search_index` today — not a regression introduced here. No hook is added to `image-sync.ts` (which throws by contract and runs inside the mutation's request-scoped client — an unsuitable place for a paid, fire-and-forget vision call).
- *OpenAI must fetch `image_url` server-side.* Production photos live on Supabase Storage public URLs (reachable by OpenAI); the local seed URLs (`127.0.0.1:54321`) are not, but the E2E server has no key so no fetch is attempted — deterministic coverage comes from the seeded `ai_caption` (Task 6) instead.
</content>
</invoke>
