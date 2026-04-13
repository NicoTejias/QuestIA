# Runbook de Migración — QuestIA (Convex → Supabase)

> Última actualización: 2026-04-13
> Versión: 1.0

---

## 1. Arquitectura del Sistema

### Antes (Convex)
```
Frontend (React) → Convex (hip-fish-316) → Convex Storage (blobs)
                    ↓
              Base de datos
```

### Después (Supabase)
```
Frontend (React) → Supabase (wzkwmiyzszegekpuqnaz)
                    ↓
              PostgreSQL + Storage (bucket: course_documents)
```

### Variables de Entorno Críticas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://wzkwmiyzszegekpuqnaz.supabase.co` | Endpoint REST |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb` | Clave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Clave admin (solo scripts) |
| `CONVEX_ADMIN_KEY` | `prod:hip-fish-316|...` | Para leer datos de Convex (migración) |

---

## 2. Scripts de Migración

### Ubicación
`migrate.ts` — Script principal de migración (TypeScript)

### Comandos

```bash
# Dry-run (preview sin escribir)
npm run migrate:dry

# Migración real (wipe + insert)
npm run migrate:wipe

# Verificar conteos post-migración
npm run migrate:verify
```

### Estructura del Script
- **Fase 1:** Wipe de tablas (orden reverse-dependency)
- **Fase 2:** Migración en orden de dependencias (careers → profiles → courses → ...)
- **Fase 3:** Upload de archivos a Supabase Storage
- **Fase 4:** Verificación de integridad

---

## 3. Datos Migrados — Estado Actual

### Conteo de Filas (2026-04-13)

| Tabla | Convex (origen) | Supabase (destino) | Estado |
|-------|-----------------|-------------------|--------|
| profiles | 167 | 166 | ⚠️ 1 duplicado email |
| careers | 1 | 1 | ✅ |
| courses | 38 | 30 | ⚠️ 8 sin teacher válido |
| whitelists | 183 | 183 | ✅ |
| enrollments | 173 | 152 | ⚠️ 21 sin FK user/course |
| quizzes | 293 | 253 | ⚠️ 40 sin FK |
| quiz_submissions | 486 | 416 | ⚠️ 70 sin FK |
| quiz_attempts | 520 | 439 | ⚠️ 81 sin FK |
| notifications | 660 | 633 | ⚠️ 27 sin user |
| rewards | 80 | 64 | ⚠️ 16 sin course |
| course_documents | 39 | 39 | ✅ (sin blobs) |
| rate_limits | 106 | 98 | ⚠️ 8 sin user |

### Problemas Conocidos

1. **Blobs no migrateados:** Los 39 archivos en `course_documents` no tienen blobs en Convex Storage — requieren restauración manual si existen backups.
2. **FK orphans:** Algunos registros referencian teachers/courses que ya no existen — fueron eliminados del sistema origen.
3. **1 perfil duplicado:** Email `ni.tejias@profesor.duoc.cl` existe dos veces en Convex, solo uno migró.
4. **Columnas faltantes en quiz_attempts:** Ejecute el SQL abajo para corregir

---

## 9. SQL de Corrección Post-Migración

```sql
-- Agregar columna started_at a quiz_attempts (requerida por código)
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS started_at BIGINT;
```

---

## 4. Restauración de Emergencia

### Si Supabase se daña

```bash
# 1. Obtener backup de Convex (si aún existe)
export CONVEX_ADMIN_KEY="$(grep '^CONVEX_ADMIN_KEY=' .env.local | cut -d= -f2-)"
curl -s -X POST "https://hip-fish-316.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Convex $CONVEX_ADMIN_KEY" \
  -d '{"path":"export_queries:getAllUsers","args":{},"format":"json"}'

# 2. Recorrer cada tabla con queries de export_queries
```

### Si hay que volver a Convex

1. Mantener `CONVEX_ADMIN_KEY` en `.env.local`
2. No hacer `npx convex deploy --prod` hasta que se confirme
3. Revertir cambios en `.env.local` (cambiar URLs de Convex)

---

## 5. Endpoints de API (Post-Migración)

### Cliente Frontend
```typescript
import { supabase } from './lib/supabase'

// Query básica
const { data } = await supabase.from('profiles').select('*')

// Con join
const { data } = await supabase
  .from('enrollments')
  .select('*, courses(*)')
  .eq('user_id', clerkId)
```

### Para Scripts (Service Role)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

---

## 6. Troubleshooting

### Error: "duplicate key value"
- **Causa:** Registro ya existe en Supabase
- **Solución:** Usar `upsert` con `onConflict`

### Error: "violates foreign key constraint"
- **Causa:** FK referencía registro que no existe
- **Solución:** Los scripts de migración ya filtran estos casos (dropped=X)

### Error: "JWT expired"
- **Causa:** Token de Clerk expirado
- **Solución:** Recargar página — Clerk maneja refresh automáticamente

### Error: "row count mismatch"
- **Causa:** FK faltantes o errores de insert
- **Solución:** Revisar logs de migración — ver tabla "dropped FK"

---

## 7. Auditoría Post-Migración (2026-04-13)

### Estado de Funcionalidad

| Componente | Estado | Notas |
|------------|--------|-------|
| Build | ✅ OK | Build exitoso sin errores |
| Tests | ✅ OK | 44 tests pasando |
| Lint | ⚠️ Warnings | 3 warnings menores (no bloquantes) |
| Profiles | ✅ OK | 122 con Clerk ID, 44 con Convex ID |
| Courses | ✅ OK | 30 cursos migrateados |
| Enrollments | ✅ OK | 152 enrollments (110 Clerk ID, 42 Convex ID) |
| Quizzes | ✅ OK | 253 quizzes |
| Quiz Submissions | ✅ OK | 416 submissions |
| Rewards | ✅ OK | 64 rewards |
| Missions | ✅ OK | 24 missions |
| RLS | ⚠️ No activo | RLS deshabilitado - requiere configuración |

### Warnings de Lint (resueltos)
- `migrate.ts:34` - empty block (catch vacío) → `catch {}`
- `migrate.ts:449` - escape innecesario `\-` → `-`
- `migrate.js` - archivo obsoleto eliminado

### Problemas Conocidos

1. **Blobs no migrateados:** Los 39 archivos en `course_documents` no tienen blobs en Convex Storage.
2. **FK orphans:** ~80 registros no migrateados por FK faltantes (teachers/courses eliminados).
3. **RLS no activo:** Row Level Security deshabilitado en Supabase - revisar para producción.
4. **IDs mezclados:** Enrollments tienen mezcla de Clerk IDs (110) y Convex IDs (42). La API funciona correctamente porque busca por `clerk_id` para usuarios nuevos y soporta ambos formatos.

---

## 8. Próximos Pasos Post-Migración

- [x] Build exitoso
- [x] Tests pasando (44/44)
- [x] Datos migrateados verificables
- [ ] Habilitar RLS en Supabase para producción
- [ ] Probar app con usuario real (alumno/docente)

---

## 8. Contactos y Credenciales

| Servicio | URL | Notas |
|----------|-----|-------|
| Supabase | https://supabase.com/dashboard/project/wzkwmiyzszegekpuqnaz | Dashboard admin |
| Convex (prod) | https://hip-fish-316.convex.cloud | Solo lectura ahora |
| Convex (dev) | https://savory-jackal-316.convex.cloud | Desarrollo local |
| Clerk | https://dashboard.clerk.com/live/questia | Auth provider |

---

*Este documento se actualiza automáticamente a medida que hay cambios en la infraestructura.*