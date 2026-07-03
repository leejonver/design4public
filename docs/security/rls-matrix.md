# RLS Authorization Matrix (M8)

Roles: **anon** (public site, anon key), **authenticated** (any signed-in Supabase
session), **staff** (authenticated AND `public.has_role('content_manager')` =
approved content_manager/admin/master), **master** (`has_role('master')`),
**service** (service-role key — bypasses RLS entirely; used by upload, auth,
managers, and the search indexer).

Legend: ✅ allowed · ❌ denied · `pub` = published-project gate · `self` = own row.

## Content tables (after M8)

| table | anon SELECT | anon write | staff SELECT | staff write | service |
|---|---|---|---|---|---|
| projects | ✅ pub only | ❌ | ✅ all | ✅ insert/update/delete | ✅ all |
| project_photos | ✅ pub only | ❌ | ✅ all | ✅ | ✅ all |
| photos | ✅ pub-project OR item-gallery | ❌ | ✅ all | ✅ | ✅ all |
| project_items | ✅ pub only | ❌ | ✅ all | ✅ | ✅ all |
| project_categories | ✅ pub only | ❌ | ✅ all | ✅ | ✅ all |
| project_tags | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| items | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| item_categories | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| item_tags | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| photo_items | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| photo_tags | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| brands | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| categories | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| tags | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| home_featured | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| site_settings | ✅ all | ❌ | ✅ all | ✅ | ✅ all |
| search_index | ✅ all (M6) | ❌ | ✅ all | ❌ (service only) | ✅ all |

## Identity / privacy tables (after M8)

| table | anon | authenticated (non-staff) | staff/master | service |
|---|---|---|---|---|
| profiles SELECT | ❌ | ✅ self only | master: ✅ all | ✅ all |
| profiles UPDATE | ❌ | ❌ | master: ✅ all | ✅ all |
| profiles INSERT | ❌ | ✅ self only (`users_insert_own`) | — | ✅ all |
| inquiries INSERT | ✅ (contact form) | ✅ | ✅ | ✅ all |
| inquiries SELECT | ❌ | ✅ (unchanged from baseline) | ✅ | ✅ all |

## Policy change log — migration `20260703140000_rls_hardening.sql`

Every drop/create pair applied by the M8 hardening migration.

### Task 2 — `has_role()` helper + profiles hardening
| table | dropped | created | reason |
|---|---|---|---|
| (function) | — | `public.has_role(text)` SECURITY DEFINER | recursion-safe role check for profiles + content policies |
| profiles | `authenticated_select_all` (SELECT) | `profiles_select_self_or_master` (SELECT) | any session could read every profile → self-or-master |
| profiles | `authenticated_update_all` (UPDATE) | `profiles_update_master` (UPDATE) | any session could edit every profile → master-only |
| profiles | `users_update_own` (UPDATE) | — | closes self-role-escalation vector (edit own role) |
| profiles | — kept — | `users_select_own`, `users_insert_own`, `service_role_all` | unchanged from baseline |

### Task 3 — restore 009 draft-photo gating + staff SELECT-all
| table | dropped | created | reason |
|---|---|---|---|
| project_photos | `project_photos_select_public` (SELECT, unconditional) | `project_photos_select_published` (SELECT, published-project gate) | draft/hidden project images were publicly readable (009 regression) |
| photos | `photos_select_public` (SELECT, unconditional) | `photos_select_published_or_item` (SELECT, published-project OR item-gallery) | same leak; item-gallery branch keeps item-detail galleries working |
| projects | — | `projects_select_staff` (SELECT, authenticated + has_role) | staff read drafts via RLS client |
| project_photos | — | `project_photos_select_staff` (SELECT, authenticated + has_role) | staff read draft images via RLS client |
| photos | — | `photos_select_staff` (SELECT, authenticated + has_role) | staff read draft images via RLS client |
| project_items | — | `project_items_select_staff` (SELECT, authenticated + has_role) | staff read draft joins via RLS client |
| project_categories | — | `project_categories_select_staff` (SELECT, authenticated + has_role) | staff read draft joins via RLS client |

### Task 4 — content write policies require approved staff + projects DELETE
Every baseline write policy gated only `auth.role() = 'authenticated'` (any signed-in
session). Each is replaced with a `has_role('content_manager')` gate. Baseline
read-only `authenticated` SELECT policies on `brands`/`categories`/`inquiries`/`items`
are intentionally kept (they carry no write predicate).

