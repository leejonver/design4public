-- 태그 타입 확장
-- Migration: 017_extend_tag_types
-- Created: 2025-12-15
-- Description: tag_type enum에 'photo', 'brand' 값 추가

-- tag_type enum에 새로운 값 추가
-- PostgreSQL에서 enum에 새 값을 추가하려면 ALTER TYPE 사용
ALTER TYPE tag_type ADD VALUE IF NOT EXISTS 'photo';
ALTER TYPE tag_type ADD VALUE IF NOT EXISTS 'brand';

-- 변경사항 설명 업데이트
COMMENT ON TYPE tag_type IS '태그 타입: project(프로젝트), item(아이템), photo(사진), brand(브랜드)';

