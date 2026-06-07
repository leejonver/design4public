-- Rollback for: 022_split_categories_and_free_tags
-- Restores the single typed-`tags` system. The new free-tag links are discarded (they are new
-- data created after 022; back them up first if you need them). Category data is preserved.

BEGIN;

-- drop new free-tag structures (frees the `tags` / *_tags names)
DROP TABLE IF EXISTS public.project_tags;
DROP TABLE IF EXISTS public.item_tags;
DROP TABLE IF EXISTS public.photo_tags;
DROP TABLE IF EXISTS public.tags;

-- categories -> tags (restore original names + column)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.project_categories RENAME COLUMN category_id TO tag_id;
ALTER TABLE public.item_categories RENAME COLUMN category_id TO tag_id;
ALTER TABLE public.item_categories RENAME TO item_tags;
ALTER TABLE public.project_categories RENAME TO project_tags;
ALTER TABLE public.categories RENAME TO tags;

-- recreate the dropped 0-row typed joins (structure only)
CREATE TABLE IF NOT EXISTS public.photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, tag_id)
);
CREATE TABLE IF NOT EXISTS public.brand_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, tag_id)
);

COMMIT;
