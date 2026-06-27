-- Agregar columna schedule_config a la tabla courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_config JSONB;

-- Crear la tabla clases_calendarizadas
CREATE TABLE IF NOT EXISTS clases_calendarizadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semana INTEGER NOT NULL,
  sesion INTEGER NOT NULL,
  fecha BIGINT NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  actividades TEXT,
  materiales_requeridos TEXT,
  materiales_pedidos BOOLEAN DEFAULT FALSE,
  tiene_evaluacion BOOLEAN DEFAULT FALSE,
  evaluacion_id UUID REFERENCES evaluaciones(id) ON DELETE SET NULL,
  quiz_id UUID,
  mision_id UUID,
  es_feriado BOOLEAN DEFAULT FALSE,
  detalle_feriado TEXT,
  estado TEXT DEFAULT 'programada' CHECK (estado IN ('programada', 'dictada', 'suspendida')),
  tipo_bloque TEXT DEFAULT 'catedra' CHECK (tipo_bloque IN ('catedra', 'laboratorio', 'evaluacion')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que la columna existe por si la tabla ya había sido creada previamente
ALTER TABLE clases_calendarizadas ADD COLUMN IF NOT EXISTS tipo_bloque TEXT DEFAULT 'catedra' CHECK (tipo_bloque IN ('catedra', 'laboratorio', 'evaluacion'));

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_clases_calendarizadas_course_id ON clases_calendarizadas(course_id);
CREATE INDEX IF NOT EXISTS idx_clases_calendarizadas_fecha ON clases_calendarizadas(fecha);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clases_calendarizadas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Service role full access" ON clases_calendarizadas;
CREATE POLICY "Service role full access" ON clases_calendarizadas FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read clases_calendarizadas" ON clases_calendarizadas;
CREATE POLICY "Allow read clases_calendarizadas" ON clases_calendarizadas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert clases_calendarizadas" ON clases_calendarizadas;
CREATE POLICY "Allow insert clases_calendarizadas" ON clases_calendarizadas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update clases_calendarizadas" ON clases_calendarizadas;
CREATE POLICY "Allow update clases_calendarizadas" ON clases_calendarizadas FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete clases_calendarizadas" ON clases_calendarizadas;
CREATE POLICY "Allow delete clases_calendarizadas" ON clases_calendarizadas FOR DELETE USING (true);
