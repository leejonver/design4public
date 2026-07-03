-- item_images 테이블 생성
-- 아이템의 여러 이미지를 저장하기 위한 테이블
-- Migration: 015_create_item_images_table
-- Created: 2025-10-27

-- item_images 테이블 생성
CREATE TABLE IF NOT EXISTS public.item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON public.item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_is_main ON public.item_images(item_id, is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_item_images_order ON public.item_images(item_id, "order");

-- 테이블 및 컬럼 설명 추가
COMMENT ON TABLE public.item_images IS '아이템의 이미지들을 저장하는 테이블';
COMMENT ON COLUMN public.item_images.item_id IS '연결된 아이템 ID';
COMMENT ON COLUMN public.item_images.image_url IS '이미지 URL';
COMMENT ON COLUMN public.item_images.alt_text IS '대체 텍스트 (접근성)';
COMMENT ON COLUMN public.item_images.is_main IS '대표 이미지 여부';
COMMENT ON COLUMN public.item_images."order" IS '이미지 표시 순서';

-- RLS 활성화
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "item_images_select_public" ON public.item_images
  FOR SELECT
  USING (true);

-- 인증된 사용자만 삽입/수정/삭제 가능
CREATE POLICY "item_images_insert_authenticated" ON public.item_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "item_images_update_authenticated" ON public.item_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "item_images_delete_authenticated" ON public.item_images
  FOR DELETE
  TO authenticated
  USING (true);

-- 기존 items 테이블의 image_url 데이터를 item_images로 마이그레이션
-- image_url이 있는 경우, 이를 item_images 테이블로 복사
INSERT INTO public.item_images (item_id, image_url, alt_text, is_main, "order")
SELECT 
  id,
  image_url,
  name AS alt_text,
  true AS is_main,
  1 AS "order"
FROM public.items
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.item_images WHERE item_id = items.id
  );

-- updated_at 트리거 함수가 없다면 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 추가
DROP TRIGGER IF EXISTS update_item_images_updated_at ON public.item_images;
CREATE TRIGGER update_item_images_updated_at
  BEFORE UPDATE ON public.item_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

