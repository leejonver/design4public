# M1 — Repo Merge & Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the `d4p-cms` admin app into the `design4public-frontend` repo (history preserved) so both ship from one Next.js app — public site under `app/(site)/`, admin under `app/admin/` — building green on a single Tailwind v4 / Next 14.2.32 toolchain.

**Architecture:** One Next.js App Router app. Root `app/layout.tsx` renders only `<html>/<body>`. Two sibling segment layouts isolate concerns: `app/(site)/layout.tsx` (site chrome + site `globals.css` via Tailwind v4 `@config` reuse of the existing v3 token config) and `app/admin/layout.tsx` (vapor `ThemeProvider` + admin `globals.css` layered Tailwind v4). CSS is loaded per-segment so the two token systems (`--ink/--sp/--sage` vs vapor tokens) never collide. `middleware.ts` guards `/admin/:path*` only; the public site is never intercepted. Supabase clients are unified under `lib/supabase/` (browser/server/admin) plus a public anon read client. Admin API routes move to `/api/admin/*`; the admin fetch wrapper gets a one-line base change so every call re-targets automatically.

**Tech Stack:** Next.js 14.2.32, React 18.3.1, TypeScript 5.5, Tailwind CSS v4 (`@tailwindcss/postcss`), `@supabase/ssr` + `@supabase/supabase-js`, `@vapor-ui/core`, Vitest 3 (unit), Playwright (e2e).

## Global Constraints

