-- Soporte de múltiples secciones por ramo en el calendario.
-- Cada clase calendarizada pertenece a una sección específica del curso.

ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS section TEXT;

-- Índice para filtrar rápido las clases de una sección dentro de un curso.
CREATE INDEX IF NOT EXISTS idx_clases_calendarizadas_course_section
  ON clases_calendarizadas (course_id, section);

-- Las clases existentes (creadas antes del multi-sección) quedan con section = NULL,
-- lo que el frontend interpreta como "sin sección asignada / sección única".
