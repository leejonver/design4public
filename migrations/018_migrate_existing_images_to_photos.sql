-- 기존 이미지 데이터를 photos 테이블로 마이그레이션
-- Migration: 018_migrate_existing_images_to_photos
-- Created: 2025-12-15
-- Description: project_images의 기존 데이터를 photos 테이블로 복사하고 project_photos 연결 생성

-- ============================================
-- 1. 기존 project_images를 photos 테이블로 마이그레이션
-- ============================================
INSERT INTO public.photos (image_url, alt_text, created_at, updated_at)
SELECT DISTINCT 
  pi.image_url, 
  pi.alt_text, 
  pi.created_at,
  pi.created_at
FROM public.project_images pi
WHERE pi.image_url IS NOT NULL 
  AND pi.image_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.photos p WHERE p.image_url = pi.image_url
  );

-- ============================================
-- 2. project_photos 연결 생성 (기존 project_images 기반)
-- ============================================
INSERT INTO public.project_photos (project_id, photo_id, is_main, "order", created_at)
SELECT 
  pi.project_id,
  p.id AS photo_id,
  COALESCE(pi.is_main, false),
  COALESCE(pi."order", 0),
  pi.created_at
FROM public.project_images pi
JOIN public.photos p ON p.image_url = pi.image_url
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_photos pp 
  WHERE pp.project_id = pi.project_id AND pp.photo_id = p.id
);

-- ============================================
-- 3. 기존 item_images도 photos로 마이그레이션 (선택적)
-- 아이템 이미지는 별도 관리하되, photos에도 등록하여 통합 관리 가능
-- ============================================
INSERT INTO public.photos (image_url, alt_text, created_at, updated_at)
SELECT DISTINCT 
  ii.image_url, 
  ii.alt_text, 
  ii.created_at,
  COALESCE(ii.updated_at, ii.created_at)
FROM public.item_images ii
WHERE ii.image_url IS NOT NULL 
  AND ii.image_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.photos p WHERE p.image_url = ii.image_url
  );

-- ============================================
-- 4. item_images 기반으로 photo_items 연결 생성
-- ============================================
INSERT INTO public.photo_items (photo_id, item_id, created_at)
SELECT 
  p.id AS photo_id,
  ii.item_id,
  ii.created_at
FROM public.item_images ii
JOIN public.photos p ON p.image_url = ii.image_url
WHERE NOT EXISTS (
  SELECT 1 FROM public.photo_items pi 
  WHERE pi.photo_id = p.id AND pi.item_id = ii.item_id
);

-- ============================================
-- 마이그레이션 결과 로그
-- ============================================
DO $$
DECLARE
  photos_count INT;
  project_photos_count INT;
  photo_items_count INT;
BEGIN
  SELECT COUNT(*) INTO photos_count FROM public.photos;
  SELECT COUNT(*) INTO project_photos_count FROM public.project_photos;
  SELECT COUNT(*) INTO photo_items_count FROM public.photo_items;
  
  RAISE NOTICE 'Migration completed: % photos, % project_photos, % photo_items', 
    photos_count, project_photos_count, photo_items_count;
END $$;
