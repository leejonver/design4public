-- 프로젝트 생성 RPC 함수에 slug 처리 추가

-- 기존 함수 삭제 (반환 타입이 변경되므로)
DROP FUNCTION IF EXISTS public.create_project_with_relations(text,text,text,integer,numeric,project_status,text,project_image_type[],uuid[],uuid[]);

-- 새로운 함수 생성
CREATE FUNCTION public.create_project_with_relations(
  p_title TEXT,
  p_description TEXT,
  p_location TEXT,
  p_year INT,
  p_area NUMERIC,
  p_status project_status,
  p_inquiry_url TEXT,
  p_images project_image_type[],
  p_tag_ids UUID[],
  p_item_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  year INT,
  area NUMERIC,
  status project_status,
  inquiry_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  slug TEXT
) AS $$
DECLARE
  new_project_id UUID;
  new_slug TEXT;
  slug_counter INT := 0;
  base_slug TEXT;
  img project_image_type;
  tag_id UUID;
  item_id UUID;
BEGIN
  -- 1. slug 생성 (title 기반)
  base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);
  
  new_slug := base_slug;
  
  -- slug 중복 확인 및 처리
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = new_slug) LOOP
    slug_counter := slug_counter + 1;
    new_slug := base_slug || '-' || slug_counter;
  END LOOP;

  -- 2. 프로젝트 생성
  INSERT INTO public.projects (title, description, location, year, area, status, inquiry_url, slug)
  VALUES (p_title, p_description, p_location, p_year, p_area, p_status, p_inquiry_url, new_slug)
  RETURNING public.projects.id INTO new_project_id;

  -- 3. 이미지 저장
  IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
    FOREACH img IN ARRAY p_images
    LOOP
      INSERT INTO public.project_images (project_id, image_url, alt_text, is_main, "order")
      VALUES (new_project_id, img.image_url, img.alt_text, img.is_main, img."order");
    END LOOP;
  END IF;
  
  -- 4. 태그 연결
  IF p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 THEN
    FOREACH tag_id IN ARRAY p_tag_ids
    LOOP
      INSERT INTO public.project_tags (project_id, tag_id)
      VALUES (new_project_id, tag_id);
    END LOOP;
  END IF;

  -- 5. 아이템 연결
  IF p_item_ids IS NOT NULL AND array_length(p_item_ids, 1) > 0 THEN
    FOREACH item_id IN ARRAY p_item_ids
    LOOP
      INSERT INTO public.project_items (project_id, item_id)
      VALUES (new_project_id, item_id);
    END LOOP;
  END IF;

  -- 생성된 프로젝트 정보 반환
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.location,
    p.year,
    p.area,
    p.status,
    p.inquiry_url,
    p.created_at,
    p.updated_at,
    p.slug
  FROM public.projects p
  WHERE p.id = new_project_id;

END;
$$ LANGUAGE plpgsql;

