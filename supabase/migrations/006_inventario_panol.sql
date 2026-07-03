-- Inventario de pañol: materiales disponibles para sugerir en la planificación de clases.

CREATE TABLE IF NOT EXISTS inventario_panol (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria TEXT,           -- hoja de origen (ej: "instrumentos", "herramientas", "semiconductores")
  tipo TEXT,                -- clasificación del material (medición / manual / fungible / equipamiento)
  descripcion TEXT NOT NULL,-- nombre/descripción del material
  stock INTEGER DEFAULT 0,  -- unidades en pañol
  estado TEXT,              -- completo / incompleto
  observacion TEXT,         -- notas (ej: "1 mala", "faltan tornillos")
  disponible BOOLEAN DEFAULT TRUE, -- si se puede sugerir/solicitar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_panol_categoria ON inventario_panol (categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_panol_descripcion ON inventario_panol (descripcion);

ALTER TABLE inventario_panol ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access panol" ON inventario_panol;
CREATE POLICY "Service role full access panol" ON inventario_panol FOR ALL USING (true);
