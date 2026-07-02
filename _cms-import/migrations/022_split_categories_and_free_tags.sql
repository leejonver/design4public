-- Migration: 022_split_categories_and_free_tags
-- Created: 2026-06-08
-- Purpose: Split the single typed-`tags` system into two:
--   1. CATEGORIES = the existing typed classification (project|item). The current `tags` table
--      (18 rows: 11 project + 7 item) and its links become categories — renamed, data preserved.
--   2. TAGS = new free-form labels (no type), attachable to project/item/photo.
--   Brand loses all classification (no category, no tag) — brand_tags dropped (0 rows).
--   photo_tags (old, 0 rows) dropped; photos get free tags via the new photo_tags.
-- Lossless: only renames + drops of 0-row tables. Verified: tags=11 project/7 item,
--   project_tags=29, item_tags=15, photo_tags=0, brand_tags=0, all type-consistent.
-- Rollback: 022_..._rollback.sql

BEGIN;

-- ============================================================
-- A. tags -> categories (typed: project|item)
-- ============================================================
ALTER TABLE public.tags RENAME TO categories;
ALTER TABLE public.project_tags RENAME TO project_categories;
ALTER TABLE public.item_tags RENAME TO item_categories;

-- clarify the FK column name (tag_id -> category_id)
ALTER TABLE public.project_categories RENAME COLUMN tag_id TO category_id;
ALTER TABLE public.item_categories RENAME COLUMN tag_id TO category_id;

-- constrain category type to project|item (data already satisfies this)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK (type IN ('project','item'));

COMMENT ON TABLE public.categories IS '엔티티별 고정 분류(카테고리). type: project|item';
COMMENT ON TABLE public.project_categories IS '프로젝트-카테고리 연결';
COMMENT ON TABLE public.item_categories IS '아이템-카테고리 연결';

-- drop unused old typed-tag joins (0 rows)
DROP TABLE IF EXISTS public.photo_tags;
DROP TABLE IF EXISTS public.brand_tags;

-- ============================================================
-- B. new free-form tags (no type) for project/item/photo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.tags IS '자유 태그(type 무관). 프로젝트/아이템/사진에 자유롭게 연결';

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_select_public ON public.tags FOR SELECT USING (true);
CREATE POLICY tags_insert_authenticated ON public.tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY tags_update_authenticated ON public.tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY tags_delete_authenticated ON public.tags FOR DELETE TO authenticated USING (true);

-- free-tag join tables
CREATE TABLE IF NOT EXISTS public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id)     ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, tag_id)
);
CREATE TABLE IF NOT EXISTS public.item_tags (
  item_id    UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (item_id, tag_id)
);
CREATE TABLE IF NOT EXISTS public.photo_tags (
  photo_id   UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (photo_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON public.project_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON public.item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON public.photo_tags(tag_id);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['project_tags','item_tags','photo_tags'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t||'_select_public', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t||'_insert_auth', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t||'_update_auth', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', t||'_delete_auth', t);
  END LOOP;
END $$;

-- ============================================================
-- C. verification
-- ============================================================
DO $$
DECLARE cat_count INT; pcat INT; icat INT;
BEGIN
  SELECT count(*) INTO cat_count FROM public.categories;
  SELECT count(*) INTO pcat FROM public.project_categories;
  SELECT count(*) INTO icat FROM public.item_categories;
  IF cat_count <> 18 OR pcat <> 29 OR icat <> 15 THEN
    RAISE EXCEPTION 'category data loss: categories=% (exp 18), project_categories=% (exp 29), item_categories=% (exp 15)', cat_count, pcat, icat;
  END IF;
  RAISE NOTICE '022 OK: categories=%, project_categories=%, item_categories=%; free tags tables created', cat_count, pcat, icat;
END $$;

COMMIT;
