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
- [ ] Anonymous REST read of `profiles`/`inquiries` is denied (see `docs/security/rls-matrix.md`); related anon-access regressions (draft project/photo visibility, cross-user profile writes) are covered by `tests/e2e/security/rls-rest.spec.ts`.
