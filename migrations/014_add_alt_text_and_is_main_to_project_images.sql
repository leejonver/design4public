-- Add alt_text and is_main columns to project_images table
-- Migration: 014_add_alt_text_and_is_main_to_project_images
-- Created: 2025-10-10

ALTER TABLE project_images
ADD COLUMN IF NOT EXISTS alt_text TEXT,
ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Create index for faster lookup of main images
CREATE INDEX IF NOT EXISTS idx_project_images_is_main ON project_images(project_id, is_main) WHERE is_main = true;

-- Add comments
COMMENT ON COLUMN project_images.alt_text IS 'Alternative text for the image';
COMMENT ON COLUMN project_images.is_main IS 'Whether this is the main/cover image for the project';

