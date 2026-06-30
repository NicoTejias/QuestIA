# Soporte de Múltiples Sesiones por Semana en Calendario - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Asegurar que la IA genere la cantidad correcta de sesiones por semana (por ejemplo, cátedra y laboratorio en la misma semana) según la configuración del horario semanal del profesor, alineándolas con el contenido del PDA.

**Architecture:** Modificar el prompt enviado a Gemini en el cliente y en el backend para indicarle explícitamente que genere `dias_semana.length` sesiones por cada semana del semestre, distribuyendo el contenido de cada semana del PDA entre las sesiones correspondientes de esa misma semana.

**Tech Stack:** React, TypeScript, Supabase Client API, Convex (para paridad).

## Global Constraints
- Siempre responder en español.

---

### Task 1: Actualizar Prompt en `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Ajustar el prompt en `generateCalendarFromPDA`**
  Modificar el prompt para indicarle a la IA cuántas sesiones por semana debe generar y cómo debe estructurarlas.
  
  ```typescript
  // En src/lib/api.ts, dentro de generateCalendarFromPDA:
  // Agregar al prompt:
  `Dado que el horario semanal tiene ${data.dias_semana.length} clases a la semana, debes generar exactamente ${data.dias_semana.length} sesiones para cada semana del semestre.
  Por ejemplo:
  - Para la Semana 1, debes generar ${data.dias_semana.length} sesiones consecutivas en el JSON (ej: sesión 1 y sesión 2, ambas con "semana": 1).
  - Para la Semana 2, otras ${data.dias_semana.length} sesiones consecutivas (ej: sesión 3 y sesión 4, ambas con "semana": 2).
  Distribuye el contenido temático del PDA correspondiente a cada semana entre las sesiones de esa misma semana (ej. la teoría en cátedra y la práctica/taller en laboratorio).`
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/lib/api.ts
  git commit -m "feat(calendar): update prompt to request multiple sessions per week"
  ```

---

### Task 2: Actualizar Prompt en `convex/calendarActions.ts` (Paridad)

**Files:**
- Modify: `convex/calendarActions.ts`

- [ ] **Step 1: Aplicar el mismo cambio de prompt en `convex/calendarActions.ts`**
  Modificar la variable `prompt` en `generateCalendarFromPDA` de Convex para mantener coherencia e incluir la misma regla de distribución semanal.

- [ ] **Step 2: Commit**
  ```bash
  git add convex/calendarActions.ts
  git commit -m "feat(calendar): align prompt in convex calendarActions with api.ts"
  ```
