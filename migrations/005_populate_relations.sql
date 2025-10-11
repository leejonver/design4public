-- 기존 연관 데이터 삭제 ( idempotent )
DELETE FROM public.project_images WHERE project_id IN ('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', '5e61d416-6079-411a-ba71-8fdcf93ae8b5', '5620299f-3964-4c39-b8cc-98a1d18ff2f6');
DELETE FROM public.project_items WHERE project_id IN ('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', '5e61d416-6079-411a-ba71-8fdcf93ae8b5', '5620299f-3964-4c39-b8cc-98a1d18ff2f6');
DELETE FROM public.project_tags WHERE project_id IN ('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', '5e61d416-6079-411a-ba71-8fdcf93ae8b5', '5620299f-3964-4c39-b8cc-98a1d18ff2f6');

-- 1. 서울시청 민원실 (ID: 2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc)
-- 이미지
INSERT INTO public.project_images (project_id, image_url, "order") VALUES
('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', 'https://cdn.example.com/seoul_city_hall_01.jpg', 1),
('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', 'https://cdn.example.com/seoul_city_hall_02.jpg', 2);
-- 아이템
INSERT INTO public.project_items (project_id, item_id) VALUES
('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', 'f4d06f96-613d-4c29-b833-a96972d50602'), -- Aeron Chair
('2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', 'c25e9d04-119f-45bb-83db-a88a35d583d3'); -- Panton Chair
-- 태그 (tags 테이블에 '공공기관', '사무공간' 태그가 있다고 가정)
INSERT INTO public.project_tags (project_id, tag_id)
SELECT '2cd55b43-4b09-4cc3-b5b9-dea6f2109dfc', id FROM public.tags WHERE name IN ('공공기관', '사무공간');

-- 2. 부산시립도서관 (ID: 5e61d416-6079-411a-ba71-8fdcf93ae8b5)
-- 이미지
INSERT INTO public.project_images (project_id, image_url, "order") VALUES
('5e61d416-6079-411a-ba71-8fdcf93ae8b5', 'https://cdn.example.com/busan_library_01.jpg', 1);
-- 아이템
INSERT INTO public.project_items (project_id, item_id) VALUES
('5e61d416-6079-411a-ba71-8fdcf93ae8b5', '212f8f56-224c-4bbc-b8d8-611479d20fd9'), -- Stool E60
('5e61d416-6079-411a-ba71-8fdcf93ae8b5', '926b3b6f-775c-460d-849d-c564241b2baf'); -- Series 7 Chair
-- 태그 (tags 테이블에 '교육/문화', '도서관' 태그가 있다고 가정)
INSERT INTO public.project_tags (project_id, tag_id)
SELECT '5e61d416-6079-411a-ba71-8fdcf93ae8b5', id FROM public.tags WHERE name IN ('교육/문화', '도서관');

-- 3. 국립중앙의료원 (ID: 5620299f-3964-4c39-b8cc-98a1d18ff2f6)
-- 이미지
INSERT INTO public.project_images (project_id, image_url, "order") VALUES
('5620299f-3964-4c39-b8cc-98a1d18ff2f6', 'https://cdn.example.com/nmc_01.jpg', 1),
('5620299f-3964-4c39-b8cc-98a1d18ff2f6', 'https://cdn.example.com/nmc_02.jpg', 2),
('5620299f-3964-4c39-b8cc-98a1d18ff2f6', 'https://cdn.example.com/nmc_03.jpg', 3);
-- 아이템
INSERT INTO public.project_items (project_id, item_id) VALUES
('5620299f-3964-4c39-b8cc-98a1d18ff2f6', '4bf4ce33-3f89-408f-bc16-a30e457f3c69'); -- Womb Chair
-- 태그 (tags 테이블에 '의료공간', '병원' 태그가 있다고 가정)
INSERT INTO public.project_tags (project_id, tag_id)
SELECT '5620299f-3964-4c39-b8cc-98a1d18ff2f6', id FROM public.tags WHERE name IN ('의료공간', '병원');









