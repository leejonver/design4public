-- Rollback for: 023_home_settings
BEGIN;
DROP TABLE IF EXISTS public.home_featured;
DROP TABLE IF EXISTS public.site_settings;
COMMIT;
