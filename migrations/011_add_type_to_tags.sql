-- 태그 타입 열거형 생성
CREATE TYPE tag_type AS ENUM ('project', 'item');

-- tags 테이블에 type 컬럼 추가
ALTER TABLE tags ADD COLUMN type tag_type NOT NULL DEFAULT 'project';

-- 기존 태그들을 프로젝트와 아이템에서 사용하는지 확인하여 타입 설정
-- 프로젝트에서만 사용되는 태그는 'project'로 설정
UPDATE tags 
SET type = 'project'
WHERE id IN (
  SELECT DISTINCT tag_id FROM project_tags
) AND id NOT IN (
  SELECT DISTINCT tag_id FROM item_tags
);

-- 아이템에서만 사용되는 태그는 'item'으로 설정
UPDATE tags 
SET type = 'item'
WHERE id IN (
  SELECT DISTINCT tag_id FROM item_tags
) AND id NOT IN (
  SELECT DISTINCT tag_id FROM project_tags
);

-- 양쪽에서 모두 사용되는 태그는 복제하여 각각 'project', 'item' 타입으로 생성
DO $$
DECLARE
  tag_record RECORD;
  new_tag_id UUID;
BEGIN
  FOR tag_record IN 
    SELECT DISTINCT t.id, t.name, t.created_at
    FROM tags t
    WHERE t.id IN (SELECT tag_id FROM project_tags)
      AND t.id IN (SELECT tag_id FROM item_tags)
  LOOP
    -- 프로젝트용 태그는 이미 존재하므로 project로 설정
    UPDATE tags SET type = 'project' WHERE id = tag_record.id;
    
    -- 아이템용 태그를 새로 생성
    INSERT INTO tags (name, type, created_at)
    VALUES (tag_record.name, 'item', tag_record.created_at)
    RETURNING id INTO new_tag_id;
    
    -- 아이템 태그 연결을 새 태그로 변경
    UPDATE item_tags SET tag_id = new_tag_id WHERE tag_id = tag_record.id;
  END LOOP;
END $$;

-- type 컬럼에 인덱스 추가 (성능 향상)
CREATE INDEX idx_tags_type ON tags(type);

-- 기본값 제거 (이제 명시적으로 타입을 지정해야 함)
ALTER TABLE tags ALTER COLUMN type DROP DEFAULT;

COMMENT ON COLUMN tags.type IS '태그 타입: project(프로젝트 태그) 또는 item(아이템 태그)';

