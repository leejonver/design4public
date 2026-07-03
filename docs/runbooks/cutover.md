# M7 Production Cutover Runbook

Cut `design4public.com` over to the unified repo/Vercel project. **Additive
migrations only** — production data is untouched (the one destructive migration
is M11, gated separately). Full backup exists at
`/Users/jaehwanlee/development/d4p/backups/` (schema + data + auth/storage).

## 1. Merge order (dependency chain)
Merge the milestone branches in order onto the release branch:
M1 → M2 → M3 → M4 → M5 → M6 → M8 → M9 → M10 → M12
(each was reviewed + live-gated on its own PR; recorded PR numbers: M1–M6 = #1–#6,
M8 = #7, M9 = #8, M10 = #9). Do not reorder — later milestones build on earlier schema/types.

## 2. Vercel environment
Inject the runtime secrets on the unified Vercel project (all envs that run
server code): `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, plus the public
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Confirm the admin
API routes and backfill both see the service-role key at runtime.

## 3. Preview QA
Deploy a preview; run through `docs/qa-checklist.md`: admin login/CRUD, site
pages, search (KR + EN), revalidation (edit → site reflects), OG images, robots.

## 4. Apply additive migrations to production
Apply `supabase/migrations/*` additively, including:
- `20260703150000_public_grants.sql` (no-op on prod where grants already exist)
- `20260703160000_photo_captions.sql` (adds `photos.ai_caption`, `ai_caption_model`)
Verify RLS policies are live (grants present) — a clean DB missing table GRANTs
turns every policy into dead code (42501).

## 5. Backfill (order matters)
Run against production per `docs/runbooks/backfill.md`: **captions first**, then
`backfill:search --all`.

## 6. Promote + domain
Promote the preview to production. Point `design4public.com` at it. Redirect
`cms.design4public.com` → `/admin` on the unified project.

## 7. Archive
Archive the legacy `d4p-cms` repo once the admin surface is confirmed live on
`/admin`.
