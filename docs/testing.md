# E2E Testing (Local Supabase)

The E2E harness runs entirely against a **local** Supabase stack (Docker). It never
touches production — `tests/e2e/global.setup.ts` hard-fails if the Supabase URL host
is not `127.0.0.1`/`localhost`.

## Prerequisites
- Docker running
- Supabase CLI ≥ 2.98.2 (`supabase --version`)
- `npm ci`
- Chromium for Playwright: `npx playwright install chromium`
- After `supabase db reset`, run `npm run gen:types` against the fully-migrated
  DB so `lib/database.types.ts` includes real columns before
  `scripts/postprocess-types.mjs` runs (chained automatically by `gen:types`).

## One-time / per-session
```bash
supabase start          # boots Postgres(54322) + API(54321) + Storage
supabase db reset       # applies supabase/migrations/* then supabase/seed.sql
docker restart supabase_kong_design4public   # REQUIRED after every db reset:
                        # reset restarts GoTrue but leaves Kong on the stale
                        # upstream → 502 on all /auth/v1 until Kong is restarted.
```

## First live run
The `admin` and `integration` Playwright projects depend on the `setup` project,
which provisions the `master`/`content_manager` test users and writes their
storage state to `tests/e2e/.auth/*.json` (gitignored). Run the full sequence
in order the first time (and any time the local stack is reset):

```bash
supabase start
supabase db reset
docker restart supabase_kong_design4public   # REQUIRED after every db reset:
                        # reset restarts GoTrue but leaves Kong on the stale
                        # upstream → 502 on all /auth/v1 until Kong is restarted.
npx playwright test --project=setup   # writes tests/e2e/.auth/master.json, manager.json
```

After that, `npx playwright test` (or any single project) picks up the saved
auth state automatically.

## Run everything
```bash
npm run lint
npx tsc --noEmit
npm test -- --run        # vitest unit suite
npx playwright test      # setup → site (parallel) + admin/integration (serial)
```

## Run one suite
```bash
npx playwright test --project=site
npx playwright test --project=admin
npx playwright test --project=integration
```

## Teardown
```bash
supabase stop
```

## Env
`.env.test` (committed; local dev keys only) points the E2E `next dev` server at the
local stack. Playwright's `webServer.env` forwards these so a stray `.env.local` cannot
redirect the server at a remote DB.

`dotenv` v17 prints promotional tips to stdout on load, which pollutes Playwright's
output. Silence them by exporting `DOTENV_CONFIG_QUIET=true` in your shell (or CI env)
before running `npx playwright test`.

## Reading emails in tests (Inbucket)
`invite.spec.ts` verifies the invite flow end to end by polling Inbucket's REST API
instead of a UI mailbox: `GET {INBUCKET}/api/v1/mailbox/{localpart}` (localpart is the
part of the test email before `@`) returns the mailbox's message list, sorted here by
`date` to find the newest entry; a second `GET .../mailbox/{localpart}/{id}` fetches
that message's body (`html` falling back to `text`), from which the accept link is
extracted with a regex on the first `href="https?://..."` (or bare URL) match. The poll
retries every 500ms up to 20 times to absorb Inbucket delivery lag.

## Seed data (assert against these)
- Published projects: `gangnam-office` (featured), `pangyo-library`
- Draft (never public): `draft-project`
- Brands: `herman-miller`, `vitra`
- Items: `aeron-chair`, `eames-lounge`, `hidden-desk`
- Test users: `master@e2e.local` (master) / `cm@e2e.local` (content_manager)
