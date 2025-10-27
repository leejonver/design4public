-- RLS 활성화 (이미 되어있다면 에러 없이 넘어감)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (필요 시)
-- DROP POLICY IF EXISTS "정책이름" ON public.테이블명;

-- 신규 정책 추가

-- 1. brands: 누구나 조회 가능
CREATE POLICY "Public brands are viewable by everyone."
ON public.brands FOR SELECT
USING ( true );

-- 2. items: 누구나 조회 가능
CREATE POLICY "Public items are viewable by everyone."
ON public.items FOR SELECT
USING ( true );

-- 3. tags: 누구나 조회 가능
CREATE POLICY "Public tags are viewable by everyone."
ON public.tags FOR SELECT
USING ( true );

-- 4. project_images: published 프로젝트에 속한 이미지만 누구나 조회 가능
CREATE POLICY "Images of published projects are viewable by everyone."
ON public.project_images FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_images.project_id AND p.status = 'published'::text
  )
);

-- 5. project_items: published 프로젝트에 속한 아이템만 누구나 조회 가능
CREATE POLICY "Items of published projects are viewable by everyone."
ON public.project_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_items.project_id AND p.status = 'published'::text
  )
);

-- 6. project_tags: published 프로젝트에 속한 태그만 누구나 조회 가능
CREATE POLICY "Tags of published projects are viewable by everyone."
ON public.project_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_tags.project_id AND p.status = 'published'::text
  )
);










