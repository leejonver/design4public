-- Baseline schema for local E2E. Authored from backups/schema_20260703_051836.sql
-- (production public-schema pg_dump). NOT produced by `supabase db pull`.
-- Legacy backup_020/backup_022 schemas and the unused project_image_type
-- composite from the dump are intentionally omitted.

-- Extensions -------------------------------------------------------------
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";

-- Enums ------------------------------------------------------------------
create type public.project_status as enum ('draft', 'published', 'hidden');
create type public.tag_type as enum ('project', 'item', 'photo', 'brand');

-- Functions --------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'content_manager', 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.update_updated_at_column() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables -----------------------------------------------------------------
create table public.brands (
  id uuid default gen_random_uuid() not null,
  name_ko text not null,
  description text,
  cover_image_url text,
  website_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  slug text not null,
  name_en text,
  logo_image_url text,
  status text default 'visible'::text not null,
  constraint brands_status_check check (status = any (array['visible'::text, 'hidden'::text]))
);

create table public.categories (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  type public.tag_type not null,
  constraint categories_type_check check (type = any (array['project'::public.tag_type, 'item'::public.tag_type]))
);

create table public.home_featured (
  id uuid default gen_random_uuid() not null,
  entity_type text not null,
  entity_id uuid not null,
  "order" integer default 0 not null,
  created_at timestamptz default now(),
  constraint home_featured_entity_type_check check (entity_type = any (array['project'::text, 'item'::text, 'photo'::text, 'brand'::text]))
);

create table public.inquiries (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  company text,
  project_slug text,
  message text not null,
  status text default 'pending'::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint inquiries_status_check check (status = any (array['pending'::text, 'read'::text, 'replied'::text]))
);

create table public.item_categories (
  item_id uuid not null,
  category_id uuid not null,
  created_at timestamptz default now() not null
);

create table public.item_tags (
  item_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz default now()
);

create table public.items (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  brand_id uuid,
  nara_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  slug text not null,
  status text default 'available'::text not null,
  constraint items_status_check check (status = any (array['available'::text, 'discontinued'::text, 'hidden'::text]))
);

create table public.photo_items (
  id uuid default gen_random_uuid() not null,
  photo_id uuid not null,
  item_id uuid not null,
  created_at timestamptz default now(),
  is_main boolean default false not null,
  "order" integer default 0 not null
);

create table public.photo_tags (
  photo_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz default now()
);

