-- Migration 010: Add drive_notebook_text column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_notebook_text TEXT;
