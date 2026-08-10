-- Migration 009: Add missing evaluation columns to clases_calendarizadas table
ALTER TABLE clases_calendarizadas ADD COLUMN IF NOT EXISTS numero_evaluacion TEXT;
ALTER TABLE clases_calendarizadas ADD COLUMN IF NOT EXISTS ponderacion NUMERIC;
ALTER TABLE clases_calendarizadas ADD COLUMN IF NOT EXISTS nota_recuperacion TEXT;
ALTER TABLE clases_calendarizadas ADD COLUMN IF NOT EXISTS detalle_feriado TEXT;
