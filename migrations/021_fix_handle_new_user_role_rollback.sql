-- Rollback for: 021_fix_handle_new_user_role
-- Restores the original trigger body. WARNING: the original inserts role='general', which
-- violates profiles_role_check (added in 019). To actually use this rollback you must also
-- drop that constraint (ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check),
-- i.e. roll back 019's value-domain changes too. Kept only for completeness.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'general', 'pending');
  RETURN new;
END;
$function$;
