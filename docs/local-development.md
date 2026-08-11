# Local development from production content

The hosted `design4public` Supabase database is the production source of truth.
Local development uses PostgreSQL 17 and a sanitized copy of its public content.
No command in this workflow writes to the linked project.

## One-time setup

```bash
supabase login --name design4public-dev
supabase link \
  --project-ref ftuudbxhffnbzjxgqagp \
  --profile design4public-dev
supabase start
```

## Refresh local content

```bash
npm run db:sync:prod
```

The sync command has explicit safety checks:

- accepts only the `ftuudbxhffnbzjxgqagp` project ref;
- uses `supabase db dump`, which reads the remote database;
- excludes `public.profiles` and `public.inquiries`;
- requires the exact local container `supabase_db_design4public`;
- requires local PostgreSQL 17 or newer;
- truncates and loads only local public-content tables.

It copies projects, items, photos, brands, categories, tags, relationships,
home settings, and the derived search index. Photo rows retain their public
hosted Storage URLs, so local pages display the real public assets without
copying the Storage bucket.

## Deterministic test data

The E2E suite must use the committed synthetic seed instead of production
content:

```bash
npm run db:reset
npx playwright test
```

The Playwright configuration hard-fails unless its Supabase URL is loopback.

## Schema drift

The linked project's historical migration timestamps predate the consolidated
local baseline. Do not run `supabase db push`, `supabase migration repair`, or
`supabase db reset --linked`. Compare with schema dumps first and reconcile in a
reviewed migration without modifying production during local setup.
