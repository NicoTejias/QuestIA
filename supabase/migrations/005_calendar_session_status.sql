-- Estados de sesión, registro de asistencia RAGC y horas de cada clase.

-- 1. Ampliar los estados posibles de una sesión.
--    programada  → aún no ocurre
--    realizada   → el profesor confirmó que la dictó
--    pendiente   → no se realizó (feriado/suspensión/enfermedad/falla); su contenido queda por recuperar
--    adelantada  → se dictó antes de la fecha planificada
--    suspendida  → suspendida oficialmente (feriado institucional)
ALTER TABLE clases_calendarizadas DROP CONSTRAINT IF EXISTS clases_calendarizadas_estado_check;
ALTER TABLE clases_calendarizadas
  ADD CONSTRAINT clases_calendarizadas_estado_check
  CHECK (estado = ANY (ARRAY['programada','realizada','pendiente','adelantada','suspendida','dictada']));

-- 2. Registro de asistencia en RAGC (plataforma de asistencia).
--    Se marca aparte porque hay 24h de plazo para registrarla tras la clase.
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS asistencia_ragc BOOLEAN DEFAULT FALSE;

-- 3. Horas de inicio y término reales de la sesión (formato "HH:MM"), derivadas
--    de los módulos del horario del profesor. La confirmación de la clase se
--    habilita a partir de hora_inicio (el profesor puede terminar antes).
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS hora_inicio TEXT;
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS hora_fin TEXT;

-- 4. Nota de recuperación cuando la clase queda pendiente (trabajo autónomo,
--    repaso en la clase siguiente, etc.).
ALTER TABLE clases_calendarizadas
  ADD COLUMN IF NOT EXISTS nota_recuperacion TEXT;
