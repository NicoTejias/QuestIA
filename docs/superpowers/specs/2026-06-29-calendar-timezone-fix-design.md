# Diseño de Solución: Corrección de Desfases de Fechas y Zona Horaria en el Calendario

Este documento detalla el diseño para resolver el error de desfase en la calendarización de clases (que a veces inicia un día antes, por ejemplo, domingo 8 de marzo en lugar de lunes 9 de marzo) y garantizar que la calendarización comience en la primera fecha válida según los días de clases de la semana de inicio (Semana 1).

## Análisis del Problema
1. **Timezone Shift en la Vista (`CalendarDashboard.tsx`):**
   - La cuadrícula mensual utiliza `day.toISOString().split('T')[0]` y `cDate = new Date(c.fecha).toISOString().split('T')[0]`.
   - Dado que `toISOString()` convierte a UTC, si la fecha local está a la medianoche (como ocurre con las celdas de la cuadrícula creadas con `new Date(year, month, i)`), en zonas horarias con desfases de hora respecto a UTC esto altera el día, moviendo el lunes 9 de marzo (local) a la tarde/noche del domingo 8 de marzo (UTC).
2. **Timezone Shift en la Generación (`src/lib/api.ts` y `convex/calendarActions.ts`):**
   - Al buscar la primera clase y calcular las semanas relativas al lunes de inicio, la falta de normalización consistente a mediodía local provoca que `getDay()` retorne el día equivocado si el desfase de zona horaria del navegador cambia el día real.

## Cambios Propuestos

### 1. Helper de Fecha Local en `src/lib/api.ts` y `src/components/teacher/CalendarDashboard.tsx`
Crearemos o utilizaremos una función que retorne el formato `YYYY-MM-DD` en hora local en lugar de UTC:
```typescript
export const getLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
```

### 2. Actualización de `src/components/teacher/CalendarDashboard.tsx`
Modificar la cuadrícula mensual para usar `getLocalDateString`:
```typescript
const dateStr = getLocalDateString(day);
const clasesDia = clases.filter(c => {
  const cDate = getLocalDateString(new Date(c.fecha));
  return cDate === dateStr;
});
```

### 3. Ajustes en `src/lib/api.ts` y `convex/calendarActions.ts` (Generador de Fechas)
- Normalizar todas las fechas temporales y de inicio usando `setHours(12, 0, 0, 0)` para mitigar problemas con el desfase horario.
- Asegurar que `getFirstClassDate` y `getNextClassDate` respeten el orden cronológico a partir de la fecha de inicio del semestre.

## Plan de Pruebas
1. Generar un nuevo calendario ingresando el lunes 9 de marzo de 2026 como inicio del semestre.
2. Confirmar que la primera clase calendarizada se asocie al primer día de clases configurado de esa semana (Semana 1) y no antes.
3. Verificar la cuadrícula mensual en diferentes zonas horarias simuladas para confirmar que no ocurra un desfase de 1 día.
