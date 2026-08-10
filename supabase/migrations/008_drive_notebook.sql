-- Migration 008: Add Google Drive notebook fields to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_folder_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_drive_sync BIGINT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_files_manifest JSONB;
