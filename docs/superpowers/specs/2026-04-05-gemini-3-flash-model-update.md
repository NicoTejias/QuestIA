# Diseño: Migración a Gemini 3 Flash Preview para Generación de Contenido AI

**Fecha:** 2026-04-05
**Estado:** Propuesto
**Contexto:** QuestIA utiliza la API de Google Gemini para generar quizzes, feedback académico y evaluar entregas. El usuario ha solicitado migrar al modelo `gemini-3-flash-preview` para aprovechar sus mejoras en rendimiento y precisión, manteniendo los modelos actuales como respaldo (fallback).

## Objetivos
1. Establecer `gemini-3-flash-preview` como el modelo predeterminado para todas las acciones de IA.
2. Mantener la infraestructura actual de fallbacks automáticos para garantizar alta disponibilidad.
3. Estandarizar la comunicación y respuestas del asistente en **español**.

## Arquitectura de Modelos (Jerarquía de Fallback)
El sistema utiliza una lógica de reintentos en serie. El nuevo orden de prioridad será:
1.  `gemini-3-flash-preview` (Nuevas capacidades, mayor velocidad)
2.  `gemini-2.5-flash` (Respaldo probado)
3.  `gpt-4o-mini` (Respaldo externo final vía OpenAI)

## Cambios Propuestos

### 1. Actualización de Cliente `convex/geminiClient.ts`
*   Actualizar la constante `GEMINI_MODELS` para incluir el nuevo modelo al principio del arreglo.
*   Actualizar el valor por defecto en `getGeminiModel(modelName = "gemini-3-flash-preview")`.
*   Ajustar comentarios del archivo para reflejar la realidad del ecosistema de modelos en 2026.

### 2. Configuración de Reglas de Proyecto (`GEMINI.md`)
*   Creación de un archivo de reglas en la raíz para asegurar que Antigravity siempre responda en español.
*   Especificar que los prompts y respuestas deben priorizar el español chileno formal cuando aplique (contexto universitario DuocUC).

### 3. Validación de Quizzes (`convex/quizzes.ts`)
*   Verificar que los prompts en `generateQuiz` no necesiten ajustes para el nuevo modelo.
*   Confirmar que el sanitizador de JSON sigue siendo robusto para las respuestas de la serie Gemini 3.

## Plan de Verificación
1. Ejecutar tests existentes en `src/test/quizzes.security.test.ts` (mocking).
2. Verificar manualmente la generación de un quiz (si es posible en entorno dev).
3. Confirmar que ante un fallo simulado de Gemini 3, el sistema continúa operando con los fallbacks configurados.

---
**Nota de Idioma:** Todas las interacciones futuras del asistente deberán ser en español.
