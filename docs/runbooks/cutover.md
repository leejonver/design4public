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

## M14 — invite flow cutover (Supabase dashboard, manual)

Before the invite flow works in production, in the Supabase project dashboard:
1. **Auth → URL Configuration → Redirect URLs:** add `https://www.design4public.com/**`
   (and confirm **Site URL** = `https://www.design4public.com`). Without this, the invite
   link's `redirect_to` is rejected and the accept page never receives a session.
2. **Auth → Email Templates → "Invite user":** confirm the template's action link uses
   `{{ .ConfirmationURL }}`; optionally localize the copy to Korean. GoTrue delivers the
   session as implicit-flow tokens in the link's URL fragment. The `@supabase/ssr` browser
   client defaults to the PKCE flow and does **not** auto-consume those fragment tokens, so
   the accept page reads `access_token`/`refresh_token` from the fragment and calls
   `setSession` explicitly (the `token_hash` → `verifyOtp` branch is a fallback). No custom
   template is required.
3. **Auth → SMTP (deliverability):** the default Supabase mailer is shared + rate-limited and
   may not reliably deliver to external domains. For anything beyond occasional internal invites,
   configure custom SMTP (Resend is already an approved vendor here). Decide per volume; do not
   assume deliverability silently.
4. **Auth → Providers → Email:** disable public sign-ups. `inviteUserByEmail` is a service-role
   admin endpoint and is not gated by this setting, so invites keep working; disabling it closes
   off anonymous self-registration (the public `/admin/signup` route is already gone, so invites
   are the only entry path either way).
5. **Auth → Passwords:** set minimum length to **8** and require **letters and digits**. Local
   `supabase/config.toml` has enforced this server-side since commit `29187e2`
   (`minimum_password_length = 8`, `password_requirements = "letters_digits"`); the production
   dashboard must match, or prod will silently accept 6-character passwords the UI copy
   (`비밀번호 (최소 8자)`) claims to forbid.
