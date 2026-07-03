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

-- 3. project_photos: only images of PUBLISHED projects are publicly SELECTable
--    (mirrors the original migration-009 EXISTS gate).
drop policy if exists "project_photos_select_public" on public.project_photos;
create policy "project_photos_select_published" on public.project_photos
  for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_photos.project_id and p.status = 'published'
  ));

-- 4. photos: publicly SELECTable iff the photo is in a PUBLISHED project OR in an
--    item gallery (photo_items). The item-gallery branch keeps item-detail
--    galleries working (lib/api.ts fetchItemBySlug reads photo_items->photos).
drop policy if exists "photos_select_public" on public.photos;
create policy "photos_select_published_or_item" on public.photos
  for select
  using (
    exists (
      select 1 from public.project_photos pp
      join public.projects p on p.id = pp.project_id
      where pp.photo_id = photos.id and p.status = 'published'
    )
    or exists (
      select 1 from public.photo_items pi where pi.photo_id = photos.id
    )
  );

-- 5. Staff SELECT-all: approved staff read EVERYTHING (drafts included) through the
--    RLS client, so admin list + edit-form join reads keep working after the code
--    switch. anon is unaffected (these are TO authenticated and OR-combine with the
--    gated public policies above). Needed on the published-gated tables only.
create policy "projects_select_staff" on public.projects
  for select to authenticated using (public.has_role('content_manager'));
create policy "project_photos_select_staff" on public.project_photos
  for select to authenticated using (public.has_role('content_manager'));
create policy "photos_select_staff" on public.photos
  for select to authenticated using (public.has_role('content_manager'));
create policy "project_items_select_staff" on public.project_items
  for select to authenticated using (public.has_role('content_manager'));
create policy "project_categories_select_staff" on public.project_categories
  for select to authenticated using (public.has_role('content_manager'));
-- Baseline projects SELECT policies remain: "Everyone can view published projects"
-- (anon/pub) stays; "Authenticated users can view all projects" is replaced by the
-- staff policy in Task 4 so pending sessions cannot read drafts.

-- 6. projects: replace the "any authenticated" write policies with approved-staff
--    policies and ADD the missing DELETE policy (baseline had none — an RLS-client
--    delete would otherwise silently affect 0 rows).
drop policy if exists "General users can create projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Admins and masters can update all projects" on public.projects;
drop policy if exists "Authenticated users can view all projects" on public.projects;
create policy "projects_insert_staff" on public.projects
  for insert to authenticated with check (public.has_role('content_manager'));
create policy "projects_update_staff" on public.projects
  for update to authenticated
  using (public.has_role('content_manager'))
  with check (public.has_role('content_manager'));
create policy "projects_delete_staff" on public.projects
  for delete to authenticated using (public.has_role('content_manager'));

-- 7. Remaining content tables: replace "any authenticated" management with
--    approved-staff FOR ALL policies. Existing PUBLIC SELECT policies (using true
--    or published-gated) remain and OR-combine, so anon reads are unchanged.
drop policy if exists "Authenticated users can manage items" on public.items;
create policy "items_write_staff" on public.items
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "Authenticated users can manage brands" on public.brands;
create policy "brands_write_staff" on public.brands
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "Authenticated users can manage tags" on public.categories;
create policy "categories_write_staff" on public.categories
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "Authenticated users can manage project items" on public.project_items;
create policy "project_items_write_staff" on public.project_items
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "Authenticated users can manage project tags" on public.project_categories;
create policy "project_categories_write_staff" on public.project_categories
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

-- photos: keep the gated + staff SELECT policies from Task 3; replace the four
-- per-op authenticated write policies with approved-staff versions.
drop policy if exists "photos_insert_authenticated" on public.photos;
drop policy if exists "photos_update_authenticated" on public.photos;
drop policy if exists "photos_delete_authenticated" on public.photos;
create policy "photos_write_staff" on public.photos
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "project_photos_insert_authenticated" on public.project_photos;
drop policy if exists "project_photos_update_authenticated" on public.project_photos;
drop policy if exists "project_photos_delete_authenticated" on public.project_photos;
create policy "project_photos_write_staff" on public.project_photos
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "photo_items_insert_authenticated" on public.photo_items;
drop policy if exists "photo_items_update_authenticated" on public.photo_items;
drop policy if exists "photo_items_delete_authenticated" on public.photo_items;
create policy "photo_items_write_staff" on public.photo_items
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "tags_insert_authenticated" on public.tags;
drop policy if exists "tags_update_authenticated" on public.tags;
drop policy if exists "tags_delete_authenticated" on public.tags;
create policy "tags_write_staff" on public.tags
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "item_tags_insert_auth" on public.item_tags;
drop policy if exists "item_tags_update_auth" on public.item_tags;
drop policy if exists "item_tags_delete_auth" on public.item_tags;
create policy "item_tags_write_staff" on public.item_tags
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "project_tags_insert_auth" on public.project_tags;
drop policy if exists "project_tags_update_auth" on public.project_tags;
drop policy if exists "project_tags_delete_auth" on public.project_tags;
create policy "project_tags_write_staff" on public.project_tags
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "photo_tags_insert_auth" on public.photo_tags;
drop policy if exists "photo_tags_update_auth" on public.photo_tags;
drop policy if exists "photo_tags_delete_auth" on public.photo_tags;
create policy "photo_tags_write_staff" on public.photo_tags
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

-- item_categories baseline uses a single FOR ALL authenticated policy + anon read.
drop policy if exists "Allow all for authenticated" on public.item_categories;
create policy "item_categories_write_staff" on public.item_categories
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "home_featured_write_auth" on public.home_featured;
create policy "home_featured_write_staff" on public.home_featured
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));

drop policy if exists "site_settings_write_auth" on public.site_settings;
create policy "site_settings_write_staff" on public.site_settings
  for all to authenticated
  using (public.has_role('content_manager')) with check (public.has_role('content_manager'));