create table public.photos (
  id uuid default gen_random_uuid() not null,
  image_url text not null,
  alt_text text,
  title text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.profiles (
  id uuid not null,
  email text not null,
  role text default 'general'::text not null,
  status text default 'pending'::text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  name text,
  last_login_at timestamptz,
  constraint profiles_role_check check (role = any (array['master'::text, 'admin'::text, 'content_manager'::text])),
  constraint profiles_status_check check (status = any (array['pending'::text, 'approved'::text, 'rejected'::text]))
);

create table public.project_categories (
  project_id uuid not null,
  category_id uuid not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.project_items (
  project_id uuid not null,
  item_id uuid not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.project_photos (
  id uuid default gen_random_uuid() not null,
  project_id uuid not null,
  photo_id uuid not null,
  is_main boolean default false,
  "order" integer default 0,
  created_at timestamptz default now()
);

create table public.project_tags (
  project_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz default now()
);

create table public.projects (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  year integer,
  area numeric,
  status text default 'draft'::text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  slug text not null,
  location text,
  inquiry_url text,
  client text,
  constraint projects_status_check check (status = any (array['draft'::text, 'published'::text, 'hidden'::text]))
);

create table public.site_settings (
  id boolean default true not null,
  featured_project_id uuid,
  updated_at timestamptz default now(),
  constraint site_settings_singleton check (id)
);

create table public.tags (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamptz default now()
);

-- Primary keys & unique constraints -------------------------------------
alter table only public.brands add constraint brands_name_key unique (name_ko);
alter table only public.brands add constraint brands_pkey primary key (id);
alter table only public.brands add constraint brands_slug_key unique (slug);
alter table only public.home_featured add constraint home_featured_entity_type_entity_id_key unique (entity_type, entity_id);
alter table only public.home_featured add constraint home_featured_pkey primary key (id);
alter table only public.inquiries add constraint inquiries_pkey primary key (id);
alter table only public.item_categories add constraint item_tags_pkey primary key (item_id, category_id);
alter table only public.item_tags add constraint item_tags_pkey1 primary key (item_id, tag_id);
alter table only public.items add constraint items_pkey primary key (id);
alter table only public.items add constraint items_slug_key unique (slug);
alter table only public.photo_items add constraint photo_items_photo_id_item_id_key unique (photo_id, item_id);
alter table only public.photo_items add constraint photo_items_pkey primary key (id);
alter table only public.photo_tags add constraint photo_tags_pkey primary key (photo_id, tag_id);
alter table only public.photos add constraint photos_pkey primary key (id);
alter table only public.profiles add constraint profiles_email_key unique (email);
alter table only public.profiles add constraint profiles_pkey primary key (id);
alter table only public.project_items add constraint project_items_pkey primary key (project_id, item_id);
alter table only public.project_photos add constraint project_photos_pkey primary key (id);
alter table only public.project_photos add constraint project_photos_project_id_photo_id_key unique (project_id, photo_id);
alter table only public.project_categories add constraint project_tags_pkey primary key (project_id, category_id);
alter table only public.project_tags add constraint project_tags_pkey1 primary key (project_id, tag_id);
alter table only public.projects add constraint projects_pkey primary key (id);
alter table only public.projects add constraint projects_slug_key unique (slug);
alter table only public.site_settings add constraint site_settings_pkey primary key (id);
alter table only public.categories add constraint tags_name_key unique (name);
alter table only public.tags add constraint tags_name_key1 unique (name);
alter table only public.categories add constraint tags_pkey primary key (id);
alter table only public.tags add constraint tags_pkey1 primary key (id);

-- Indexes ----------------------------------------------------------------
create index idx_home_featured_type_order on public.home_featured using btree (entity_type, "order");
create index idx_item_tags_tag on public.item_tags using btree (tag_id);
create index idx_items_brand_id on public.items using btree (brand_id);
create index idx_photo_items_item_id on public.photo_items using btree (item_id);
create index idx_photo_items_order on public.photo_items using btree (item_id, "order");
create index idx_photo_items_photo_id on public.photo_items using btree (photo_id);
create index idx_photo_tags_tag on public.photo_tags using btree (tag_id);
create index idx_photos_created_at on public.photos using btree (created_at desc);
create index idx_photos_image_url on public.photos using btree (image_url);
create index idx_project_items_project_id on public.project_items using btree (project_id);
create index idx_project_photos_is_main on public.project_photos using btree (project_id, is_main) where (is_main = true);
create index idx_project_photos_order on public.project_photos using btree (project_id, "order");
create index idx_project_photos_photo_id on public.project_photos using btree (photo_id);
create index idx_project_photos_project_id on public.project_photos using btree (project_id);
create index idx_project_tags_project_id on public.project_categories using btree (project_id);
create index idx_project_tags_tag on public.project_tags using btree (tag_id);
create index idx_projects_created_at on public.projects using btree (created_at desc);
create index idx_projects_status on public.projects using btree (status);
create index idx_tags_type on public.categories using btree (type);
create unique index uq_photo_items_one_main on public.photo_items using btree (item_id) where is_main;
create unique index uq_project_photos_one_main on public.project_photos using btree (project_id) where is_main;

-- Foreign keys -----------------------------------------------------------
alter table only public.items add constraint fk_items_brand_id foreign key (brand_id) references public.brands(id) on delete set null;
alter table only public.item_categories add constraint item_tags_item_id_fkey foreign key (item_id) references public.items(id) on delete cascade;
alter table only public.item_tags add constraint item_tags_item_id_fkey1 foreign key (item_id) references public.items(id) on delete cascade;
alter table only public.item_categories add constraint item_tags_tag_id_fkey foreign key (category_id) references public.categories(id) on delete cascade;
alter table only public.item_tags add constraint item_tags_tag_id_fkey1 foreign key (tag_id) references public.tags(id) on delete cascade;
alter table only public.photo_items add constraint photo_items_item_id_fkey foreign key (item_id) references public.items(id) on delete cascade;
alter table only public.photo_items add constraint photo_items_photo_id_fkey foreign key (photo_id) references public.photos(id) on delete cascade;
alter table only public.photo_tags add constraint photo_tags_photo_id_fkey foreign key (photo_id) references public.photos(id) on delete cascade;
alter table only public.photo_tags add constraint photo_tags_tag_id_fkey foreign key (tag_id) references public.tags(id) on delete cascade;
alter table only public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table only public.project_items add constraint project_items_item_id_fkey foreign key (item_id) references public.items(id) on delete cascade;
alter table only public.project_items add constraint project_items_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table only public.project_photos add constraint project_photos_photo_id_fkey foreign key (photo_id) references public.photos(id) on delete cascade;
alter table only public.project_photos add constraint project_photos_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table only public.project_categories add constraint project_tags_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table only public.project_tags add constraint project_tags_project_id_fkey1 foreign key (project_id) references public.projects(id) on delete cascade;
alter table only public.project_categories add constraint project_tags_tag_id_fkey foreign key (category_id) references public.categories(id) on delete cascade;
alter table only public.project_tags add constraint project_tags_tag_id_fkey1 foreign key (tag_id) references public.tags(id) on delete cascade;
alter table only public.site_settings add constraint site_settings_featured_project_id_fkey foreign key (featured_project_id) references public.projects(id) on delete set null;

-- Triggers ---------------------------------------------------------------
create trigger on_brands_updated before update on public.brands for each row execute function public.handle_updated_at();
create trigger on_items_updated before update on public.items for each row execute function public.handle_updated_at();
create trigger on_profiles_updated before update on public.profiles for each row execute function public.handle_updated_at();
create trigger on_projects_updated before update on public.projects for each row execute function public.handle_updated_at();
create trigger update_photos_updated_at before update on public.photos for each row execute function public.update_updated_at_column();
create trigger update_site_settings_updated_at before update on public.site_settings for each row execute function public.update_updated_at_column();

-- M3 ADD: the public-schema-only dump does not capture the trigger that lives
-- on auth.users. Without it, admin signup creates an auth user but no profile
-- row, breaking the signup + role flows. Recreate production's trigger.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security -----------------------------------------------------
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.home_featured enable row level security;
alter table public.inquiries enable row level security;
alter table public.item_categories enable row level security;
alter table public.item_tags enable row level security;
alter table public.items enable row level security;
alter table public.photo_items enable row level security;
alter table public.photo_tags enable row level security;
alter table public.photos enable row level security;
alter table public.profiles enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_items enable row level security;
alter table public.project_photos enable row level security;
alter table public.project_tags enable row level security;
alter table public.projects enable row level security;
alter table public.site_settings enable row level security;
alter table public.tags enable row level security;

create policy "Admins and masters can update all projects" on public.projects for update using ((exists ( select 1 from public.profiles where ((profiles.id = auth.uid()) and (profiles.role = any (array['admin'::text, 'master'::text]))))));
create policy "Allow all for authenticated" on public.item_categories to authenticated using (true) with check (true);
create policy "Allow read for anon" on public.item_categories for select to anon using (true);
create policy "Anyone can insert inquiries" on public.inquiries for insert with check (true);
create policy "Authenticated users can manage brands" on public.brands using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can manage items" on public.items using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can manage project items" on public.project_items using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can manage project tags" on public.project_categories using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can manage tags" on public.categories using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can view all projects" on public.projects for select using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can view brands" on public.brands for select using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can view inquiries" on public.inquiries for select using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can view items" on public.items for select using ((auth.role() = 'authenticated'::text));
create policy "Authenticated users can view tags" on public.categories for select using ((auth.role() = 'authenticated'::text));
create policy "Everyone can view published projects" on public.projects for select using ((status = 'published'::text));
create policy "General users can create projects" on public.projects for insert with check ((auth.role() = 'authenticated'::text));
create policy "Items of published projects are viewable by everyone." on public.project_items for select using ((exists ( select 1 from public.projects p where ((p.id = project_items.project_id) and (p.status = 'published'::text)))));
create policy "Public brands are viewable by everyone." on public.brands for select using (true);
create policy "Public items are viewable by everyone." on public.items for select using (true);
create policy "Public tags are viewable by everyone." on public.categories for select using (true);
create policy "Tags of published projects are viewable by everyone." on public.project_categories for select using ((exists ( select 1 from public.projects p where ((p.id = project_categories.project_id) and (p.status = 'published'::text)))));
create policy "Users can update own projects" on public.projects for update using ((auth.role() = 'authenticated'::text));
create policy "authenticated_select_all" on public.profiles for select using ((auth.role() = 'authenticated'::text));
create policy "authenticated_update_all" on public.profiles for update using ((auth.role() = 'authenticated'::text));
create policy "home_featured_select_public" on public.home_featured for select using (true);
create policy "home_featured_write_auth" on public.home_featured to authenticated using (true) with check (true);
create policy "item_tags_delete_auth" on public.item_tags for delete to authenticated using (true);
create policy "item_tags_insert_auth" on public.item_tags for insert to authenticated with check (true);
create policy "item_tags_select_public" on public.item_tags for select using (true);
create policy "item_tags_update_auth" on public.item_tags for update to authenticated using (true) with check (true);
create policy "photo_items_delete_authenticated" on public.photo_items for delete to authenticated using (true);
create policy "photo_items_insert_authenticated" on public.photo_items for insert to authenticated with check (true);
create policy "photo_items_select_public" on public.photo_items for select using (true);
create policy "photo_items_update_authenticated" on public.photo_items for update to authenticated using (true) with check (true);
create policy "photo_tags_delete_auth" on public.photo_tags for delete to authenticated using (true);
create policy "photo_tags_insert_auth" on public.photo_tags for insert to authenticated with check (true);
create policy "photo_tags_select_public" on public.photo_tags for select using (true);
create policy "photo_tags_update_auth" on public.photo_tags for update to authenticated using (true) with check (true);
create policy "photos_delete_authenticated" on public.photos for delete to authenticated using (true);
create policy "photos_insert_authenticated" on public.photos for insert to authenticated with check (true);
create policy "photos_select_public" on public.photos for select using (true);
create policy "photos_update_authenticated" on public.photos for update to authenticated using (true) with check (true);
create policy "project_photos_delete_authenticated" on public.project_photos for delete to authenticated using (true);
create policy "project_photos_insert_authenticated" on public.project_photos for insert to authenticated with check (true);
create policy "project_photos_select_public" on public.project_photos for select using (true);
create policy "project_photos_update_authenticated" on public.project_photos for update to authenticated using (true) with check (true);
create policy "project_tags_delete_auth" on public.project_tags for delete to authenticated using (true);
create policy "project_tags_insert_auth" on public.project_tags for insert to authenticated with check (true);
create policy "project_tags_select_public" on public.project_tags for select using (true);
create policy "project_tags_update_auth" on public.project_tags for update to authenticated using (true) with check (true);
create policy "service_role_all" on public.profiles using ((auth.role() = 'service_role'::text));
create policy "site_settings_select_public" on public.site_settings for select using (true);
create policy "site_settings_write_auth" on public.site_settings to authenticated using (true) with check (true);
create policy "tags_delete_authenticated" on public.tags for delete to authenticated using (true);
create policy "tags_insert_authenticated" on public.tags for insert to authenticated with check (true);
create policy "tags_select_public" on public.tags for select using (true);
create policy "tags_update_authenticated" on public.tags for update to authenticated using (true) with check (true);
create policy "users_insert_own" on public.profiles for insert with check ((auth.uid() = id));
create policy "users_select_own" on public.profiles for select using ((auth.uid() = id));
create policy "users_update_own" on public.profiles for update using ((auth.uid() = id));

-- Storage bucket (from backups/auth_storage_data dump) --------------------
-- M3 ADD: the public 'images' bucket the upload route writes to. Uploads use
-- the service-role client (bypasses storage RLS), so no object policies needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, '{image/jpeg,image/png,image/webp,image/gif}')
on conflict (id) do nothing;
