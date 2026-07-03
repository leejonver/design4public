-- Migration: 019_unify_image_model_and_constraints
-- Created: 2026-06-07
-- Phase: ADDITIVE (Phase 1 of 2). Legacy image columns/tables are PRESERVED.
--        Destructive removal is deferred to 020 so the app keeps working mid-migration.
--
-- Purpose (renewal_requirements.md §5, §9):
--   1. Make `photos` the single image-asset table; project images -> project_photos,
--      item images -> photo_items (both with is_main/order). Brand logo/cover stay as columns.
--   2. LOSSLESSLY backfill from the authoritative legacy tables (project_images, item_images,
--      items.image_url). Migration 018 was lossy (dedup-by-url destroyed is_main/order); this
--      rebuilds every legacy link and recovers is_main/order.
--   3. Enforce integrity: max one is_main per parent (partial unique index).
--   4. Normalize + constrain value domains: role general->content_manager,
--      item status unavailable->discontinued (0 live rows; rule is made explicit).
--
-- Idempotent: re-running does not duplicate or corrupt data.
-- Rollback: 019_unify_image_model_and_constraints_rollback.sql

BEGIN;

-- ============================================================
-- A. photo_items gains is_main / order (parity with project_photos)
-- ============================================================
ALTER TABLE public.photo_items ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.photo_items ADD COLUMN IF NOT EXISTS "order" INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.photo_items.is_main IS '아이템 대표 이미지 여부 (아이템당 최대 1개)';
COMMENT ON COLUMN public.photo_items."order" IS '아이템 갤러리 내 표시 순서';

-- ============================================================
-- A2. target columns for renewal features (additive)
--     profiles.name / last_login_at (§8 user management),
--     brands.status 노출/숨김 (§5-2, §6-2)
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.brands   ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'visible';

ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_status_check;
ALTER TABLE public.brands ADD  CONSTRAINT brands_status_check CHECK (status IN ('visible','hidden'));

-- ============================================================
-- B. photos: ensure one asset row per distinct legacy image_url
--    (asset library deduped by URL; per-parent links carry is_main/order)
-- ============================================================
INSERT INTO public.photos (image_url, alt_text, created_at, updated_at)
SELECT DISTINCT ON (pi.image_url) pi.image_url, pi.alt_text, pi.created_at, pi.created_at
FROM public.project_images pi
WHERE pi.image_url IS NOT NULL AND pi.image_url <> ''
  AND NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.image_url = pi.image_url)
ORDER BY pi.image_url, pi.created_at;

INSERT INTO public.photos (image_url, alt_text, created_at, updated_at)
SELECT DISTINCT ON (ii.image_url) ii.image_url, ii.alt_text, ii.created_at, COALESCE(ii.updated_at, ii.created_at)
FROM public.item_images ii
WHERE ii.image_url IS NOT NULL AND ii.image_url <> ''
  AND NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.image_url = ii.image_url)
ORDER BY ii.image_url, ii.created_at;

-- defensive: items.image_url (all 15 already in item_images, but keep idempotent-safe)
INSERT INTO public.photos (image_url, alt_text, created_at, updated_at)
SELECT DISTINCT ON (i.image_url) i.image_url, NULL, i.created_at, i.created_at
FROM public.items i
WHERE i.image_url IS NOT NULL AND i.image_url <> ''
  AND NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.image_url = i.image_url)
ORDER BY i.image_url, i.created_at;

-- ============================================================
-- C. project_photos: link EVERY project_images row; recover is_main/order
-- ============================================================
INSERT INTO public.project_photos (project_id, photo_id, is_main, "order", created_at)
SELECT pi.project_id, p.id, COALESCE(pi.is_main, false), COALESCE(pi."order", 0), pi.created_at
FROM public.project_images pi
JOIN public.photos p ON p.image_url = pi.image_url
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_photos pp WHERE pp.project_id = pi.project_id AND pp.photo_id = p.id
);

-- recover is_main/order onto pre-existing links from the authoritative legacy source
UPDATE public.project_photos pp
SET is_main = (pp.is_main OR sub.is_main),
    "order" = sub."order"
FROM (
  SELECT pi.project_id, p.id AS photo_id,
         bool_or(COALESCE(pi.is_main, false)) AS is_main,
         min(COALESCE(pi."order", 0))       AS "order"
  FROM public.project_images pi
  JOIN public.photos p ON p.image_url = pi.image_url
  GROUP BY pi.project_id, p.id
) sub
WHERE pp.project_id = sub.project_id AND pp.photo_id = sub.photo_id;

-- ============================================================
-- D. photo_items: link EVERY item_images row; recover is_main/order
-- ============================================================
INSERT INTO public.photo_items (photo_id, item_id, is_main, "order", created_at)
SELECT p.id, ii.item_id, COALESCE(ii.is_main, false), COALESCE(ii."order", 0), ii.created_at
FROM public.item_images ii
JOIN public.photos p ON p.image_url = ii.image_url
WHERE NOT EXISTS (
  SELECT 1 FROM public.photo_items phi WHERE phi.photo_id = p.id AND phi.item_id = ii.item_id
);

UPDATE public.photo_items phi
SET is_main = (phi.is_main OR sub.is_main),
    "order" = sub."order"
