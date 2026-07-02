-- Rollback for: 019_unify_image_model_and_constraints
-- Restores the pre-019 SCHEMA. Backfilled rows in photos/project_photos/photo_items are
-- left in place: they are additive and harmless (pre-019 code ignores photo_items.is_main/order,
-- and the project_photos rows are valid links). No legacy data was removed by 019, so nothing
-- is lost by this rollback.

BEGIN;

-- value-domain constraints
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.items    DROP CONSTRAINT IF EXISTS items_status_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- NOTE: value normalization (general->content_manager, unavailable->discontinued) is NOT
-- reverted automatically (0 live rows were affected). Revert manually if required.

-- single-main invariant
DROP INDEX IF EXISTS public.uq_project_photos_one_main;
DROP INDEX IF EXISTS public.uq_photo_items_one_main;
DROP INDEX IF EXISTS public.idx_photo_items_order;

-- photo_items columns added by 019
ALTER TABLE public.photo_items DROP COLUMN IF EXISTS is_main;
ALTER TABLE public.photo_items DROP COLUMN IF EXISTS "order";

-- renewal feature columns added by 019 (A2)
ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_status_check;
ALTER TABLE public.brands   DROP COLUMN IF EXISTS status;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_login_at;

COMMIT;
