CREATE OR REPLACE VIEW public.projects_with_details AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.description,
  p.cover_image_url,
  p.year,
  p.area,
  p.status,
  p.created_at,
  p.updated_at,
  (
    SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
    FROM project_tags pt
    JOIN tags t ON pt.tag_id = t.id
    WHERE pt.project_id = p.id
  ) AS tags,
  (
    SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'slug', i.slug, 'brand', json_build_object('id', b.id, 'name', b.name, 'slug', b.slug)))
    FROM project_items pi
    JOIN items i ON pi.item_id = i.id
    LEFT JOIN brands b ON i.brand_id = b.id
    WHERE pi.project_id = p.id
  ) AS items,
  (
    SELECT json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'order', pi.order) ORDER BY "order" ASC)
    FROM project_images pi
    WHERE pi.project_id = p.id
  ) AS images
FROM
  projects p;









