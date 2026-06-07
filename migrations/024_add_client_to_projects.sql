-- Migration: 024_add_client_to_projects
-- Created: 2026-06-08
-- Purpose: add a 'client' (클라이언트/발주처) field to projects. Additive, nullable.

BEGIN;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client TEXT;
COMMENT ON COLUMN public.projects.client IS '클라이언트(발주처)';
COMMIT;
