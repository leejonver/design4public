-- Deterministic E2E seed. Fixed UUIDs so specs can assert exact content.
-- Idempotent: safe to re-run (truncate + insert). Auth users are NOT seeded
-- here; global.setup.ts provisions them against the local auth admin API.

truncate table
  public.search_index,
  public.home_featured, public.site_settings,
  public.project_items, public.project_photos, public.project_categories, public.project_tags,
  public.photo_items, public.photo_tags,
  public.item_categories, public.item_tags,
  public.photos, public.items, public.projects, public.categories, public.tags, public.brands
  restart identity cascade;

-- Brands -----------------------------------------------------------------
insert into public.brands (id, name_ko, name_en, slug, description, website_url, status) values
  ('b1111111-0000-0000-0000-000000000001', '허먼밀러', 'Herman Miller', 'herman-miller', '미국 오피스 가구 브랜드.', 'https://www.hermanmiller.com', 'visible'),
  ('b1111111-0000-0000-0000-000000000002', '비트라', 'Vitra', 'vitra', '스위스 가구 브랜드.', 'https://www.vitra.com', 'visible');

-- Categories -------------------------------------------------------------
insert into public.categories (id, name, type) values
  ('c2222222-0000-0000-0000-000000000001', '오피스', 'project'),
  ('c2222222-0000-0000-0000-000000000002', '공공', 'project'),
  ('c2222222-0000-0000-0000-000000000003', '의자', 'item'),
  ('c2222222-0000-0000-0000-000000000004', '책상', 'item');

-- Free tags --------------------------------------------------------------
insert into public.tags (id, name) values
  ('a3333333-0000-0000-0000-000000000001', '모던'),
  ('a3333333-0000-0000-0000-000000000002', '친환경');

-- Items ------------------------------------------------------------------
insert into public.items (id, name, slug, brand_id, status, description, nara_url) values
  ('44444444-0000-0000-0000-000000000001', '아에론 체어', 'aeron-chair', 'b1111111-0000-0000-0000-000000000001', 'available', '인체공학 오피스 체어.', 'https://mall.g2b.go.kr/aeron'),
  ('44444444-0000-0000-0000-000000000002', '이임스 라운지', 'eames-lounge', 'b1111111-0000-0000-0000-000000000002', 'available', '라운지 체어.', null),
  ('44444444-0000-0000-0000-000000000003', '숨김 데스크', 'hidden-desk', 'b1111111-0000-0000-0000-000000000002', 'hidden', '비노출 아이템.', null);

insert into public.item_categories (item_id, category_id) values
  ('44444444-0000-0000-0000-000000000001', 'c2222222-0000-0000-0000-000000000003'),
  ('44444444-0000-0000-0000-000000000002', 'c2222222-0000-0000-0000-000000000003'),
  ('44444444-0000-0000-0000-000000000003', 'c2222222-0000-0000-0000-000000000004');

-- Photos (image_url need not resolve; the site renders plain <img>, no next/image) --
insert into public.photos (id, image_url, title, alt_text, ai_caption) values
  ('55555555-0000-0000-0000-000000000001', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/office-1.jpg', '강남 오피스 회의실', '회의실 전경', '가죽 소파와 우드 마감이 어우러진 모던 라운지, 따뜻한 색감.'),
  ('55555555-0000-0000-0000-000000000002', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/office-2.jpg', '강남 오피스 라운지', '라운지', null),
  ('55555555-0000-0000-0000-000000000003', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/aeron.jpg', '아에론 체어 클로즈업', '아에론', null),
  ('55555555-0000-0000-0000-000000000004', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/library-1.jpg', '판교 도서관 열람실', '열람실', null),
  ('55555555-0000-0000-0000-000000000005', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/library-2.jpg', '판교 도서관 외관', '외관', null),
  ('55555555-0000-0000-0000-000000000006', 'http://127.0.0.1:54321/storage/v1/object/public/images/seed/eames.jpg', '이임스 라운지', '이임스', null);

-- Projects (published + draft mix) ---------------------------------------
insert into public.projects (id, title, slug, status, year, area, location, client, description) values
  ('66666666-0000-0000-0000-000000000001', '강남 오피스 리노베이션', 'gangnam-office', 'published', 2023, 320.5, '서울시 강남구', 'ACME 주식회사', '업무 공간 리노베이션 프로젝트.'),
  ('66666666-0000-0000-0000-000000000002', '판교 공공도서관', 'pangyo-library', 'published', 2022, 1200, '경기도 성남시', '성남시청', '공공 도서관 인테리어.'),
  ('66666666-0000-0000-0000-000000000003', '비공개 초안 프로젝트', 'draft-project', 'draft', 2024, 100, '서울시 중구', null, '아직 게시되지 않은 초안.');

insert into public.project_categories (project_id, category_id) values
  ('66666666-0000-0000-0000-000000000001', 'c2222222-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000002', 'c2222222-0000-0000-0000-000000000002');

-- Project ↔ photo links (is_main sets the cover) -------------------------
insert into public.project_photos (project_id, photo_id, is_main, "order") values
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', true, 0),
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', false, 1),
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000003', false, 2),
  ('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000004', true, 0),
  ('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000005', false, 1);

-- Direct project ↔ item links (current model; drives "related items" block) --
insert into public.project_items (project_id, item_id) values
  ('66666666-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002');

-- Photo ↔ item links -----------------------------------------------------
--  * rows 1-2: item-gallery usage (photo not in any project_photos)
--  * row 3: DERIVED model — a project photo (pangyo library main photo, id …004,
--    in project_photos for project …002 which has NO direct project_items) tagged
--    with the aeron item. Exercises the direct∪derived union on both detail pages.
insert into public.photo_items (photo_id, item_id, is_main, "order") values
  ('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', true, 0),
  ('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000002', true, 0),
  ('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', false, 1);

-- Home curation + featured project --------------------------------------
insert into public.home_featured (entity_type, entity_id, "order") values
  ('project', '66666666-0000-0000-0000-000000000001', 0),
  ('project', '66666666-0000-0000-0000-000000000002', 1),
  ('item', '44444444-0000-0000-0000-000000000001', 0),
  ('item', '44444444-0000-0000-0000-000000000002', 1),
  ('photo', '55555555-0000-0000-0000-000000000001', 0),
  ('brand', 'b1111111-0000-0000-0000-000000000001', 0);

insert into public.site_settings (id, featured_project_id) values
  (true, '66666666-0000-0000-0000-000000000001');

-- Search index (M6): built from search_source so seeded rows always match
-- seeded content. Embedding is NULL — the trigram branch drives E2E; the vector
-- branch is validated separately by scripts/backfill-search.mjs at the gate.
insert into public.search_index (entity_type, entity_id, slug, title, body, image_url, embedding)
select entity_type, entity_id, slug, title, body, image_url, null
from public.search_source;
