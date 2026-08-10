# Especificación de Diseño: Vinculación de Cuadernos de Google Drive ("Course Notebook") en QuestIA

> **Fecha**: 2026-08-10  
> **Estado**: Aprobado  
> **Objetivo**: Permitir a los profesores vincular sus cuentas de Google Drive para utilizar una carpeta del curso (y sus subcarpetas) como "Cuaderno Digital de Recursos". De esta forma, QuestIA lee directamente la documentación académica del docente (syllabus, presentaciones, guías, pautas) sin almacenar archivos binarios en nuestro servidor, y alimenta automáticamente a Gemini para la planificación del curso y generación de evaluaciones.

---

## 1. Arquitectura de Autenticación y Esquema de Datos

### `convex/auth.ts`
- **OAuth Scopes de Google**: Se extiende la configuración de Google Provider para solicitar el permiso `https://www.googleapis.com/auth/drive.readonly` (o `drive.file` mediante Google Picker).
- **Transparencia para el Usuario**: El profesor inicia sesión con su cuenta estándar de Google. No se le solicita ninguna API Key ni configuración técnica en Google Cloud.

### `convex/schema.ts`
En la tabla `courses`, se incorporan los siguientes campos de sincronización con Google Drive:
- `drive_folder_id`: `v.optional(v.string())` — ID único de la carpeta raíz del curso en Google Drive.
- `drive_folder_name`: `v.optional(v.string())` — Nombre de la carpeta para despliegue en UI.
- `last_drive_sync`: `v.optional(v.number())` — Timestamp de la última indexación de archivos.
- `drive_files_manifest`: `v.optional(v.array(v.object({`
  - `id`: `v.string()` — ID del archivo en Google Drive.
  - `name`: `v.string()` — Nombre del archivo.
  - `mimeType`: `v.string()` — Tipo de documento (PDF, PPTX, DOCX, Google Doc, etc.).
  - `path`: `v.string()` — Ruta de subcarpeta relativa (ej: `/Unidad 1/Clase 1.pptx`).
  - `category`: `v.optional(v.string())` — Categoría clasificada por IA (`syllabus`, `slides`, `guide`, `assessment`, `other`).
`})))`

---

## 2. Lógica del Backend e Ingesta Recursiva (`convex/drive_sync.ts` & `convex/geminiClient.ts`)

- **Escaneo Recursivo de Subcarpetas (`convex/drive_sync.ts`)**:
  - Acción `syncCourseDriveFolder`: Consulta la API de Google Drive en profundidad utilizando la consulta `'folder_id' in parents` recursivamente.
  - Genera el árbol completo del cuaderno reconociendo la estructura de subcarpetas creadas por el docente (ej: `Semana 1`, `Evaluaciones`, `Prácticos`).
- **Clasificación de Documentos con Gemini**:
  - La IA analiza los nombres de las carpetas y los contenidos internos de los documentos para categorizarlos en:
    1. **Syllabus / PDA**: Objetivos de aprendizaje, unidades, reglas y bibliografía.
    2. **Presentaciones / Diapositivas**: Contenido teórico por clase.
    3. **Guías / Ejercicios**: Material práctico y casos de estudio.
    4. **Evaluaciones / Pautas**: Criterios de evaluación y rúbricas.
- **Procesamiento Efímero de Archivos**:
  - Los archivos se descargan o exportan efímeramente en memoria desde la API de Google Drive directamente hacia Gemini API. **No se almacena ningún archivo binario en la base de datos ni servidor de QuestIA**, garantizando costo $0 de almacenamiento propio.

---

## 3. Componentes de Interfaz de Usuario (Frontend React + Vite)

### `src/components/courses/CourseNotebookPanel.tsx`
- **Selector de Carpeta**: Integración con Google Picker API o creación automática de la carpeta `QuestIA - [Código Ramo]`.
- **Visor de Árbol del Cuaderno**: Muestra las subcarpetas y archivos indexados desde Google Drive con sus respectivas insignias de categoría.
- **Acción "Planificar Curso con IA"**: Botón que dispara el análisis del cuaderno completo para generar la carta gantt semanal, actividades, quizzes y misiones gamificadas.

---

## 4. Plan de Verificación

1. **Verificación de Tipado y Esquema**: Compilación sin errores ejecutando `npx convex dev --once`.
2. **Prueba de Autenticación OAuth**: Confirmar que el flujo de login de Google en [auth.ts](file:///c:/Users/nicol/Desktop/Proyectos/Duocencia/QuestIA/convex/auth.ts) solicite correctamente el scope de Drive sin interrumpir a usuarios existentes.
3. **Indexación de Subcarpetas**: Validar que la función de escaneo recorra correctamente subcarpetas anidadas y genere la lista de manifiesto en `courses.drive_files_manifest`.
4. **Verificación de Ingesta en Gemini**: Comprobar que Gemini reciba el contexto del cuaderno y genere una planificación del curso basada en los PDFs/diapositivas contenidos en Google Drive.
