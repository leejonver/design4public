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

## Known residual risks (documented, not fixed in M8)
- `users_insert_own` lets a session insert its own profile row, but the
  `on_auth_user_created` trigger already inserts it first (PK conflict blocks a
  second insert with an escalated role), so it is not exploitable.
- `inquiries` SELECT stays `authenticated` (any session) rather than staff-only,
  because no admin API route reads inquiries through the RLS client and tightening
  it risks an unverified admin-page reader. Revisit if an inquiries admin route is added.
