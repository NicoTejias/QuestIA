/**
 * Importa el inventario de pañol desde el Excel a la tabla `inventario_panol` de Supabase.
 *
 * Uso:
 *   node scripts/import-inventario-panol.mjs ["INVENTARIO PAÑOL 2024.xlsx"]
 *
 * Requiere en .env.local: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * Reemplaza todo el contenido de la tabla (borra e inserta) para poder re-ejecutarlo.
 */
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

// Cargar variables desde .env.local (sin dependencias externas)
function loadEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const filePath = process.argv[2] || 'INVENTARIO PAÑOL 2024.xlsx'
if (!fs.existsSync(filePath)) {
  console.error(`No se encontró el archivo: ${filePath}`)
  process.exit(1)
}

const clean = (v) => String(v ?? '').trim()
const toInt = (v) => {
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

const wb = XLSX.readFile(filePath)
const items = []

for (const sheetName of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })

  // Detectar la fila de encabezado (contiene "DESCRIPCIÓN" o "EQUIPAMIENTO").
  const headerIdx = rows.findIndex(r =>
    r.some(c => /DESCRIPCIÓN|EQUIPAMIENTO/i.test(clean(c)))
  )
  if (headerIdx === -1) continue
  const header = rows[headerIdx].map(clean)

  const isEquip = header.some(h => /EQUIPAMIENTO/i.test(h))

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (isEquip) {
      // Formato hoja "varios 2": EQUIPAMIENTO | CANTIDAD | ... | (obs en col 2/3)
      const descripcion = clean(r[0])
      if (!descripcion) continue
      items.push({
        categoria: sheetName,
        tipo: 'equipamiento',
        descripcion,
        stock: toInt(r[1]),
        estado: null,
        observacion: clean(r[2]) || clean(r[3]) || null,
        disponible: true,
      })
    } else {
      // Formato estándar: MATERIAL | DESCRIPCIÓN | STOCK | ESTADO | OBSERVACIÓN
      const descripcion = clean(r[1])
      if (!descripcion) continue
      items.push({
        categoria: sheetName,
        tipo: clean(r[0]).toLowerCase().replace('manuaa', 'manual') || null,
        descripcion,
        stock: toInt(r[2]),
        estado: clean(r[3]).toLowerCase() || null,
        observacion: clean(r[4]) || null,
        disponible: true,
      })
    }
  }
}

console.log(`Ítems detectados: ${items.length}`)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Reemplazar contenido: borrar todo y reinsertar por lotes.
const { error: delErr } = await supabase.from('inventario_panol').delete().neq('id', '00000000-0000-0000-0000-000000000000')
if (delErr) { console.error('Error limpiando tabla:', delErr.message); process.exit(1) }

let insertados = 0
for (let i = 0; i < items.length; i += 200) {
  const lote = items.slice(i, i + 200)
  const { error } = await supabase.from('inventario_panol').insert(lote)
  if (error) { console.error('Error insertando lote:', error.message); process.exit(1) }
  insertados += lote.length
  process.stdout.write(`\rInsertados: ${insertados}/${items.length}`)
}
console.log(`\n✅ Inventario importado: ${insertados} ítems.`)
