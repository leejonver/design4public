-- M10: image-content search. ADDITIVE ONLY — adds an AI-generated Korean visual
-- caption to photos and folds it into the search_source composition so the
-- existing text-embedding + hybrid_search pipeline searches on what a photo
-- depicts. Drops nothing; safe to apply to production at the M7 cutover.
-- (OpenAI has no image-embedding endpoint — the caption is the vision→text
-- bridge into the existing 1536-dim text embedding. See docs/plans M10.)

-- Additive columns -------------------------------------------------------
-- ai_caption: GPT-4o-mini vision description (공간/가구/마감재/색감/스타일).
-- ai_caption_model: provenance so a future model bump can target re-captioning.
alter table public.photos add column if not exists ai_caption text;
alter table public.photos add column if not exists ai_caption_model text;

-- Recompose search_source: the ONLY change is the photo branch's body, which now
-- includes ph.ai_caption. All four branches and the output column list are
-- restated verbatim from 20260703120000_search_index.sql (create-or-replace
-- requires the identical column set/order). Nothing else changes.
create or replace view public.search_source as
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
      ph.title, ph.alt_text, ph.description, ph.ai_caption,
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

-- search_source grants are unchanged by create-or-replace, but restate to be safe.
revoke all on public.search_source from anon, authenticated;
grant select on public.search_source to service_role;
