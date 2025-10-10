-- 모든 프로젝트의 상태를 'published'로 변경합니다.
UPDATE public.projects
SET status = 'published'
WHERE status IS NULL OR status != 'published';







