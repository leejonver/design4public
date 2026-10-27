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
Use `npm run e2e:start` for a separate synthetic E2E database; this preserves
your development content. See [testing](docs/testing.md).

## Verify
```bash
npm run lint          # 0 warnings expected
npx tsc --noEmit
npm test -- --run     # vitest unit suite
npm run e2e:start
npm run test:e2e      # isolated DB and server — see docs/testing.md
npm run e2e:stop
```

## Types
`lib/database.types.ts` is generated + patched: `npm run gen:types` runs
`supabase gen types` then `scripts/postprocess-types.mjs` (profiles enum
narrowing + alias exports). Run it after applying local migrations so real columns
are present. Enum unions live here; `lib/admin-types.ts` re-exports them.

## Runbooks
- Documentation index: `docs/README.md`
- E2E harness: `docs/testing.md`
- Production-safe local data sync: `docs/local-development.md`
- Backfill (captions → search): `docs/runbooks/backfill.md`
- Production cutover (M7): `docs/runbooks/cutover.md`
