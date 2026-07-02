-- photos 관련 테이블 생성
-- Migration: 016_create_photos_table
-- Created: 2025-12-15
-- Description: 독립적인 사진 엔티티와 관련 중간 테이블 생성

-- ============================================
-- 1. photos 테이블 (독립적인 사진 엔티티)
-- ============================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_image_url ON public.photos(image_url);

-- 테이블 및 컬럼 설명
COMMENT ON TABLE public.photos IS '독립적인 사진 콘텐츠 테이블';
COMMENT ON COLUMN public.photos.image_url IS '이미지 URL (Supabase Storage)';
COMMENT ON COLUMN public.photos.alt_text IS '대체 텍스트 (접근성)';
COMMENT ON COLUMN public.photos.title IS '사진 제목 (선택)';
COMMENT ON COLUMN public.photos.description IS '사진 설명 (선택)';

-- RLS 활성화
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "photos_select_public" ON public.photos
  FOR SELECT
  USING (true);

-- 인증된 사용자만 CUD 가능
CREATE POLICY "photos_insert_authenticated" ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "photos_update_authenticated" ON public.photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "photos_delete_authenticated" ON public.photos
  FOR DELETE
  TO authenticated
  USING (true);

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_photos_updated_at ON public.photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. photo_items 중간 테이블 (사진-아이템 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS public.photo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, item_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photo_items_photo_id ON public.photo_items(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_items_item_id ON public.photo_items(item_id);

-- 테이블 설명
COMMENT ON TABLE public.photo_items IS '사진에 연결된 아이템 중간 테이블';
COMMENT ON COLUMN public.photo_items.photo_id IS '사진 ID';
COMMENT ON COLUMN public.photo_items.item_id IS '아이템 ID';

-- RLS 활성화
ALTER TABLE public.photo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_items_select_public" ON public.photo_items
  FOR SELECT USING (true);

CREATE POLICY "photo_items_insert_authenticated" ON public.photo_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "photo_items_update_authenticated" ON public.photo_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "photo_items_delete_authenticated" ON public.photo_items
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- 3. project_photos 중간 테이블 (프로젝트-사진 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  is_main BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, photo_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_photos_project_id ON public.project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_photo_id ON public.project_photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_is_main ON public.project_photos(project_id, is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_project_photos_order ON public.project_photos(project_id, "order");

-- 테이블 설명
COMMENT ON TABLE public.project_photos IS '프로젝트에 연결된 사진 중간 테이블';
COMMENT ON COLUMN public.project_photos.project_id IS '프로젝트 ID';
COMMENT ON COLUMN public.project_photos.photo_id IS '사진 ID';
COMMENT ON COLUMN public.project_photos.is_main IS '대표 이미지 여부';
COMMENT ON COLUMN public.project_photos."order" IS '사진 표시 순서';

-- RLS 활성화
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_photos_select_public" ON public.project_photos
  FOR SELECT USING (true);

CREATE POLICY "project_photos_insert_authenticated" ON public.project_photos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "project_photos_update_authenticated" ON public.project_photos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "project_photos_delete_authenticated" ON public.project_photos
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- 4. photo_tags 중간 테이블 (사진-태그 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS public.photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, tag_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON public.photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON public.photo_tags(tag_id);

-- 테이블 설명
COMMENT ON TABLE public.photo_tags IS '사진에 연결된 태그 중간 테이블';

-- RLS 활성화
ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_tags_select_public" ON public.photo_tags
  FOR SELECT USING (true);

CREATE POLICY "photo_tags_insert_authenticated" ON public.photo_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "photo_tags_update_authenticated" ON public.photo_tags
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "photo_tags_delete_authenticated" ON public.photo_tags
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- 5. brand_tags 중간 테이블 (브랜드-태그 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS public.brand_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, tag_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_brand_tags_brand_id ON public.brand_tags(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_tags_tag_id ON public.brand_tags(tag_id);

-- 테이블 설명
COMMENT ON TABLE public.brand_tags IS '브랜드에 연결된 태그 중간 테이블';

-- RLS 활성화
ALTER TABLE public.brand_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_tags_select_public" ON public.brand_tags
  FOR SELECT USING (true);

CREATE POLICY "brand_tags_insert_authenticated" ON public.brand_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "brand_tags_update_authenticated" ON public.brand_tags
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "brand_tags_delete_authenticated" ON public.brand_tags
  FOR DELETE TO authenticated USING (true);

