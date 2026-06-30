# Calendario Timezone Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** corregir desfases de fechas y de zona horaria en el calendario de clases y su algoritmo de generación.

**Architecture:** Normalizar la visualización y generación de fechas en el calendario utilizando formateo local en lugar de UTC, y forzar la fecha de la primera clase al mediodía (12:00) localmente en todo el algoritmo.

**Tech Stack:** React, TypeScript, Supabase Client API, Convex (para paridad).

## Global Constraints
- Siempre responder en español.
- Seguir las buenas prácticas de manejo de fechas evitando desfases horarios.

---

### Task 1: Corrección de Visualización en la Grilla Mensual

**Files:**
- Modify: `src/components/teacher/CalendarDashboard.tsx`

**Interfaces:**
- Consumes: `c.fecha` de las clases calendarizadas.
- Produces: Visualización correcta en la grilla mensual sin desfase de zona horaria.

- [ ] **Step 1: Crear función helper `getLocalDateString` en el dashboard**
  Agregar al inicio de `src/components/teacher/CalendarDashboard.tsx`:
  ```typescript
  const getLocalDateString = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  ```

- [ ] **Step 2: Reemplazar el uso de `.toISOString()` por `getLocalDateString` en la grilla**
  Localizar la línea:
  ```typescript
  const dateStr = day.toISOString().split('T')[0]
  const clasesDia = clases.filter(c => {
    const cDate = new Date(c.fecha).toISOString().split('T')[0]
    return cDate === dateStr
  })
  ```
  Y reemplazarla por:
  ```typescript
  const dateStr = getLocalDateString(day)
  const clasesDia = clases.filter(c => {
    const cDate = getLocalDateString(new Date(c.fecha))
    return cDate === dateStr
  })
  ```

- [ ] **Step 3: Verificar visualización**
  Confirmar que las clases se posicionen en la cuadrícula del calendario en el día exacto de la semana.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/teacher/CalendarDashboard.tsx
  git commit -m "fix(calendar): fix display timezone shift in calendar dashboard grid"
  ```

---

### Task 2: Corrección del Algoritmo en `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

**Interfaces:**
- Consumes: `data.fecha_inicio` y `data.dias_semana`.
- Produces: Clases calendarizadas correctamente guardadas con fechas locales normalizadas a mediodía (12:00:00).

- [ ] **Step 1: Normalizar `fecha_inicio` y el cálculo del primer día de clase en `src/lib/api.ts`**
  Modificar el bloque alrededor de la línea 2225:
  ```typescript
  const startTemp = new Date(data.fecha_inicio)
  startTemp.setHours(12, 0, 0, 0)
  ```
  Asegurar que todas las manipulaciones de fecha en `getNextClassDate` y `getFirstClassDate` preserven el mediodía (12:00:00) local para evitar saltos de día por desfases GMT/UTC.

- [ ] **Step 2: Verificar la lógica de `getMondayOfDate`**
  ```typescript
  const getMondayOfDate = (d: Date): Date => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    monday.setHours(12, 0, 0, 0)
    return monday
  }
  ```
  Esta lógica es correcta siempre y cuando `d` tenga forzadas las 12:00 horas locales.

- [ ] **Step 3: Ajustar `getNextClassDate` y `getFirstClassDate` para asegurar mediodía**
  ```typescript
  const getNextClassDate = (timestamp: number): number => {
    let temp = new Date(timestamp)
    temp.setHours(12, 0, 0, 0)
    let loops = 0
    while (loops < 14) {
      temp.setDate(temp.getDate() + 1)
      const dayOfWeek = temp.getDay()
      if (data.dias_semana.includes(dayOfWeek)) {
        return temp.getTime()
      }
      loops++
    }
    return timestamp + 24 * 60 * 60 * 1000
  }
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/api.ts
  git commit -m "fix(calendar): ensure local noon is preserved during calendar generation"
  ```

---

### Task 3: Corrección en `convex/calendarActions.ts` (Mantener Paridad)

**Files:**
- Modify: `convex/calendarActions.ts`

**Interfaces:**
- Consumes: `args.fecha_inicio` y `args.dias_semana`.
- Produces: Fechas de clase y semanas calculadas idénticamente en Convex.

- [ ] **Step 1: Aplicar los mismos cambios en `convex/calendarActions.ts`**
  Alinear `getNextClassDate` y `getFirstClassDate` con la misma lógica que en `src/lib/api.ts`.

- [ ] **Step 2: Commit**
  ```bash
  git add convex/calendarActions.ts
  git commit -m "fix(calendar): align convex calendar generation with api.ts"
  ```
