-- Dedicated home hero photo (client request 2026-09-04): the featured project's
-- gallery photos are ~1190px wide and upscale badly in the full-width hero, so
-- 홈 화면 설정 can set one purpose-uploaded image that replaces the slideshow.
alter table public.site_settings add column if not exists featured_image_url text;
