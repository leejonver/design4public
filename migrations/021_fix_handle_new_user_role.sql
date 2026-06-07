-- Migration: 021_fix_handle_new_user_role
-- Created: 2026-06-08
-- Purpose: The on_auth_user_created trigger (handle_new_user) inserted profiles with
--          role='general', which migration 019's profiles_role_check constraint now rejects —
--          breaking every new signup. Align the trigger with the unified role domain
--          (general -> content_manager) and make it idempotent vs the app's own profile upsert.
-- Idempotent: CREATE OR REPLACE. Rollback: 021_..._rollback.sql.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'content_manager', 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;
