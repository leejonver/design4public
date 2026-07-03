-- Rollback for: 024_add_client_to_projects
BEGIN;
ALTER TABLE public.projects DROP COLUMN IF EXISTS client;
COMMIT;