| table | dropped | created | reason |
|---|---|---|---|
| projects | `General users can create projects` (INSERT), `Users can update own projects` (UPDATE), `Admins and masters can update all projects` (UPDATE) | `projects_insert_staff` (INSERT), `projects_update_staff` (UPDATE) | any authenticated session could create/update projects → approved staff only |
| projects | `Authenticated users can view all projects` (SELECT) | — (Task 3 `projects_select_staff` already covers staff draft reads) | any authenticated (incl. pending) session could read drafts |
| projects | — (baseline had NO delete policy) | `projects_delete_staff` (DELETE) | RLS-client delete would silently affect 0 rows without this |
| items | `Authenticated users can manage items` (ALL) | `items_write_staff` (ALL) | any-authenticated write → staff-only |
| brands | `Authenticated users can manage brands` (ALL) | `brands_write_staff` (ALL) | any-authenticated write → staff-only |
| categories | `Authenticated users can manage tags` (ALL) | `categories_write_staff` (ALL) | any-authenticated write → staff-only |
| project_items | `Authenticated users can manage project items` (ALL) | `project_items_write_staff` (ALL) | any-authenticated write → staff-only |
| project_categories | `Authenticated users can manage project tags` (ALL) | `project_categories_write_staff` (ALL) | any-authenticated write → staff-only |
| photos | `photos_insert_authenticated` (INSERT), `photos_update_authenticated` (UPDATE), `photos_delete_authenticated` (DELETE) | `photos_write_staff` (ALL) | any-authenticated write → staff-only |
| project_photos | `project_photos_insert_authenticated` (INSERT), `project_photos_update_authenticated` (UPDATE), `project_photos_delete_authenticated` (DELETE) | `project_photos_write_staff` (ALL) | any-authenticated write → staff-only |
| photo_items | `photo_items_insert_authenticated` (INSERT), `photo_items_update_authenticated` (UPDATE), `photo_items_delete_authenticated` (DELETE) | `photo_items_write_staff` (ALL) | any-authenticated write → staff-only |
| tags | `tags_insert_authenticated` (INSERT), `tags_update_authenticated` (UPDATE), `tags_delete_authenticated` (DELETE) | `tags_write_staff` (ALL) | any-authenticated write → staff-only |
| item_tags | `item_tags_insert_auth` (INSERT), `item_tags_update_auth` (UPDATE), `item_tags_delete_auth` (DELETE) | `item_tags_write_staff` (ALL) | any-authenticated write → staff-only |
| project_tags | `project_tags_insert_auth` (INSERT), `project_tags_update_auth` (UPDATE), `project_tags_delete_auth` (DELETE) | `project_tags_write_staff` (ALL) | any-authenticated write → staff-only |
| photo_tags | `photo_tags_insert_auth` (INSERT), `photo_tags_update_auth` (UPDATE), `photo_tags_delete_auth` (DELETE) | `photo_tags_write_staff` (ALL) | any-authenticated write → staff-only |
| item_categories | `Allow all for authenticated` (ALL) | `item_categories_write_staff` (ALL) | any-authenticated write → staff-only (anon read policy `Allow read for anon` kept) |
| home_featured | `home_featured_write_auth` (ALL) | `home_featured_write_staff` (ALL) | any-authenticated write → staff-only |
| site_settings | `site_settings_write_auth` (ALL) | `site_settings_write_staff` (ALL) | any-authenticated write → staff-only |

Validated live (SET ROLE + JWT-claims simulation, all in rolled-back transactions):
approved content_manager can INSERT every content table + UPDATE/DELETE projects +
UPDATE site_settings; a pending (authenticated, non-approved) session and anon are
denied every write (INSERT → `42501 row-level security`, UPDATE/DELETE → 0 rows).

## Known residual risks (documented, not fixed in M8)
- `users_insert_own` lets a session insert its own profile row, but the
  `on_auth_user_created` trigger already inserts it first (PK conflict blocks a
  second insert with an escalated role), so it is not exploitable.
- `inquiries` SELECT stays `authenticated` (any session) rather than staff-only,
  because no admin API route reads inquiries through the RLS client and tightening
  it risks an unverified admin-page reader. Revisit if an inquiries admin route is added.
