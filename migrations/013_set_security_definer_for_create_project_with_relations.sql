-- RPC 함수에 SECURITY DEFINER와 권한을 부여하여 RLS/권한 문제로 인한 실패를 방지

-- 기존 함수 삭제 후 SECURITY DEFINER로 재생성 (서명 동일 유지)
DROP FUNCTION IF EXISTS public.create_project_with_relations(text,text,text,integer,numeric,project_status,text,project_image_type[],uuid[],uuid[]);

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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_project_id UUID;
  new_slug TEXT;
  slug_counter INT := 0;
  base_slug TEXT;
  img project_image_type;
  tag_id UUID;
  item_id UUID;
BEGIN
  -- slug 생성
  base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);

  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = new_slug) LOOP
    slug_counter := slug_counter + 1;
    new_slug := base_slug || '-' || slug_counter;
  END LOOP;

  INSERT INTO public.projects (title, description, location, year, area, status, inquiry_url, slug)
  VALUES (p_title, p_description, p_location, p_year, p_area, p_status, p_inquiry_url, new_slug)
  RETURNING public.projects.id INTO new_project_id;

  IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
    FOREACH img IN ARRAY p_images LOOP
      INSERT INTO public.project_images (project_id, image_url, alt_text, is_main, "order")
      VALUES (new_project_id, img.image_url, img.alt_text, img.is_main, img."order");
    END LOOP;
  END IF;

  IF p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 THEN
    FOREACH tag_id IN ARRAY p_tag_ids LOOP
      INSERT INTO public.project_tags (project_id, tag_id)
      VALUES (new_project_id, tag_id);
    END LOOP;
  END IF;

  IF p_item_ids IS NOT NULL AND array_length(p_item_ids, 1) > 0 THEN
    FOREACH item_id IN ARRAY p_item_ids LOOP
      INSERT INTO public.project_items (project_id, item_id)
      VALUES (new_project_id, item_id);
    END LOOP;
  END IF;

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
$$;

-- 최소 권한 부여 (익명 호출 허용 시 public에 EXECUTE, 필요 시 조정)
GRANT EXECUTE ON FUNCTION public.create_project_with_relations(
  text,text,text,integer,numeric,project_status,text,project_image_type[],uuid[],uuid[]
) TO anon, authenticated, service_role;


