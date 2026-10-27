# E2E testing

The suite covers public browsing, admin CRUD/uploads/invites, content propagation,
and REST-level RLS. Use an isolated local Supabase project so the development DB
can retain its production-copy content.

## Setup and run

Prerequisites: Docker/Colima, Supabase CLI, `npm ci`, and
`npx playwright install chromium`.

```bash
npm run e2e:start
npm run test:e2e
npm run e2e:stop
```

`e2e:start` copies migrations and synthetic seed data into ignored `.e2e-stack/`
inside the workspace (Colima must be able to mount it). It starts project
`design4public-e2e` on API **55321**, DB **55322**, and Mailpit **55324**, writes
ignored `.env.test.local`, and uploads the six fixture images. It never resets
the development DB. Existing isolated volumes are preserved across starts/stops.
For schema changes, apply migrations explicitly with
`supabase migration up --workdir .e2e-stack`; this does not reseed existing data.

Playwright builds and owns its Next production server on **3100** and uses `.next-e2e/`, leaving the
normal server/build alone. An occupied port fails instead of reusing an unknown
server. `.env.test.local` overrides committed `.env.test`; shell variables take
precedence. Remote Supabase hosts are rejected. OpenAI and Resend keys are blank
in the test server; invitations go to local Mailpit.

Setup provisions three synthetic users and saves ignored browser auth states.
Every project depends on setup, so a single-suite run also prepares its users:

```bash
npx playwright test --project=site
npx playwright test --project=admin
npx playwright test --project=integration
npx playwright test --project=security
```

The HTML report is in `playwright-report/`; failures include screenshots and
first-retry traces under `test-results/`. Never commit auth state or local keys.

## Full verification

```bash
npm run e2e:start
npm run gate
npm run e2e:stop
```

The gate runs TypeScript, ESLint, unit tests, a production build, then E2E once.
E2E builds separately with synthetic local data to exercise production caching.
Do not use `db:reset` on a development DB containing a production copy just to run
tests. Normal local migration/type generation is documented in [recipes](recipes.md).

## Fixtures

- Published projects: `gangnam-office` (featured), `pangyo-library`
- Draft: `draft-project`
- Brands: `herman-miller`, `vitra`
- Items: `aeron-chair`, `eames-lounge`, `hidden-desk`
- Master/content manager/logout credentials: `.env.test` (local fixtures only)

Invite tests poll Mailpit's `/api/v1/search` and `/api/v1/message/<id>` endpoints.
`E2E_MAILPIT_URL` selects the isolated mailbox. Storage fixtures are small synthetic
images; live visual checks are still needed for real project photography.
