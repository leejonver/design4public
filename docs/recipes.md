# Recipes

## Environment variables
| Var | Required where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | local, prod | Supabase project URL (browser + server). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local, prod | Anon key for RLS-scoped client/session. |
| `SUPABASE_SERVICE_ROLE_KEY` | prod, scripts | Service role for admin uploads + backfill (bypasses RLS). |
| `DATABASE_URL` | scripts | Direct Postgres URL for backfill scripts. |
| `OPENAI_API_KEY` | prod, scripts (optional) | Caption (GPT-4o-mini) + embedding (text-embedding-3-small). Absent → captions/embeddings degrade to skip. |
| `RESEND_API_KEY` | prod (optional) | Inquiry notification email. Absent → inquiry logged to server console instead. |
| Auth email (invites) | prod | Supabase Auth sends the invite email. Local dev captures it in Inbucket (`127.0.0.1:54324`). Prod uses the Supabase default mailer unless custom SMTP is set in the dashboard (rate-limited; see cutover runbook). |

## Add a new content entity (the common maintenance task)
1. **Migration** — new additive `supabase/migrations/<ts>_<name>.sql` (table + indexes).
2. **RLS** — add policies + `GRANT`s; update `docs/security/rls-matrix.md`.
3. **Types** — `supabase db reset` then `npm run db:reset` (or `npm run gen:types`) so `lib/database.types.ts` picks up the columns; add the enum alias to `scripts/postprocess-types.mjs` if it introduces a text-enum.
4. **Admin API** — `app/api/admin/<entity>/route.ts` (list GET + POST) and `[id]/route.ts` (GET/PUT/DELETE); reuse `lib/list-query.ts` + `lib/pg-filter.ts` + `requireRole`.
5. **Admin UI** — `app/admin/<entity>/…` pages (client, @vapor-ui).
6. **Site** — fetcher in `lib/api.ts`, DTO in `lib/dto.ts`, page in `app/(site)/<entity>/…`.
7. **Revalidation** — add the tag to `lib/revalidation.ts` and call it from the admin write routes.
8. **Tests** — unit test the route; add an E2E spec if it has a public page.

## Invite a manager
1. `/admin/managers` → **관리자 초대** → email + role → 초대 보내기.
2. Invitee opens the link → sets a password at `/admin/invite/accept` → auto-activated.
3. Resend from the row's **초대 재전송**; revoke via **초대 취소** (deletes the pending auth user + profile).
Redirect URL (`<origin>/admin/invite/accept`) must be allowlisted in Supabase Auth → URL Configuration (local: `config.toml`; prod: dashboard).
