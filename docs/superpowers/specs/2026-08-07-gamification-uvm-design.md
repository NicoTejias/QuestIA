# Especificación de Diseño: Gamificación con Alineamiento Pedagógico (UVM) en QuestIA

> **Fecha**: 2026-08-07  
> **Estado**: Aprobado  
> **Objetivo**: Integrar los principios pedagógicos del documento UVM ("Orientaciones para el uso de metodologías activas") en QuestIA, incorporando alineamiento por Resultados de Aprendizaje (RA) e intencionalidad por momentos pedagógicos (Pase de Entrada, Ticket de Salida y Desafíos Autónomos).

---

## 1. Arquitectura y Modelo de Datos (Convex Backend)

### `convex/schema.ts`
En la tabla `quizzes`, se incorporan los campos:
- `learning_objective`: `v.optional(v.string())` - Texto descriptivo o identificador del Resultado de Aprendizaje (RA).
- `pedagogical_moment`: `v.optional(v.union(v.literal("entry_pass"), v.literal("exit_ticket"), v.literal("autonomous_challenge"), v.literal("general")))`

---

## 2. Lógica del Backend e Integración con IA (`convex/quizzes.ts`)

- **Funciones Backend**:
  - `generateQuiz` (Action): Se actualiza el prompt de Gemini para incluir el `learning_objective` y ajustar el enfoque según `pedagogical_moment`:
    - `entry_pass`: 2-3 preguntas breves de activación previa (Bloom: Recordar/Comprender).
    - `exit_ticket`: 2-3 preguntas rápidas de evaluación formativa al cierre (Bloom: Aplicar/Analizar).
    - `autonomous_challenge`: Preguntas de profundización práctica para estudio autónomo.
  - `createQuizManual` (Mutation) & `updateQuiz` (Mutation): Actualizadas para recibir y almacenar `learning_objective` y `pedagogical_moment`.

---

## 3. Componentes de Interfaz de Usuario (Frontend React + Tailwind)

### `src/components/quizzes/`
- **Modal de Creación de Quiz**: Selección de Momento Pedagógico (Badges interactivos) e ingreso del Resultado de Aprendizaje (RA).
- **Tarjeta de Quiz / Misión (Docente y Estudiante)**: Renderizado de insignias visuales (Pase de Entrada, Ticket de Salida, Desafío Autónomo).
- **Filtros en Lista de Quizzes**: Posibilidad de filtrar por momento pedagógico.

---

## 4. Plan de Verificación

1. **Pruebas Unitarias/Tipado**: Validar que los esquemas de Convex compilen sin errores con `npx convex dev --once` o `npm run lint`.
2. **Generación con IA**: Verificar que los quizzes generados con Gemini incorporen el momento pedagógico y RA seleccionados.
3. **UI Verification**: Comprobar que en las listas de quizzes se desplieguen los badges visuales correspondientes a cada momento pedagógico.