- Next.js pinned to `14.2.32` (exact, no caret). React and React-DOM pinned to `18.3.1` (exact).
- Tailwind CSS `^4` with `@tailwindcss/postcss` `^4`. No Tailwind v3, no `autoprefixer` (v4's engine handles prefixing).
- Single test runner: Vitest (`npm test`). Jest is removed. Playwright is e2e only (`npm run test:e2e`).
- Path alias is unified to `@/*` → repo root (`"@/*": ["./*"]`). Every `@/...` import resolves from the repo root.
- Supabase service-role key lives only in `lib/supabase/admin.ts` (`server-only`). Never import it into a client component.
- Middleware matcher is exactly `['/admin/:path*']`. Login redirect target is `/admin/login`. The public site must never be matched.
- CSS isolation: site CSS is imported **only** in `app/(site)/layout.tsx`; admin CSS **only** in `app/admin/layout.tsx`. Never import either at the root.
- Preserve git history through the merge: bring CMS in with `git subtree`, then relocate every file with `git mv` (never delete-and-recreate).
- NOT in M1 (do not implement): revalidation calls, search, SEO pages, `supabase/` CLI dir, data-model changes. Site read code (`lib/api.ts`) keeps working unchanged.
- Repo root for all commands: `/Users/jaehwanlee/development/d4p/design4public-frontend`. The CMS repo is at `/Users/jaehwanlee/development/d4p/d4p-cms` (sibling; both are independent git repos on branch `main`, working trees clean).

---

## File-Structure Map (old → new)

Prefix `_cms-import/` is the subtree landing zone (Task 1). Everything under it is relocated with `git mv` and the residue removed in Task 9.

### Site (frontend) — relocations
| Old | New | Responsibility |
|---|---|---|
| `app/layout.tsx` | split → `app/layout.tsx` (root html/body) + `app/(site)/layout.tsx` (site chrome, site CSS, site metadata) | root shell vs site chrome |
| `app/globals.css` | `app/(site)/globals.css` | site design tokens + `.d4p-*` classes + Tailwind v4 entry |
| `app/page.tsx` | `app/(site)/page.tsx` | site home (URL unchanged: `/`) |
| `app/{projects,items,brands,photos,privacy,terms}/**` | `app/(site)/{projects,items,brands,photos,privacy,terms}/**` | site routes (URLs unchanged) |
| `app/{robots.ts,sitemap.ts,opengraph-image.tsx,icon.svg}` | `app/(site)/…` (stay top-of-tree behavior; see Task 2 note) | site SEO files |
| `app/api/inquiry/route.ts` | `app/api/inquiry/route.ts` (unchanged) | public inquiry endpoint |
| `components/d4p/*` | `components/site/*` | site UI components |
| `components/ui/*`, `components/json-ld.tsx` | unchanged | shadcn primitives + JSON-LD helper |
| `lib/supabase.ts` | `lib/supabase/public.ts` | anonymous public read client (site) |
| `lib/{api,types,seo,utils,database.types}.ts` | unchanged paths | site data + helpers (database.types gets CMS enum aliases appended) |

### Admin (CMS) — relocations from `_cms-import/`
| Old (`_cms-import/…`) | New | Responsibility |
|---|---|---|
| `src/app/layout.tsx` | folded into `app/admin/layout.tsx` (new) | admin segment layout (vapor + admin CSS) |
| `src/app/globals.css` | `app/admin/globals.css` | vapor + Tailwind v4 layered CSS |
| `src/app/{login,signup,projects,items,brands,photos,categories,managers,home-settings}/**` (pages) | `app/admin/{…}/**` | admin pages |
| `src/app/page.tsx` | `app/admin/page.tsx` | admin dashboard/home |
| `src/app/api/**` | `app/api/admin/**` | admin API routes |
| `src/components/{MainLayout,Sidebar,ClientLayout}.tsx` | `components/admin/{MainLayout,Sidebar,ClientLayout}.tsx` | admin chrome |
| `src/components/ui/*` | `components/admin/ui/*` | admin UI primitives |
| `src/contexts/AuthContext.tsx` | `components/admin/AuthContext.tsx` | admin auth context provider |
| `src/lib/supabase.ts` | `lib/supabase/browser.ts` | browser client (`createBrowserClient`) |
| `src/lib/supabase-server.ts` | `lib/supabase/server.ts` | cookie/RLS server client |
| `src/lib/supabase-admin.ts` | `lib/supabase/admin.ts` | service-role client (`server-only`) |
| `src/lib/auth.ts` | `lib/auth.ts` | RBAC (`requireRole`, `getCurrentUser`) |
| `src/lib/api.ts` | `lib/admin-api.ts` | admin fetch wrapper (base → `/api/admin`) |
| `src/lib/{dto,slug,image-sync,use-list-controller}.ts` | `lib/{dto,slug,image-sync,use-list-controller}.ts` | admin helpers |
| `src/lib/database.types.ts` | discarded (site's generated file is the single source; see Task 5) | — |
| `src/types/index.ts` | `lib/admin-types.ts` | admin DTO/UI types (`UploadResponse`, etc.) |
| `src/middleware.ts` | rewritten → `middleware.ts` (root) | admin route guard |
| `migrations/*` | `migrations/*` (root) | SQL migrations (kept for later milestones) |
| `scripts/*` | `scripts/*` (root) | ops scripts (kept for later milestones) |
| `public/*` | merged into `public/` (collision-checked) | admin static assets |
| `__tests__/{unit,api,integration}/**` | `tests/unit/admin/**` | admin unit tests → Vitest |
| `__tests__/e2e/**` | `tests/e2e/admin/**` | admin Playwright specs |

### New / rewritten config files (root)
| File | Action | Responsibility |
|---|---|---|
| `package.json` | rewrite | single dependency set |
| `next.config.mjs` | rewrite | merged images config |
| `vercel.json` | create | function limits scoped to `app/api/admin/**`, no CORS |
| `middleware.ts` | create | `/admin/:path*` guard |
| `postcss.config.mjs` | rewrite (replaces `postcss.config.js`) | `@tailwindcss/postcss` only |
| `tsconfig.json` | rewrite | `@/*` → root |
| `eslint.config.mjs` | create (flat) | lint site + admin |
| `.env.example` | create | unified env vars |
| `tailwind.config.js` | keep | v3 token config, loaded by v4 via `@config` |
| `vitest.config.ts`, `vitest.setup.ts` | edit | add admin test dir + jsdom mocks |

---

## Task 1: Subtree import of d4p-cms into `_cms-import/`

**Files:**
- Create branch `unify/m1-repo-merge`
- Create: `_cms-import/**` (entire CMS tree, history preserved)

**Interfaces:**
- Produces: the `_cms-import/` landing directory that Tasks 2–9 relocate from.

- [ ] **Step 1: Confirm clean state and create the branch**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git status --porcelain   # expect: empty
git checkout -b unify/m1-repo-merge
```

- [ ] **Step 2: Add the CMS repo as a local remote and fetch**

```bash
git remote add cms ../d4p-cms
git fetch cms
```

Expected: `From ../d4p-cms * [new branch] main -> cms/main`.

- [ ] **Step 3: Subtree-add the CMS tree under `_cms-import/` (history preserved)**

```bash
git subtree add --prefix _cms-import cms main
```

Expected: `Added dir '_cms-import'` and a merge commit. Verify history came across:

```bash
git log --oneline -- _cms-import/src/lib/auth.ts | head   # expect multiple CMS commits, not just the merge
ls _cms-import/src/app _cms-import/src/lib                 # expect the CMS tree
```

- [ ] **Step 4: Commit is already created by subtree; verify tree**

```bash
git log --oneline -1        # expect: "Add 'cms/main' ... as '_cms-import'" (or similar subtree merge message)
test -d _cms-import/src/app && echo OK
```

**Risks/watch-fors:** If `git remote add cms` errors with "remote cms already exists", run `git remote remove cms` first. `git subtree` ships with git; if missing, `git subtree` is under `contrib` — install via Homebrew git. Do NOT `npm install` inside `_cms-import`; its `node_modules` is not tracked and will be discarded.

---

## Task 2: Move the site into the `(site)` route group and split the root layout

**Files:**
- Move: `app/page.tsx`, `app/{projects,items,brands,photos,privacy,terms}/**`, `app/globals.css`, `app/robots.ts`, `app/sitemap.ts`, `app/opengraph-image.tsx`, `app/icon.svg` → under `app/(site)/`
- Rewrite: `app/layout.tsx` (now root shell only)
- Create: `app/(site)/layout.tsx`
- Keep in place: `app/api/inquiry/route.ts`

**Interfaces:**
- Consumes: `fetchSearchIndex` from `@/lib/api`; `SiteHeader`/`SiteFooter`/`ContactModalProvider` (paths fixed in Task 4/9); `SITE_*` + schema helpers from `@/lib/seo`.
- Produces: `app/layout.tsx` exporting `metadata` (metadataBase + title template) and a root `RootLayout`; `app/(site)/layout.tsx` exporting site `metadata` + `SiteLayout`.

- [ ] **Step 1: Create the route group and move site routes into it**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
mkdir -p "app/(site)"
git mv app/page.tsx "app/(site)/page.tsx"
git mv app/globals.css "app/(site)/globals.css"
git mv app/projects "app/(site)/projects"
git mv app/items "app/(site)/items"
git mv app/brands "app/(site)/brands"
git mv app/photos "app/(site)/photos"
git mv app/privacy "app/(site)/privacy"
git mv app/terms "app/(site)/terms"
git mv app/robots.ts "app/(site)/robots.ts"
git mv app/sitemap.ts "app/(site)/sitemap.ts"
git mv app/opengraph-image.tsx "app/(site)/opengraph-image.tsx"
git mv app/icon.svg "app/(site)/icon.svg"
```

Note: route groups `(site)` do not change URLs — `app/(site)/page.tsx` still serves `/`. Metadata files (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.svg`) work inside the group; Next resolves them to the site root because `(site)` is transparent in the URL. `app/(site)/page.tsx` is the sole `/` page, so no route conflict with `app/admin`.

- [ ] **Step 2: Rewrite `app/layout.tsx` as the minimal root shell**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `app/(site)/layout.tsx` with the site chrome (imports use the post-Task-4 paths)**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ContactModalProvider } from "@/components/site/contact-modal";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  jsonLdGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";
import { fetchSearchIndex } from "@/lib/api";

export const metadata: Metadata = {
  title: {
    default: "design4public | 공공조달 가구 납품사례",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const index = await fetchSearchIndex();

  return (
    <ContactModalProvider>
      <JsonLd data={jsonLdGraph([organizationSchema(), websiteSchema()])} />
      <SiteHeader index={index} />
      <main style={{ minHeight: "60vh" }}>{children}</main>
      <SiteFooter />
    </ContactModalProvider>
  );
}
```

- [ ] **Step 4: Verify structure (build not yet expected to pass — imports resolve after Task 4)**

```bash
ls "app/(site)"     # page.tsx globals.css layout.tsx projects items brands photos privacy terms robots.ts sitemap.ts opengraph-image.tsx icon.svg
test -f app/layout.tsx && test -f "app/(site)/layout.tsx" && echo OK
git add -A && git status --short | head
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(site): move public site into (site) route group, split root layout"
```

**Risks/watch-fors:** `(site)` contains parentheses — always quote the path in shell. `@/components/site/*` imports in Steps 3 are dangling until Task 4 completes; that is expected, do not "fix" them by pointing back at `d4p/`. Keep `JsonLd` in the site layout (it was in the old root layout); the new root layout intentionally has no JSON-LD.

---

## Task 3: Move admin pages and API routes into `app/admin/*` and `app/api/admin/*`

**Files:**
- Move: `_cms-import/src/app/{page.tsx,globals.css}` and all admin page dirs → `app/admin/**`
- Move: `_cms-import/src/app/api/**` → `app/api/admin/**`
- Create: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `ClientLayout` from `@/components/admin/ClientLayout` (moved in Task 4).
- Produces: admin routes at `/admin/*`; admin API at `/api/admin/*`; `app/admin/layout.tsx` exporting admin `metadata` + `AdminLayout`.

- [ ] **Step 1: Create `app/admin/` and move admin pages + CSS**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
mkdir -p app/admin
git mv _cms-import/src/app/globals.css app/admin/globals.css
git mv _cms-import/src/app/page.tsx app/admin/page.tsx
for d in login signup projects items brands photos categories managers home-settings; do
  git mv "_cms-import/src/app/$d" "app/admin/$d"
done
```

- [ ] **Step 2: Move admin API routes under `app/api/admin/`**

```bash
mkdir -p app/api/admin
git mv _cms-import/src/app/api/auth        app/api/admin/auth
git mv _cms-import/src/app/api/projects     app/api/admin/projects
git mv _cms-import/src/app/api/items        app/api/admin/items
git mv _cms-import/src/app/api/brands       app/api/admin/brands
git mv _cms-import/src/app/api/photos       app/api/admin/photos
git mv _cms-import/src/app/api/categories   app/api/admin/categories
git mv _cms-import/src/app/api/managers     app/api/admin/managers
git mv _cms-import/src/app/api/tags         app/api/admin/tags
git mv _cms-import/src/app/api/home-settings app/api/admin/home-settings
git mv _cms-import/src/app/api/upload       app/api/admin/upload
```

Verify nothing is left in the CMS app api dir:

```bash
ls _cms-import/src/app/api 2>/dev/null || echo "api dir emptied"
```

- [ ] **Step 3: Merge admin static assets from CMS `public/` (collision-checked)**

```bash
# List CMS public assets and check for name clashes with the site's public/.
ls _cms-import/public
for f in $(ls _cms-import/public); do
  if [ -e "public/$f" ]; then echo "CLASH: $f (keep site's; drop CMS copy)"; else git mv "_cms-import/public/$f" "public/$f"; fi
done
```

For any `CLASH` (likely `favicon.ico`, `icon.svg`, `file.svg`, etc.): keep the site's version and leave the CMS copy in `_cms-import/public` (removed with the residue in Task 9). The admin favicon is not required for M1's gate.

- [ ] **Step 4: Create `app/admin/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "@/components/admin/ClientLayout";

export const metadata: Metadata = {
  title: "Design4Public 콘텐츠관리자",
  description: "공공조달 가구 납품 프로젝트 사례 CMS",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
```

- [ ] **Step 5: Preserve the admin Pretendard font (was a `<head>` `<link>` in the CMS root layout)**

Segment layouts cannot render `<head>`. Instead add the font as a CSS `@import` in `app/admin/globals.css`. Insert this line immediately **after** the `@layer …;` statement (line 4) and **before** the `@import '@vapor-ui/core/styles.css';` line (CSS requires `@import` before other rules; `@layer` statements and other `@import`s are allowed to precede it):

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
```

- [ ] **Step 6: Verify and commit**

```bash
ls app/admin           # login signup projects items brands photos categories managers home-settings page.tsx globals.css layout.tsx
ls app/api/admin       # auth projects items brands photos categories managers tags home-settings upload
git add -A && git commit -m "refactor(admin): move CMS pages to app/admin and API to app/api/admin"
```

**Risks/watch-fors:** `app/admin/page.tsx` + `app/(site)/page.tsx` are different segments, no conflict. The `import ClientLayout` in Step 4 dangles until Task 4 — expected. Do not delete `_cms-import/src/app/layout.tsx` yet; it's removed as residue in Task 9 (its content is superseded by `app/admin/layout.tsx`).

---

## Task 4: Relocate components (site + admin)

**Files:**
- Move: `components/d4p/*` → `components/site/*`
- Move: `_cms-import/src/components/*` → `components/admin/*`
- Move: `_cms-import/src/contexts/AuthContext.tsx` → `components/admin/AuthContext.tsx`
- Keep: `components/ui/*`, `components/json-ld.tsx`

**Interfaces:**
- Produces: site components at `@/components/site/*`; admin components at `@/components/admin/*` (incl. `@/components/admin/ui`, `@/components/admin/MainLayout`, `@/components/admin/Sidebar`, `@/components/admin/ClientLayout`, `@/components/admin/AuthContext`).

- [ ] **Step 1: Move site components (`d4p` → `site`)**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git mv components/d4p components/site
```

- [ ] **Step 2: Move admin components**

```bash
mkdir -p components/admin
git mv _cms-import/src/components/ui           components/admin/ui
git mv _cms-import/src/components/MainLayout.tsx  components/admin/MainLayout.tsx
git mv _cms-import/src/components/Sidebar.tsx     components/admin/Sidebar.tsx
git mv _cms-import/src/components/ClientLayout.tsx components/admin/ClientLayout.tsx
git mv _cms-import/src/contexts/AuthContext.tsx   components/admin/AuthContext.tsx
```

- [ ] **Step 3: Verify and commit**

```bash
ls components         # admin json-ld.tsx site ui
ls components/site    # site-header.tsx site-footer.tsx contact-modal.tsx ... (15 files)
ls components/admin   # ui MainLayout.tsx Sidebar.tsx ClientLayout.tsx AuthContext.tsx
git add -A && git commit -m "refactor(components): d4p->site, CMS components->admin"
```

**Risks/watch-fors:** Internal import paths inside these files are still the old aliases — fixed in Task 9. Do not hand-edit imports here; the mechanical rewrite is a single reviewable task.

---

## Task 5: Merge `lib/` — unify Supabase clients and admin helpers

**Files:**
- Move: `lib/supabase.ts` → `lib/supabase/public.ts`
- Move: `_cms-import/src/lib/supabase.ts` → `lib/supabase/browser.ts`
- Move: `_cms-import/src/lib/supabase-server.ts` → `lib/supabase/server.ts`
- Move: `_cms-import/src/lib/supabase-admin.ts` → `lib/supabase/admin.ts`
- Move: `_cms-import/src/lib/{auth,dto,slug,image-sync,use-list-controller}.ts` → `lib/*`
- Move: `_cms-import/src/lib/api.ts` → `lib/admin-api.ts`
- Move: `_cms-import/src/types/index.ts` → `lib/admin-types.ts`
- Modify: `lib/api.ts` (site) — one import line
- Modify: `lib/database.types.ts` — append CMS enum aliases
- Discard: `_cms-import/src/lib/database.types.ts` (residue removed in Task 9)

**Interfaces:**
- Produces:
  - `lib/supabase/public.ts` → `getSupabaseConfig()`, `getSupabaseClient()`, `supabase` (anon read client, site).
  - `lib/supabase/browser.ts` → `createClient()`, `supabase`, re-export `Database`.
  - `lib/supabase/server.ts` → `createServerSupabase()`.
  - `lib/supabase/admin.ts` → `supabaseAdmin`.
  - `lib/auth.ts` → `requireUser()`, `requireRole(min)`, `getCurrentUser()`, `authErrorResponse(err)`, `AuthError`, `hasRole`, `SessionUser`.
  - `lib/admin-api.ts` → `api` object; `API_BASE_URL = '/api/admin'`.
  - `lib/admin-types.ts` → `UploadResponse`, `ImageData`, `HomeSettings`, etc.
  - `lib/database.types.ts` → `Database` (generated) + appended `UserRole`, `ApprovalStatus`, `ProjectStatus`, `ItemStatus`, `BrandStatus`, `CategoryType`.

- [ ] **Step 1: Create `lib/supabase/` and move the four clients**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
mkdir -p lib/supabase
git mv lib/supabase.ts                     lib/supabase/public.ts
git mv _cms-import/src/lib/supabase.ts        lib/supabase/browser.ts
git mv _cms-import/src/lib/supabase-server.ts lib/supabase/server.ts
git mv _cms-import/src/lib/supabase-admin.ts  lib/supabase/admin.ts
```

- [ ] **Step 2: Fix the relative `./database.types` imports inside the moved clients (now one level deeper)**

`lib/supabase/{browser,server,admin}.ts` each `import … from './database.types'`. After the move the shared types file is one level up at `lib/database.types.ts`. Update each:

```bash
sed -i '' "s|from './database.types'|from '../database.types'|g" \
  lib/supabase/browser.ts lib/supabase/server.ts lib/supabase/admin.ts
grep -n "database.types" lib/supabase/*.ts    # expect: '../database.types' in all three
```

`lib/supabase/public.ts` imports `from "./database.types"` too — it now lives in `lib/supabase/`, so fix it the same way:

```bash
sed -i '' 's|from "./database.types"|from "../database.types"|g' lib/supabase/public.ts
```

- [ ] **Step 3: Move admin lib helpers and rename the admin api wrapper + types**

```bash
git mv _cms-import/src/lib/auth.ts                 lib/auth.ts
git mv _cms-import/src/lib/dto.ts                  lib/dto.ts
git mv _cms-import/src/lib/slug.ts                 lib/slug.ts
git mv _cms-import/src/lib/image-sync.ts           lib/image-sync.ts
git mv _cms-import/src/lib/use-list-controller.ts  lib/use-list-controller.ts
git mv _cms-import/src/lib/api.ts                  lib/admin-api.ts
git mv _cms-import/src/types/index.ts              lib/admin-types.ts
```

- [ ] **Step 4: Fix `lib/auth.ts` relative import to the server client**

`lib/auth.ts` imports `from './supabase-server'`. The server client is now at `lib/supabase/server.ts`:

```bash
sed -i '' "s|from './supabase-server'|from './supabase/server'|g" lib/auth.ts
grep -n "supabase/server" lib/auth.ts   # expect one hit
```

`lib/auth.ts` also imports `from './database.types'` — that file is a sibling in `lib/`, so it stays correct. Confirm:

```bash
grep -n "database.types" lib/auth.ts    # expect './database.types'
```

- [ ] **Step 5: Point the site data layer at the relocated public client**

`lib/api.ts` (site) imports `from "./supabase"`. Repoint to the public client:

```bash
sed -i '' 's|from "./supabase"|from "./supabase/public"|' lib/api.ts
grep -n "supabase/public" lib/api.ts    # expect: import { supabase } from "./supabase/public";
```

- [ ] **Step 6: Make the single `lib/database.types.ts` satisfy the admin code**

The site's generated `lib/database.types.ts` (642 lines) is the single source. The admin code (`lib/auth.ts`, `components/admin/AuthContext.tsx`) imports named unions `UserRole`, `ApprovalStatus`, etc. that the generated file does not export. Append these aliases to the **end** of `lib/database.types.ts` (values copied verbatim from the CMS types file):

```ts

/* --- Named enum aliases consumed by admin code (auth.ts, AuthContext).
   TODO(post-M1): replace with Enums<'...'> derivations from Database. --- */
export type UserRole = 'master' | 'admin' | 'content_manager'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ProjectStatus = 'draft' | 'published' | 'hidden'
export type ItemStatus = 'available' | 'discontinued' | 'hidden'
export type BrandStatus = 'visible' | 'hidden'
export type CategoryType = 'project' | 'item'
```

Then discard the CMS copy (it is not moved anywhere; removed with residue in Task 9). Confirm it is untouched for now:

```bash
test -f _cms-import/src/lib/database.types.ts && echo "CMS copy still present (removed in Task 9)"
```

- [ ] **Step 7: Verify and commit**

```bash
ls lib/supabase                       # admin.ts browser.ts public.ts server.ts
ls lib                                # api.ts admin-api.ts admin-types.ts auth.ts database.types.ts dto.ts image-sync.ts seo.ts slug.ts types.ts use-list-controller.ts utils.ts supabase/
grep -rn "UserRole" lib/database.types.ts | tail -1   # expect the appended alias
git add -A && git commit -m "refactor(lib): unify supabase clients (browser/server/admin/public) and merge admin helpers"
```

**Risks/watch-fors:** `sed -i ''` is the BSD/macOS form (empty string arg required). Two `database.types.ts` type systems differ (generated `type Database` vs CMS hand-written `interface Database`); we deliberately keep only the generated one and bridge with union aliases — do NOT copy the CMS file over the site's. If TypeScript later flags a table/column the admin code uses that the generated types lack, note it for the orchestrator rather than editing generated types by hand. `lib/admin-api.ts` still references `NEXT_PUBLIC_API_BASE_URL` and `@/types` — fixed in Task 9.

---

## Task 6: Unify `package.json` and reinstall

**Files:**
- Rewrite: `package.json`
- Delete: `_cms-import/package.json`, `_cms-import/package-lock.json` (residue; formally removed in Task 9, but do not let them shadow the root install)

**Interfaces:**
- Produces: single dependency set; scripts `dev/build/start/lint/format/test/test:e2e`.

- [ ] **Step 1: Replace `package.json` with the merged manifest**

```json
{
  "name": "design4public",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.57.2",
    "@vapor-ui/core": "^1.3.0",
    "@vapor-ui/hooks": "^1.0.0-beta.6",
    "@vapor-ui/icons": "^1.2.0",
    "browser-image-compression": "^2.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.441.0",
    "next": "14.2.32",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "resend": "^6.6.0",
    "swr": "^2.2.4",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@playwright/test": "^1.55.1",
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^20.11.30",
    "@types/pg": "^8.20.0",
    "@types/react": "^18.3.24",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^5.0.4",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.32",
    "jsdom": "^27.0.0",
    "node-fetch": "^3.3.2",
    "pg": "^8.21.0",
    "postcss": "^8.4.35",
    "prettier": "^3.3.3",
    "tailwindcss": "^4",
    "typescript": "^5.5.4",
    "vitest": "^3.2.4"
  },
  "optionalDependencies": {
    "@next/swc-darwin-arm64": "^14.2.32"
  }
}
```

Removed vs the old frontend manifest: `autoprefixer` (v4 handles prefixing), Tailwind v3 (`tailwindcss ^3.4.10` → `^4`). Removed vs CMS: `jest`, `jest-environment-jsdom`, `@types/jest`, `whatwg-fetch` (Jest is gone). Added from CMS: `@supabase/ssr`, `@vapor-ui/*`, `browser-image-compression`, `@tailwindcss/postcss`, `@playwright/test`, `pg`/`@types/pg`, `@types/react-dom`, `@eslint/eslintrc`.

- [ ] **Step 2: Delete the old frontend lockfile and reinstall fresh**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
rm -f package-lock.json
npm install
```

Expected: clean install, `package-lock.json` regenerated, no peer-dependency ERESOLVE errors. If `@vapor-ui/hooks@^1.0.0-beta.6` triggers a peer conflict with React 18.3.1, retry with `npm install --legacy-peer-deps` and note it for the orchestrator.

- [ ] **Step 3: Verify pinned versions installed**

```bash
node -e "const p=require('./node_modules/next/package.json');console.log('next',p.version)"   # 14.2.32
node -e "const p=require('./node_modules/react/package.json');console.log('react',p.version)"  # 18.3.1
node -e "const p=require('./node_modules/tailwindcss/package.json');console.log('tw',p.version)" # 4.x
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json && git commit -m "build: unify dependencies (Next 14.2.32, React 18.3.1, Tailwind v4, Vitest-only)"
```

**Risks/watch-fors:** Do not `npm install` from inside `_cms-import`. Pin `next`/`react`/`react-dom` exactly (no caret) per Global Constraints. `@next/swc-darwin-arm64` is optional and platform-specific (this is an arm64 mac) — fine to keep.

---

## Task 7: Tailwind v4 + PostCSS + tsconfig + ESLint

**Files:**
- Rewrite: `postcss.config.js` → delete, create `postcss.config.mjs`
- Edit: `app/(site)/globals.css` (Tailwind v4 entry via `@config`)
- Keep: `tailwind.config.js` (v3 tokens, loaded by v4)
- Rewrite: `tsconfig.json`
- Create: `eslint.config.mjs`; delete stray old lint configs if present

**Interfaces:**
- Produces: a v4 PostCSS pipeline serving both CSS entries; `@/*` → repo root alias; flat ESLint config covering `app/`, `components/`, `lib/`.

- [ ] **Step 1: Replace PostCSS config with the v4 form**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
git rm postcss.config.js
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

- [ ] **Step 2: Convert the site CSS entry to Tailwind v4, reusing the existing v3 token config**

In `app/(site)/globals.css`, replace the first three lines:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

with:

```css
@import 'tailwindcss';
@config '../../tailwind.config.js';
```

Everything below (the `:root` tokens, `.d4p-*` classes, keyframes) stays byte-for-byte. `@config` makes v4 load the existing `tailwind.config.js` — all custom `colors` (sage/neutral + shadcn hsl vars), `spacing`, `fontFamily`, `fontSize`, `boxShadow`, `screens`, `keyframes`/`animation`, `borderRadius`, and the `tailwindcss-animate` plugin — with zero token translation. The relative path resolves from `app/(site)/` to the repo-root config.

- [ ] **Step 3: Confirm the admin CSS entry is already v4-correct**

`app/admin/globals.css` uses the layered v4 form (`@layer` + `@import 'tailwindcss/theme.css' layer(...)` + `@import 'tailwindcss/utilities.css' layer(...)`) and intentionally omits preflight (vapor ships its own reset). No change beyond the Pretendard `@import` added in Task 3. Verify:

```bash
grep -n "tailwindcss/theme.css\|tailwindcss/utilities.css\|@vapor-ui/core/styles.css" app/admin/globals.css   # expect all three
```

- [ ] **Step 4: Rewrite `tsconfig.json` with the unified alias**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "_cms-import"]
}
```

`_cms-import` is excluded so its leftover TS files don't get type-checked before Task 9 removes them.

- [ ] **Step 5: Create the flat ESLint config**

Create `eslint.config.mjs`:

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "_cms-import/**",
      "scripts/**",
      "tests/e2e/**",
    ],
  },
];

export default eslintConfig;
```

- [ ] **Step 6: Verify the site CSS compiles under v4 (isolated check)**

```bash
npx @tailwindcss/cli -i "app/(site)/globals.css" -o /tmp/site.out.css 2>&1 | tail -5
grep -c "\.text-display-lg\|\.bg-sage-600\|--tw" /tmp/site.out.css   # expect > 0 (custom tokens emitted)
```

Expected: compiles with no error and emits utilities for the config's custom tokens.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "build: Tailwind v4 pipeline (@config reuse of v3 tokens), unify tsconfig + flat eslint"
```

**Risks/watch-fors:**
- `tailwindcss-animate` under v4 via `@config`: if Step 6 errors on the plugin, replace the `@config` approach in `app/(site)/globals.css` by adding `@plugin 'tailwindcss-animate';` (v4-native plugin loading) alongside `@config`, or as a last resort drop the plugin (the shadcn `components/ui/*` that use `animate-*` appear unused by the site — confirm with `grep -rn "@/components/ui" app components`). Note the chosen path for the orchestrator.
- v4 preflight differs slightly from v3 (e.g. default border color). The site's own base resets override most of it; full screenshot regression is deferred to M12. Eyeball `/` in the Task 11 dev smoke.
- `next/typescript` in the flat config requires `typescript-eslint` transitively via `eslint-config-next`; if lint errors with a missing parser, that's an install gap — re-run `npm install` and note it.

---

## Task 8: Merge `next.config`, `vercel.json`, `.env.example`, and write the middleware

**Files:**
- Rewrite: `next.config.mjs`
- Create: `vercel.json`
- Create: `.env.example`
- Create: `middleware.ts` (root)

**Interfaces:**
- Produces: unified image remote patterns; scoped serverless function limits; the `/admin/:path*` guard redirecting to `/admin/login`.

- [ ] **Step 1: Rewrite `next.config.mjs` (merge images config)**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
};

export default nextConfig;
```

Uses the CMS's wildcard host (`**.supabase.co`, superset of the frontend's single host) plus the frontend's `deviceSizes`/`imageSizes`/`formats` tuning.

- [ ] **Step 2: Create `vercel.json` (scoped function limits, no CORS)**

```json
{
  "functions": {
    "app/api/admin/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

The wildcard CORS headers block is dropped — admin API is now same-origin. Function limits apply only to admin routes (image upload etc.); the public `app/api/inquiry` route uses defaults.

- [ ] **Step 3: Create `.env.example`**

```bash
# ============================================================
# design4public unified — environment variables
# Copy to `.env.local` and fill in. `.env.local` is gitignored.
# ============================================================

# --- Supabase (Auth / PostgREST / Storage) ---
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret — server only, never expose>

# --- Email (inquiry form) ---
RESEND_API_KEY=<resend api key>

# --- DB migrations (used by scripts only, not at runtime) ---
DATABASE_URL=postgres://postgres.<project-ref>:<DB-PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Dropped per spec: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_UPLOAD_URL`, `NEXT_PUBLIC_ENV`. Added: `SUPABASE_SERVICE_ROLE_KEY` (admin), `RESEND_API_KEY` (inquiry). `OPENAI_API_KEY` is deferred to M6.

- [ ] **Step 4: Write the root `middleware.ts`**

```ts
// Admin-only route guard + cookie session refresh.
// Public site (everything outside /admin) is never matched. API routes enforce
// their own RBAC in lib/auth.ts; this guards admin page navigation.
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/admin/login', '/admin/signup']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  if (user && isPublic) {
    return NextResponse.redirect(new URL('/admin/projects', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 5: Verify and commit**

```bash
test -f middleware.ts && test -f vercel.json && test -f .env.example && test -f next.config.mjs && echo OK
grep -n "matcher" middleware.ts        # expect ['/admin/:path*']
git add -A && git commit -m "config: merge next.config/vercel/env, add /admin middleware guard"
```

**Risks/watch-fors:** The matcher `['/admin/:path*']` also covers `/admin/login` and `/admin/signup` — the `PUBLIC_PATHS` check inside the middleware is what lets unauthenticated users reach them, so keep both. With only `/admin/:path*` matched, the public site incurs zero middleware overhead. Do not re-add the CMS's broad matcher.

---

## Task 9: Rewrite admin imports, internal links, and API base; remove `_cms-import` residue

**Files:**
- Modify (imports/links): `app/admin/**`, `app/api/admin/**`, `components/admin/**`, `lib/admin-api.ts`
- Move (kept): `_cms-import/migrations` → `migrations/`; `_cms-import/scripts` → `scripts/`
- Delete: remaining `_cms-import/**`

**Interfaces:**
- Consumes: the moved modules from Tasks 3–5 (`@/components/admin/*`, `@/lib/supabase/*`, `@/lib/admin-api`, `@/lib/admin-types`).
- Produces: an admin tree whose imports and navigation resolve under the unified layout, and a clean repo with no `_cms-import/`.

- [ ] **Step 1: Rewrite `@/` import aliases across admin code**

Run these in order (order matters: `supabase-admin`/`supabase-server` before the bare `supabase`). Scope: `app/admin`, `app/api/admin`, `components/admin`.

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
FILES=$(git ls-files 'app/admin/**' 'app/api/admin/**' 'components/admin/**' | grep -E '\.(ts|tsx)$')

# Supabase client aliases (specific first)
echo "$FILES" | xargs sed -i '' "s|@/lib/supabase-admin|@/lib/supabase/admin|g"
echo "$FILES" | xargs sed -i '' "s|@/lib/supabase-server|@/lib/supabase/server|g"
# bare browser client: match the quote so we don't touch /admin or /server just rewritten
echo "$FILES" | xargs sed -i '' "s|@/lib/supabase'|@/lib/supabase/browser'|g"

# Component aliases
echo "$FILES" | xargs sed -i '' "s|@/components/ui|@/components/admin/ui|g"
echo "$FILES" | xargs sed -i '' "s|@/components/MainLayout|@/components/admin/MainLayout|g"
echo "$FILES" | xargs sed -i '' "s|@/components/ClientLayout|@/components/admin/ClientLayout|g"
echo "$FILES" | xargs sed -i '' "s|@/components/Sidebar|@/components/admin/Sidebar|g"
echo "$FILES" | xargs sed -i '' "s|@/contexts/AuthContext|@/components/admin/AuthContext|g"

# Admin api wrapper + admin types
echo "$FILES" | xargs sed -i '' "s|@/lib/api'|@/lib/admin-api'|g"
echo "$FILES" | xargs sed -i '' "s|@/types'|@/lib/admin-types'|g"
```

Also fix the two moved files that reference these by their internal imports:

```bash
# AuthContext (now components/admin/) imports the browser client
sed -i '' "s|@/lib/supabase'|@/lib/supabase/browser'|g" components/admin/AuthContext.tsx
# MainLayout imports the admin api wrapper
sed -i '' "s|@/lib/api'|@/lib/admin-api'|g" components/admin/MainLayout.tsx
```

- [ ] **Step 2: Point the admin API wrapper at `/api/admin`**

`lib/admin-api.ts` line 5 currently reads `const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'`. Replace with:

```ts
const API_BASE_URL = '/api/admin'
```

Also fix its type import at the top (`import type { UploadResponse } from '@/types'`):

```bash
sed -i '' "s|from '@/types'|from '@/lib/admin-types'|g" lib/admin-api.ts
```

The wrapper's `endpoint.startsWith('/api') ? endpoint : \`${API_BASE_URL}${endpoint}\`` logic means callers passing bare paths (`/projects`) now hit `/api/admin/projects`. Guard against callers that hard-code `/api/...` (which would bypass the `/admin` prefix):

```bash
grep -rn "'/api/\|\`/api/\|\"/api/" app/admin components/admin | grep -v "/api/admin" | head
```

Expected: **no output**. If any appear, rewrite that literal `/api/...` → `/api/admin/...`.

- [ ] **Step 3: Rewrite admin internal navigation links to the `/admin` prefix**

Only navigation contexts (never API endpoint args, which the wrapper prefixes). Scope: `app/admin`, `components/admin`. This regex prefixes a top-level admin route only when it follows `router.push(`, `router.replace(`, `redirect(`, `href=`, `href =`, `href ===`, or `new URL(` with an opening quote/backtick:

```bash
NAV=$(git ls-files 'app/admin/**' 'components/admin/**' | grep -E '\.(ts|tsx)$')
echo "$NAV" | xargs sed -i '' -E "s#(router\.(push|replace)\(|redirect\(|new URL\()(['\"\`])/(projects|items|brands|photos|categories|managers|home-settings|login|signup)#\1\3/admin/\4#g"
echo "$NAV" | xargs sed -i '' -E "s#(href[[:space:]]*=+[[:space:]]*)(['\"\`])/(projects|items|brands|photos|categories|managers|home-settings|login|signup)#\1\2/admin/\3#g"
```

Then **manually review** the diff and check for accidental double-prefixing or missed spots:

```bash
grep -rn "/admin/admin/" app/admin components/admin   # expect: no output
git diff --stat app/admin components/admin
```

Cross-check that API calls were NOT rewritten (they must stay bare so the wrapper prefixes them):

```bash
grep -rn "api\.\(get\|post\|put\|patch\|del\|delete\)(\s*['\"\`]/admin/" app/admin components/admin  # expect: no output
```

- [ ] **Step 4: Relocate migrations, scripts, and tests; then remove the residue**

Stage the CMS test suites into `tests/_cms-incoming/` (Task 10 transforms them from there), relocate migrations/scripts, and delete everything else:

```bash
mkdir -p tests
git mv _cms-import/__tests__ tests/_cms-incoming
git mv _cms-import/migrations migrations
git mv _cms-import/scripts scripts
git rm -r _cms-import
```

Verify the tree is clean of the import zone and stray CMS configs:

```bash
test ! -d _cms-import && echo "residue removed"
ls tests/_cms-incoming     # unit api integration e2e
ls migrations | head -3    # 001_add_slug_columns.sql ...
ls scripts                 # run-migration.mjs provision-e2e-master.mjs backup-before-020.mjs verify_image_migration.py
```

- [ ] **Step 5: Typecheck the whole tree to catch missed rewrites**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. Common misses surface here as "Cannot find module '@/…'" — fix the specific alias and re-run.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(admin): rewrite imports + internal links to /admin, point admin-api at /api/admin, drop _cms-import"
```

**Risks/watch-fors:**
- The bare-`@/lib/supabase'` sed relies on the trailing quote; run it AFTER the `-admin`/`-server` seds so those aren't clobbered. Verify: `grep -rn "@/lib/supabase" app/admin components/admin lib | grep -v "supabase/"` should be empty.
- The nav-link regex could in principle touch a same-named API literal, but API calls go through `api.*(...)` (not `href`/`router.push`), so the Step 3 cross-check catches any bleed. Do not skip the manual diff review.
- `NEXT_PUBLIC_API_BASE_URL` is now fully removed; confirm `grep -rn "NEXT_PUBLIC_API_BASE_URL\|NEXT_PUBLIC_UPLOAD_URL\|NEXT_PUBLIC_ENV" app lib components` is empty.

---

## Task 10: Migrate CMS Jest tests to Vitest; relocate Playwright specs

**Files:**
- Move: `tests/_cms-incoming/{unit,api,integration}/**` → `tests/unit/admin/**` (staged by Task 9 Step 4)
- Move: `tests/_cms-incoming/e2e/**` → `tests/e2e/admin/**`
- Edit: `vitest.config.ts`, `vitest.setup.ts`; create `playwright.config.ts`
- Delete: `jest.setup.ts` (frontend), `tests/_cms-incoming/` (after emptying)

**Interfaces:**
- Consumes: `@/lib/*`, `@/components/admin/*` (post-Task-4/5 paths).
- Produces: `tests/unit/admin/**` Vitest suites (green) and `tests/e2e/admin/**` Playwright specs (may skip without env).

- [ ] **Step 1: Move the CMS unit/api/integration suites into `tests/unit/admin/`**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
mkdir -p tests/unit/admin/lib tests/unit/admin/components tests/unit/admin/api tests/unit/admin/integration
git mv tests/_cms-incoming/unit/lib/dto.test.ts        tests/unit/admin/lib/dto.test.ts
git mv tests/_cms-incoming/unit/lib/slug.test.ts       tests/unit/admin/lib/slug.test.ts
git mv tests/_cms-incoming/unit/lib/auth-rbac.test.ts  tests/unit/admin/lib/auth-rbac.test.ts
git mv tests/_cms-incoming/unit/lib/api.test.ts        tests/unit/admin/lib/api.test.ts
git mv tests/_cms-incoming/unit/components/Sidebar.test.tsx tests/unit/admin/components/Sidebar.test.tsx
git mv tests/_cms-incoming/api/auth.test.ts            tests/unit/admin/api/auth.test.ts
git mv tests/_cms-incoming/api/projects.test.ts        tests/unit/admin/api/projects.test.ts
git mv tests/_cms-incoming/integration/auth-flow.test.tsx tests/unit/admin/integration/auth-flow.test.tsx
```

- [ ] **Step 2: Move the Playwright specs into `tests/e2e/admin/`, then drop the staging dir**

```bash
mkdir -p tests/e2e/admin
git mv tests/_cms-incoming/e2e/navigation.spec.ts tests/e2e/admin/navigation.spec.ts
git mv tests/_cms-incoming/e2e/login.spec.ts      tests/e2e/admin/login.spec.ts
# staging dir should now hold only .DS_Store; remove it
git rm -r --ignore-unmatch tests/_cms-incoming 2>/dev/null; rm -rf tests/_cms-incoming
test ! -d tests/_cms-incoming && echo "staging removed"
```

- [ ] **Step 3: Codemod Jest globals → Vitest in the moved unit suites**

```bash
UNIT=$(git ls-files 'tests/unit/admin/**' | grep -E '\.(ts|tsx)$')
echo "$UNIT" | xargs sed -i '' \
  -e 's/\bjest\.fn\b/vi.fn/g' \
  -e 's/\bjest\.mock\b/vi.mock/g' \
  -e 's/\bjest\.spyOn\b/vi.spyOn/g' \
  -e 's/\bjest\.clearAllMocks\b/vi.clearAllMocks/g' \
  -e 's/\bjest\.resetAllMocks\b/vi.resetAllMocks/g' \
  -e 's/\bjest\.restoreAllMocks\b/vi.restoreAllMocks/g' \
  -e 's/\bjest\.requireActual\b/vi.importActual/g' \
  -e 's/\bjest\.mocked\b/vi.mocked/g'
```

Add a Vitest import where `vi` is now used but not imported (globals are on via config, but explicit import is safest for `vi`):

```bash
for f in $UNIT; do
  if grep -q "\bvi\." "$f" && ! grep -q "from 'vitest'\|from \"vitest\"" "$f"; then
    sed -i '' '1i\
import { vi } from "vitest";
' "$f"
  fi
done
```

Then rewrite aliases the same way as Task 9 (these tests import `@/lib/*`, `@/components/*`, `@/types`):

```bash
echo "$UNIT" | xargs sed -i '' \
  -e "s|@/lib/supabase-admin|@/lib/supabase/admin|g" \
  -e "s|@/lib/supabase-server|@/lib/supabase/server|g" \
  -e "s|@/lib/supabase'|@/lib/supabase/browser'|g" \
  -e "s|@/lib/api'|@/lib/admin-api'|g" \
  -e "s|@/types'|@/lib/admin-types'|g" \
  -e "s|@/components/ui|@/components/admin/ui|g" \
  -e "s|@/components/Sidebar|@/components/admin/Sidebar|g" \
  -e "s|@/components/MainLayout|@/components/admin/MainLayout|g" \
  -e "s|@/contexts/AuthContext|@/components/admin/AuthContext|g"
```

- [ ] **Step 4: Fold the CMS Jest setup (localStorage/matchMedia mocks + env) into the Vitest setup**

Replace `vitest.setup.ts` with the merged setup (keeps the existing jest-dom + node-fetch shim, adds the admin mocks using `vi`):

```ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// node-fetch shim for suites that hit the network layer.
if (!globalThis.fetch && typeof process !== "undefined" && process.env.VITEST) {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const { default: fetch } = await import("node-fetch");
    return fetch(input as any, init as any) as unknown as Promise<Response>;
  };
}

// Admin component test mocks (ported from CMS jest.setup.js).
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
// @ts-expect-error test env stub
global.localStorage = localStorageMock;

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
```

- [ ] **Step 5: Update `vitest.config.ts` to include the admin dir and drop the removed `jest.setup.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, "./")}/`,
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    reporters: process.env.CI ? ["github", "default"] : ["default"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
```

Delete the now-merged frontend Jest setup:

```bash
git rm jest.setup.ts
```

- [ ] **Step 6: Run the unit suite**

```bash
npm test -- --run 2>&1 | tail -30
```

Expected: all `tests/unit/admin/**` suites pass (plus any pre-existing site suites). Fix per-test API drift surfaced here (e.g. a leftover `jest.` reference the codemod missed, or a mock factory that needs `vi.mock`'s hoisting semantics). `vi.mock` is hoisted like `jest.mock`, so factory-style mocks port directly.

- [ ] **Step 7: Sanity-check the Playwright config still resolves the relocated specs**

The existing frontend has no Playwright config; the CMS one was left in `_cms-import`. Create a root `playwright.config.ts` pointing at the new dir (specs may skip without env — acceptable for M1):

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

Verify discovery (does not run them):

```bash
npx playwright test --list 2>&1 | tail -20   # expect it to list tests/e2e/admin/*.spec.ts
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "test: migrate CMS Jest suites to Vitest (tests/unit/admin), relocate Playwright specs (tests/e2e/admin)"
```

**Risks/watch-fors:** jest→vitest API diffs: `jest.fn`→`vi.fn`, `jest.mock`→`vi.mock`, `jest.spyOn`→`vi.spyOn`, `jest.requireActual`→`vi.importActual`, `jest.mocked`→`vi.mocked`. `vi.mock` is hoisted; module-factory mocks that referenced out-of-scope vars must use `vi.hoisted` — surface any such failure rather than forcing it. The CMS suites assumed `moduleNameMapper @/ → src/`; the unified alias is `@/ → root`, already handled by the config's regex alias. `tests/e2e/**` is excluded from Vitest's `include` and from Playwright's separate config — the two runners never collide.

---

## Task 11: Build / lint / test / dev-render gate

**Files:** none (verification only)

**Interfaces:** consumes the whole merged tree.

- [ ] **Step 1: Type-check**

```bash
cd /Users/jaehwanlee/development/d4p/design4public-frontend
npx tsc --noEmit
```

Expected: exit 0, no errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors (warnings tolerable). Fix any real errors; do not blanket-disable rules.

- [ ] **Step 3: Unit tests**

```bash
npm test -- --run
```

Expected: all suites pass.

- [ ] **Step 4: Production build**

```bash
npm run build
```

Expected: `next build` completes. The route table lists both `/` (and site routes) and `/admin/*` + `/api/admin/*`. No "Module not found" or CSS errors.

- [ ] **Step 5: Dev smoke — site home and admin login render**

```bash
npm run dev &   # or run in a separate shell; wait for "Ready"
sleep 6
curl -s -o /dev/null -w "site / => %{http_code}\n"      http://localhost:3000/
curl -s -o /dev/null -w "admin login => %{http_code}\n" http://localhost:3000/admin/login
# unauthenticated /admin/projects should redirect to /admin/login (307/308)
curl -s -o /dev/null -w "admin guard => %{http_code}\n" http://localhost:3000/admin/projects
kill %1 2>/dev/null
```

Expected: `/` → 200 with site chrome; `/admin/login` → 200; `/admin/projects` → 307/308 redirect (middleware guard). If you have a browser tool available, additionally confirm `/` shows the site header/footer and `/admin/login` shows the vapor-styled login form (styles isolated correctly).

- [ ] **Step 6: Final residue and constraint checks**

```bash
test ! -d _cms-import && echo "no residue"
grep -rn "NEXT_PUBLIC_API_BASE_URL\|NEXT_PUBLIC_UPLOAD_URL\|NEXT_PUBLIC_ENV" app lib components middleware.ts && echo "STALE ENV FOUND" || echo "env clean"
grep -rn "@/components/d4p\|@/lib/supabase-admin\|@/lib/supabase-server\|@/contexts/" app components lib && echo "STALE ALIAS FOUND" || echo "aliases clean"
```

Expected: "no residue", "env clean", "aliases clean".

- [ ] **Step 7: Commit (if any fixes were made)**

```bash
git add -A && git commit -m "chore(m1): green build/lint/test gate for unified repo" || echo "nothing to commit"
```

**Risks/watch-fors:** If `next build` fails on the admin CSS layer order or a vapor import, confirm `app/admin/globals.css` kept its exact `@layer`/`@import` order (Task 7 Step 3). If the site build fails on a `tailwindcss-animate` utility, apply the Task 7 Step 7 fallback. Keep the dev server bound to port 3000 (Playwright/webServer assumes it).

---

## Self-Review

**Spec coverage (team-lead M1 scope):**
1. Branch `unify/m1-repo-merge` — Task 1. ✅
2. `git subtree` into `_cms-import/` (history preserved) — Task 1. ✅ Restructure: site→`(site)` (Task 2), admin pages→`app/admin` + API→`app/api/admin` (Task 3), components d4p→site / CMS→admin (Task 4), lib merge incl. unified `supabase/` trio (Task 5), middleware matcher `['/admin/:path*']` + `/admin/login` redirect (Task 8), CMS links/imports rewritten (Task 9). ✅
3. Dependency merge (single `package.json`, Next 14.2.32/React 18.3.1/Tailwind v4) — Task 6; Tailwind v3→v4 migration via `@config` reuse of the v3 tokens, shadcn compat kept, site CSS in `(site)/layout.tsx` / vapor CSS in `admin/layout.tsx` — Tasks 7, 2, 3. ✅
4. Unified `next.config` (wildcard `**.supabase.co` + deviceSizes/formats) + `vercel.json` (no CORS, limits scoped to `app/api/admin/**`) — Task 8. ✅
5. Unified `.env.example`, drops the three `NEXT_PUBLIC_*` vars — Task 8. ✅
6. CMS Jest→Vitest in `tests/unit/admin/`, Playwright→`tests/e2e/admin/` (may skip) — Task 10. ✅
7. Gate: `next build`, `npm test`, `npm run lint`, dev renders `/` and `/admin/login` — Task 11. ✅
- Site pages keep `lib/api.ts` unchanged (only its supabase import repointed) — Task 5 Step 5. ✅
- NOT-in-M1 items (revalidation, search, SEO, supabase CLI dir, data-model) — untouched. ✅

**Placeholder scan:** No "TBD"/"similar to Task N"/"add error handling" — every code step shows real content. The only forward-references are deliberate dangling imports (Task 2/3 create files whose `@/components/...` targets land in Task 4), each flagged in its watch-fors.

**Type/name consistency:** `createServerSupabase`, `supabaseAdmin`, `requireRole`, `API_BASE_URL='/api/admin'`, alias `@/*`→root, `@/components/admin/*`, `@/lib/supabase/{browser,server,admin,public}` used consistently across Tasks 5, 8, 9, 10. `database.types.ts` bridges CMS enum names in Task 5 Step 6.

**Ordering:** Tasks execute cleanly in numeric order 1→11. Task 9 Step 4 stages `_cms-import/__tests__` into `tests/_cms-incoming/` before removing the residue, and Task 10 sources from that staging dir — so Task 9's `git rm -r _cms-import` no longer strands the specs.
