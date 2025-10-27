-- Supabase 프로젝트 URL을 변수로 설정합니다.
-- 경고: 이 URL은 예시이며, 실제 프로젝트 URL로 변경해야 할 수 있습니다.
DO $$
DECLARE
  v_supabase_url TEXT := 'https://ftuudbxhffnbzjxgqagp.supabase.co';
  v_storage_base_url TEXT := v_supabase_url || '/storage/v1/object/public/images/';
BEGIN
  -- 1. projects 테이블의 cover_image_url 업데이트
  UPDATE public.projects p
  SET cover_image_url = v_storage_base_url || p.slug || '/cover.jpg'
  WHERE p.id IN (
    '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc',
    '5e61d416-6079-411a-ba71-8fdcf93ae8b5',
    '5620299f-3964-4c39-b8cc-98a1d18ff2f6'
  );

  -- 2. project_images 테이블의 image_url 업데이트
  -- 서울시청
  UPDATE public.project_images 
  SET image_url = v_storage_base_url || 'seoul-city-hall-civil-affairs-office-remodeling/' || LPAD("order"::text, 2, '0') || '.jpg'
  WHERE project_id = '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc';
  
  -- 부산시립도서관
  UPDATE public.project_images 
  SET image_url = v_storage_base_url || 'busan-metropolitan-library-construction/' || LPAD("order"::text, 2, '0') || '.jpg'
  WHERE project_id = '5e61d416-6079-411a-ba71-8fdcf93ae8b5';
  
  -- 국립중앙의료원
  UPDATE public.project_images 
  SET image_url = v_storage_base_url || 'national-medical-center-clinic-building-renovation/' || LPAD("order"::text, 2, '0') || '.jpg'
  WHERE project_id = '5620299f-3964-4c39-b8cc-98a1d18ff2f6';

END $$;