FROM (
  SELECT ii.item_id, p.id AS photo_id,
         bool_or(COALESCE(ii.is_main, false)) AS is_main,
         min(COALESCE(ii."order", 0))        AS "order"
  FROM public.item_images ii
  JOIN public.photos p ON p.image_url = ii.image_url
  GROUP BY ii.item_id, p.id
) sub
WHERE phi.photo_id = sub.photo_id AND phi.item_id = sub.item_id;

-- defensive: if an item has image_url but no is_main link yet, mark its matching link main
UPDATE public.photo_items phi
SET is_main = true
FROM public.items i
JOIN public.photos p ON p.image_url = i.image_url
WHERE phi.item_id = i.id AND phi.photo_id = p.id
  AND i.image_url IS NOT NULL AND i.image_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.photo_items x WHERE x.item_id = i.id AND x.is_main
  );

-- ============================================================
-- E. enforce single is_main per parent (keep lowest order, then earliest)
-- ============================================================
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY project_id ORDER BY "order", created_at, id) AS rn
  FROM public.project_photos WHERE is_main
)
UPDATE public.project_photos pp SET is_main = false
FROM ranked r WHERE pp.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY item_id ORDER BY "order", created_at, id) AS rn
  FROM public.photo_items WHERE is_main
)
UPDATE public.photo_items phi SET is_main = false
FROM ranked r WHERE phi.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_photos_one_main
  ON public.project_photos(project_id) WHERE is_main;
CREATE UNIQUE INDEX IF NOT EXISTS uq_photo_items_one_main
  ON public.photo_items(item_id) WHERE is_main;
CREATE INDEX IF NOT EXISTS idx_photo_items_order
  ON public.photo_items(item_id, "order");

-- ============================================================
-- F. value-domain normalization + CHECK constraints
--    (live rows affected = 0; mapping rules made explicit per §9-1)
-- ============================================================
UPDATE public.profiles SET role = 'content_manager' WHERE role = 'general';
UPDATE public.items    SET status = 'discontinued'   WHERE status = 'unavailable';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('master','admin','content_manager'));

ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_status_check;
ALTER TABLE public.items ADD  CONSTRAINT items_status_check
  CHECK (status IN ('available','discontinued','hidden'));

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD  CONSTRAINT projects_status_check
  CHECK (status IN ('draft','published','hidden'));

-- ============================================================
-- G. verification (raises EXCEPTION -> rolls back the whole tx on any loss)
-- ============================================================
DO $$
DECLARE
  legacy_proj_links INT;
  covered_proj_links INT;
  legacy_item_links INT;
  covered_item_links INT;
  multi_main_proj INT;
  multi_main_item INT;
BEGIN
  -- every distinct (project_id, image_url) in project_images must exist in project_photos
  SELECT count(*) INTO legacy_proj_links
    FROM (SELECT DISTINCT project_id, image_url FROM public.project_images
          WHERE image_url IS NOT NULL AND image_url <> '') s;
  SELECT count(*) INTO covered_proj_links
    FROM (SELECT DISTINCT pi.project_id, pi.image_url
          FROM public.project_images pi
          JOIN public.photos p ON p.image_url = pi.image_url
          JOIN public.project_photos pp ON pp.project_id = pi.project_id AND pp.photo_id = p.id
          WHERE pi.image_url IS NOT NULL AND pi.image_url <> '') s;
  IF covered_proj_links <> legacy_proj_links THEN
    RAISE EXCEPTION 'project image loss: % legacy vs % covered', legacy_proj_links, covered_proj_links;
  END IF;

  -- every distinct (item_id, image_url) in item_images must exist in photo_items
  SELECT count(*) INTO legacy_item_links
    FROM (SELECT DISTINCT item_id, image_url FROM public.item_images
          WHERE image_url IS NOT NULL AND image_url <> '') s;
  SELECT count(*) INTO covered_item_links
    FROM (SELECT DISTINCT ii.item_id, ii.image_url
          FROM public.item_images ii
          JOIN public.photos p ON p.image_url = ii.image_url
          JOIN public.photo_items phi ON phi.item_id = ii.item_id AND phi.photo_id = p.id
          WHERE ii.image_url IS NOT NULL AND ii.image_url <> '') s;
  IF covered_item_links <> legacy_item_links THEN
    RAISE EXCEPTION 'item image loss: % legacy vs % covered', legacy_item_links, covered_item_links;
  END IF;

  SELECT count(*) INTO multi_main_proj FROM (
    SELECT project_id FROM public.project_photos WHERE is_main GROUP BY project_id HAVING count(*) > 1) s;
  SELECT count(*) INTO multi_main_item FROM (
    SELECT item_id FROM public.photo_items WHERE is_main GROUP BY item_id HAVING count(*) > 1) s;
  IF multi_main_proj > 0 OR multi_main_item > 0 THEN
    RAISE EXCEPTION 'multiple is_main detected: % projects, % items', multi_main_proj, multi_main_item;
  END IF;

  RAISE NOTICE '019 OK: project links %, item links %, single-main invariant holds',
    covered_proj_links, covered_item_links;
END $$;

COMMIT;
