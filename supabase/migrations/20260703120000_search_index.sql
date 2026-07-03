-- M6: hybrid search (pgvector + pg_trgm, RRF). ADDITIVE ONLY — creates the
-- derived search_index table, the search_source composition view, and the
-- hybrid_search RPC. Drops nothing; safe to apply to production at the M7 gate.
-- search_index is derived data: it can be dropped and rebuilt from search_source.

-- Extensions -------------------------------------------------------------
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Derived search table ---------------------------------------------------
create table public.search_index (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project', 'item', 'photo', 'brand')),
  entity_id uuid not null,
  slug text,                              -- null for photos (routed by id)
  title text not null,
  body text not null default '',          -- description + tags/categories + linked entity names
  image_url text,                         -- cover/thumbnail for result rendering
  embedding extensions.vector(1536),      -- null when no OpenAI key / failure (trigram still works)
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

-- Trigram GIN over title+body: accelerates BOTH ILIKE '%q%' and similarity().
create index idx_search_index_trgm
  on public.search_index using gin ((title || ' ' || body) extensions.gin_trgm_ops);

-- HNSW cosine index for vector similarity (rows with NULL embedding are skipped).
create index idx_search_index_embedding
  on public.search_index using hnsw (embedding extensions.vector_cosine_ops);

-- RLS: public SELECT; writes only via service role (bypasses RLS). -------
alter table public.search_index enable row level security;
create policy "search_index public read" on public.search_index for select using (true);
grant select on public.search_index to anon, authenticated;

-- Composition view: the single source of truth for each entity's searchable
-- text. Applies the same visibility gates as the public site (lib/api.ts), so
-- drafts / hidden items / item-gallery-only photos never enter the index.
-- Project body includes the direct∪derived item names (spec §7-1 union model).
create view public.search_source as
  select
    'project'::text as entity_type,
    p.id as entity_id,
    p.slug,
    p.title,
    concat_ws(' ',
      p.title, p.description, p.location, p.client,
      (select string_agg(distinct c.name, ' ')
         from public.project_categories pc
         join public.categories c on c.id = pc.category_id
        where pc.project_id = p.id),
      (select string_agg(distinct i.name, ' ')
         from (
           select item_id from public.project_items where project_id = p.id
           union
           select ph_i.item_id
             from public.project_photos pp
             join public.photo_items ph_i on ph_i.photo_id = pp.photo_id
            where pp.project_id = p.id
         ) links
         join public.items i on i.id = links.item_id)
    ) as body,
    (select ph.image_url
       from public.project_photos pp
       join public.photos ph on ph.id = pp.photo_id
      where pp.project_id = p.id
      order by pp.is_main desc nulls last, pp."order" asc nulls last
      limit 1) as image_url
  from public.projects p
  where p.status = 'published'

  union all
  select
    'item'::text, i.id, i.slug, i.name,
    concat_ws(' ',
      i.name, i.description, b.name_ko, b.name_en,
      (select string_agg(distinct c.name, ' ')
         from public.item_categories ic
         join public.categories c on c.id = ic.category_id
        where ic.item_id = i.id)
    ),
    (select ph.image_url
       from public.photo_items pit
       join public.photos ph on ph.id = pit.photo_id
      where pit.item_id = i.id
      order by pit.is_main desc nulls last, pit."order" asc nulls last
      limit 1)
  from public.items i
  left join public.brands b on b.id = i.brand_id
  where i.status <> 'hidden'

  union all
  select
    'brand'::text, b.id, b.slug, b.name_ko,
    concat_ws(' ', b.name_ko, b.name_en, b.description),
    coalesce(b.cover_image_url, b.logo_image_url)
  from public.brands b

  union all
  select
    'photo'::text, ph.id, null::text, coalesce(ph.title, ph.alt_text, ''),
    concat_ws(' ',
      ph.title, ph.alt_text, ph.description,
      (select string_agg(distinct pr.title, ' ')
         from public.project_photos pp
         join public.projects pr on pr.id = pp.project_id
        where pp.photo_id = ph.id and pr.status = 'published'),
      (select string_agg(distinct it.name, ' ')
         from public.photo_items pit
         join public.items it on it.id = pit.item_id
        where pit.photo_id = ph.id)
    ),
    ph.image_url
  from public.photos ph
  where exists (
    select 1 from public.project_photos pp
    join public.projects pr on pr.id = pp.project_id
    where pp.photo_id = ph.id and pr.status = 'published'
  );

-- search_source is a write-path helper for service-role code only; do not add
-- it to the public PostgREST surface (its rows are already public-only anyway).
revoke all on public.search_source from anon, authenticated;
grant select on public.search_source to service_role;

-- Hybrid search: trigram-ILIKE keyword branch UNION vector-cosine branch,
-- combined with Reciprocal Rank Fusion (k=60). The keyword branch uses ILIKE as
-- the substring filter (Korean partial match, GIN-accelerated) and similarity()
-- + a title-hit boost for ranking. The vector branch is skipped when no query
-- embedding is supplied (trigram-only fallback).
create or replace function public.hybrid_search(
  query_text text,
  query_embedding extensions.vector(1536) default null,
  match_limit int default 24
)
returns table (
  entity_type text,
  entity_id uuid,
  slug text,
  title text,
  image_url text,
  score double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with kw as (
    select
      si.id,
      row_number() over (
        order by
          (case when si.title ilike '%' || query_text || '%' then 0 else 1 end),
          similarity(si.title || ' ' || si.body, query_text) desc,
          si.updated_at desc
      )::int as rank
    from public.search_index si
    where query_text <> ''
      and (si.title || ' ' || si.body) ilike '%' || query_text || '%'
  ),
  vec as (
    select
      si.id,
      row_number() over (order by si.embedding <=> query_embedding)::int as rank
    from public.search_index si
    where query_embedding is not null
      and si.embedding is not null
  )
  select
    si.entity_type,
    si.entity_id,
    si.slug,
    si.title,
    si.image_url,
    coalesce(1.0 / (60 + kw.rank), 0.0) + coalesce(1.0 / (60 + vec.rank), 0.0) as score
  from public.search_index si
  left join kw on kw.id = si.id
  left join vec on vec.id = si.id
  where kw.id is not null or vec.id is not null
  order by score desc
  limit match_limit;
$$;

grant execute on function public.hybrid_search(text, extensions.vector, int) to anon, authenticated;
