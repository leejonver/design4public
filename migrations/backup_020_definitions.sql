-- Definitions backed up before migration 020 (for manual restore if ever needed).

-- View: projects_with_details
CREATE OR REPLACE VIEW public.projects_with_details AS
 SELECT id,
    title,
    slug,
    description,
    cover_image_url,
    year,
    area,
    status,
    created_at,
    updated_at,
    ( SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) AS json_agg
           FROM project_tags pt
             JOIN tags t ON pt.tag_id = t.id
          WHERE pt.project_id = p.id) AS tags,
    ( SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'slug', i.slug, 'brand', json_build_object('id', b.id, 'name', b.name_ko, 'slug', b.slug))) AS json_agg
           FROM project_items pi
             JOIN items i ON pi.item_id = i.id
             LEFT JOIN brands b ON i.brand_id = b.id
          WHERE pi.project_id = p.id) AS items,
    ( SELECT json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'order', pi."order") ORDER BY pi."order") AS json_agg
           FROM project_images pi
          WHERE pi.project_id = p.id) AS images
   FROM projects p;

-- Function: create_project_with_relations
CREATE OR REPLACE FUNCTION public.create_project_with_relations(p_title text, p_description text, p_location text, p_year integer, p_area numeric, p_status project_status, p_inquiry_url text, p_images project_image_type[], p_tag_ids uuid[], p_item_ids uuid[])
 RETURNS TABLE(id uuid, title text, description text, location text, year integer, area numeric, status project_status, inquiry_url text, created_at timestamp with time zone, updated_at timestamp with time zone, slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;
