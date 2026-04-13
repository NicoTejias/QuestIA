-- Columnas faltantes para migración completa
-- Ejecutar en Supabase SQL Editor

-- redemptions: agregar course_id (derive from reward_id)
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS course_id UUID;

-- Actualizar course_id en redemptions basado en rewards
UPDATE redemptions r
SET course_id = rew.course_id
FROM rewards rew
WHERE r.reward_id = rew.id;

-- Agregar otras columnas que pueden faltar
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS selected_options JSONB;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS time_penalty INT DEFAULT 0;
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS submitted_text TEXT;
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS submitted_files JSONB;

-- Verificar columnas
SELECT 
  'redemptions' as table_name,
  column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'redemptions'
UNION ALL
SELECT 
  'quiz_submissions' as table_name,
  column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quiz_submissions'
UNION ALL
SELECT 
  'mission_submissions' as table_name,
  column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mission_submissions'
ORDER BY table_name, column_name;