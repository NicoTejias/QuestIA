-- Ponderaciones de evaluaciones y seguimiento de recuperación de contenido pendiente.

-- Ponderación (%) y número de la evaluación (Evaluación 1/2/3, Examen Final).
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS ponderacion NUMERIC;
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS numero_evaluacion TEXT;

-- Seguimiento de recuperación: cuando una clase queda pendiente (feriado/suspensión),
-- el docente puede marcar que el contenido ya se recuperó y en qué clase/forma.
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS contenido_recuperado BOOLEAN DEFAULT FALSE;
-- Forma de resolución: 'recuperada' | 'fusionada' | 'autonoma' (trabajo autónomo).
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS forma_recuperacion TEXT;
