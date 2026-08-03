# design4public

Unified Next.js app for design4public.com — public site (`app/(site)`), admin CMS
(`app/admin` + `app/api/admin`), and a pgvector + trigram hybrid search with
OpenAI caption/embedding enrichment. Single Vercel project, single Supabase DB.

## Stack
Next.js 15 · React 19 · TypeScript · Supabase (Postgres + pgvector + Storage,
RLS-scoped) · Tailwind v4 · @vapor-ui/core (admin) · Vitest · Playwright.

## Layout
- `app/(site)/…`   public pages (SSR/ISR)
- `app/admin/…`    admin UI (client components, @vapor-ui)
- `app/api/admin/…` admin REST route handlers (RLS via user session)
- `lib/`           supabase clients, auth, search, DTOs, `database.types.ts`
- `supabase/`      migrations + seed (local Docker stack)
- `scripts/`       backfill (captions, search) + `postprocess-types.mjs`
- `docs/`          plans, specs, runbooks, testing/QA/RLS docs

## Develop
```bash
npm ci
supabase start
npm run db:sync:prod                # read-only remote dump; excludes profiles/inquiries
npm run dev
```

`.env.local` points the app at the local Supabase stack. The production sync
command verifies the linked project ref, reads public production content, and
replaces only local content tables. It never writes to the linked database.
Use `npm run db:reset` instead when you need the deterministic synthetic seed
for E2E tests.

## Verify
```bash
npm run lint          # 0 warnings expected
npx tsc --noEmit
npm test -- --run     # vitest unit suite
npx playwright test   # E2E against the local stack — see docs/testing.md
```

## Types
`lib/database.types.ts` is generated + patched: `npm run gen:types` runs
`supabase gen types` then `scripts/postprocess-types.mjs` (profiles enum
narrowing + alias exports). Run it after `supabase db reset` so real columns
are present. Enum unions live here; `lib/admin-types.ts` re-exports them.

## Runbooks
- E2E harness: `docs/testing.md`
- Production-safe local data sync: `docs/local-development.md`
- Backfill (captions → search): `docs/runbooks/backfill.md`
- Production cutover (M7): `docs/runbooks/cutover.md`
