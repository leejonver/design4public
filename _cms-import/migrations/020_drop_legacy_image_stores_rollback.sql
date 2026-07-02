-- Rollback for: 020_drop_legacy_image_stores
-- Restores legacy STRUCTURE only. Data dropped by 020 is NOT restored here — recover it from
-- the pre-020 backup (see the warning in 020). After restoring structure + data from backup,
-- the photos model still holds the same image links (019 is unaffected by 020).

BEGIN;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.items    ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE: image_tags, projects_with_details view, and create_project_with_relations() are NOT
-- recreated here (they were deprecated artifacts). Restore from backup if genuinely needed.

COMMIT;
