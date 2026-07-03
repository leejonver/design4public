-- M8: RLS hardening. ADDITIVE / POLICY-ONLY — no table, column, or data changes.
-- Closes three gaps in the baseline RLS surface:
--   1. profiles: any authenticated session could SELECT/UPDATE every profile row
--      (privilege escalation). Restrict to self OR master via the SECURITY DEFINER
--      has_role() helper (avoids profiles-on-profiles recursion).
--   2. project_photos / photos: draft & hidden project images were publicly
--      SELECTable (regression of the migration-009 intent). Re-gate to published
--      projects, while keeping item-gallery photos and staff reads working.
--   3. content tables: writes were allowed to ANY authenticated session. Require an
--      APPROVED content_manager+ (has_role) to match app RBAC, add the missing
--      projects DELETE policy, and add staff SELECT-all policies so approved staff
--      still read drafts through the RLS client.
-- Service-role bypasses RLS, so applying this migration cannot break the current
-- admin app (all admin ops still run through supabaseAdmin until the code switch).

-- 1. Role helper. SECURITY DEFINER: the inner read of public.profiles runs as the
--    function owner with RLS bypassed, so a profiles policy may call it without
--    infinite recursion.
create or replace function public.has_role(min_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and (
        (min_role = 'content_manager' and role in ('content_manager','admin','master'))
        or (min_role = 'admin' and role in ('admin','master'))
        or (min_role = 'master' and role = 'master')
      )
  );
$$;
revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to anon, authenticated, service_role;

-- 2. profiles: replace blanket authenticated SELECT/UPDATE with self-or-master.
--    Removing users_update_own also closes the self-role-escalation vector.
drop policy if exists "authenticated_select_all" on public.profiles;
drop policy if exists "authenticated_update_all" on public.profiles;
drop policy if exists "users_update_own" on public.profiles;
create policy "profiles_select_self_or_master" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.has_role('master'));
create policy "profiles_update_master" on public.profiles
  for update to authenticated
  using (public.has_role('master'))
  with check (public.has_role('master'));
-- kept from baseline: users_select_own, users_insert_own, service_role_all.
