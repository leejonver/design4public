-- Migration: 020_drop_legacy_image_stores
-- Created: 2026-06-07
-- Phase: DESTRUCTIVE (Phase 2 of 2). DO NOT APPLY until:
--   (a) 019 is applied and verified, AND
--   (b) all application code reads/writes images ONLY via photos + project_photos + photo_items
--       (no code references project_images, item_images, items.image_url, projects.cover_image_url).
--
-- Removes the legacy image stores deprecated by 019. Brand logo/cover columns are KEPT
-- (decision: brand images remain dedicated columns).
--
-- !! BACK UP THE DATABASE BEFORE RUNNING. This drops data that the rollback cannot restore. !!
-- Rollback: 020_drop_legacy_image_stores_rollback.sql (restores STRUCTURE only, not data).

BEGIN;

-- The projects_with_details view (007) and create_project_with_relations() reference
-- project_images; they are replaced in the renewal code/migration set. Drop the dependent
-- view first so the column/table drops succeed.
DROP VIEW IF EXISTS public.projects_with_details;
DROP FUNCTION IF EXISTS public.create_project_with_relations(
  text, text, text, integer, numeric, public.project_status, text,
  public.project_image_type[], uuid[], uuid[]);

-- orphaned/unused
DROP TABLE IF EXISTS public.image_tags;

-- legacy multi-image tables (superseded by photos + join tables)
DROP TABLE IF EXISTS public.project_images;
DROP TABLE IF EXISTS public.item_images;

-- legacy single-image columns (superseded by is_main link in join tables)
ALTER TABLE public.projects DROP COLUMN IF EXISTS cover_image_url;
ALTER TABLE public.items    DROP COLUMN IF EXISTS image_url;

COMMIT;
