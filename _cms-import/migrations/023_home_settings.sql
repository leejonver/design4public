-- Migration: 023_home_settings
-- Created: 2026-06-08
-- Purpose: 홈 화면 설정 — a singleton site_settings row (1 featured project) + a home_featured
--          table for the main-page exposure list (projects/items/photos/brands, ordered).
-- Additive only.

BEGIN;

-- singleton settings (one row, id always true)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  featured_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT site_settings_singleton CHECK (id)
);
INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_settings_select_public ON public.site_settings FOR SELECT USING (true);
CREATE POLICY site_settings_write_auth ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- main-page exposure list (polymorphic; no FK since entity_type varies)
CREATE TABLE IF NOT EXISTS public.home_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','item','photo','brand')),
  entity_id UUID NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_home_featured_type_order ON public.home_featured(entity_type, "order");

ALTER TABLE public.home_featured ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_featured_select_public ON public.home_featured FOR SELECT USING (true);
CREATE POLICY home_featured_write_auth ON public.home_featured FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
