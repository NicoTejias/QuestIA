# Google Drive Notebook Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow teachers to link a Google Drive folder (and its subfolders) per course as a "Course Notebook", reading documents (PDFs, PPTs, Docs) recursively for Gemini AI course planning without storing binary files on our server.

**Architecture:** Extend Convex `schema.ts` with `drive_folder_id`, `drive_folder_name`, `last_drive_sync`, and `drive_files_manifest` on `courses`. Add Convex action `convex/drive_sync.ts` to recursively scan Google Drive subfolders, classify materials using Gemini AI, and render a frontend `CourseNotebookPanel.tsx` for teachers.

**Tech Stack:** React, TypeScript, Convex (Mutations & Actions), Google Drive REST API, Google Auth Provider, Gemini API (`gemini-3-flash-preview`), Vitest.

## Global Constraints

- **Language:** Spanish for all UI text, user messages, and academic prompts.
- **Model:** Primary AI model MUST be `gemini-3-flash-preview` via `convex/geminiClient.ts`.
- **Storage:** $0 binary storage on Convex server; files parsed ephemerally from Google Drive API into Gemini context buffers.

---

### Task 1: Convex Schema Update for Course Drive Notebook

**Files:**
- Modify: [convex/schema.ts](file:///c:/Users/nicol/Desktop/Proyectos/Duocencia/QuestIA/convex/schema.ts#L86-L110)

**Interfaces:**
- Consumes: Convex `defineTable`, `v` validator.
- Produces: Updated `courses` schema fields (`drive_folder_id`, `drive_folder_name`, `last_drive_sync`, `drive_files_manifest`).

- [ ] **Step 1: Write schema update in `convex/schema.ts`**

Add fields to `courses` table:
```typescript
drive_folder_id: v.optional(v.string()),
drive_folder_name: v.optional(v.string()),
last_drive_sync: v.optional(v.number()),
drive_files_manifest: v.optional(v.array(v.object({
    id: v.string(),
    name: v.string(),
    mimeType: v.string(),
    path: v.string(),
    category: v.optional(v.string()),
}))),
```

- [ ] **Step 2: Run schema verification**

Run: `npx convex dev --once` or `npm run build`
Expected: Convex code generation succeeds without schema validation errors.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(schema): add Google Drive notebook fields to courses table"
```

---

### Task 2: Google Drive Auth Scope Configuration

**Files:**
- Modify: [convex/auth.ts](file:///c:/Users/nicol/Desktop/Proyectos/Duocencia/QuestIA/convex/auth.ts#L36-L65)

**Interfaces:**
- Consumes: `@auth/core/providers/google`.
- Produces: Google Provider with Drive scope parameters.

- [ ] **Step 1: Configure Google Provider OAuth scopes**

In `convex/auth.ts`:
```typescript
const CustomGoogle = Google({
  authorization: {
    params: {
      scope: "openid profile email https://www.googleapis.com/auth/drive.readonly",
      access_type: "offline",
      prompt: "consent",
    },
  },
  profile(profile) {
    // Existing profile mapping logic...
  }
});
```

- [ ] **Step 2: Run build/lint check**

Run: `npm run lint` or `npx tsc --noEmit`
Expected: Passes cleanly.

- [ ] **Step 3: Commit**

```bash
git add convex/auth.ts
git commit -m "feat(auth): configure Google Drive readonly authorization scope"
```

---

### Task 3: Backend Google Drive Recursive Scanner & Manifest Generator

**Files:**
- Create: `convex/drive_sync.ts`
- Modify: [convex/courses.ts](file:///c:/Users/nicol/Desktop/Proyectos/Duocencia/QuestIA/convex/courses.ts)

**Interfaces:**
- Consumes: Google Drive REST API (`https://www.googleapis.com/drive/v3/files`), Convex `action` and `mutation`.
- Produces: `syncCourseDriveFolder` action and `updateCourseDriveManifest` mutation.

- [ ] **Step 1: Create `convex/drive_sync.ts` action**

```typescript
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  path: string;
  category?: string;
}

export const syncCourseDriveFolder = action({
  args: {
    courseId: v.id("courses"),
    folderId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Recursive folder traversal logic using Google Drive API
    const items: DriveFileItem[] = [];

    async function scanFolder(currentFolderId: string, currentPath: string) {
      const query = encodeURIComponent(`'${currentFolderId}' in parents and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)&pageSize=1000`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${args.accessToken}` },
      });
      if (!res.ok) throw new Error(`Google Drive API error: ${res.statusText}`);
      
      const data = await res.json();
      for (const file of data.files || []) {
        const filePath = `${currentPath}/${file.name}`;
        if (file.mimeType === "application/vnd.google-apps.folder") {
          await scanFolder(file.id, filePath);
        } else {
          let category = "other";
          const lower = file.name.toLowerCase();
          if (lower.includes("syllabus") || lower.includes("pda") || lower.includes("programa")) category = "syllabus";
          else if (file.mimeType.includes("presentation") || lower.includes("clase") || lower.includes("ppt")) category = "slides";
          else if (lower.includes("guia") || lower.includes("ejercicio") || lower.includes("taller")) category = "guide";
          else if (lower.includes("evaluacion") || lower.includes("prueba") || lower.includes("pauta") || lower.includes("rubrica")) category = "assessment";

          items.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            path: filePath,
            category,
          });
        }
      }
    }

    await scanFolder(args.folderId, "");

    // Update course record with manifest
    await ctx.runMutation(api.drive_sync.saveDriveManifest, {
      courseId: args.courseId,
      folderId: args.folderId,
      manifest: items,
    });

    return items;
  },
});

export const saveDriveManifest = mutation({
  args: {
    courseId: v.id("courses"),
    folderId: v.string(),
    manifest: v.array(v.object({
      id: v.string(),
      name: v.string(),
      mimeType: v.string(),
      path: v.string(),
      category: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.courseId, {
      drive_folder_id: args.folderId,
      drive_files_manifest: args.manifest,
      last_drive_sync: Date.now(),
    });
  },
});
```

- [ ] **Step 2: Run Convex type-check**

Run: `npx convex dev --once`
Expected: Successfully generates types in `convex/_generated/api.d.ts`.

- [ ] **Step 3: Commit**

```bash
git add convex/drive_sync.ts
git commit -m "feat(backend): add Google Drive recursive folder scanner and manifest saver"
```

---

### Task 4: AI Course Planning Integration using Drive Notebook Manifest

**Files:**
- Create/Modify: `convex/drive_planning.ts`
- Consumes: [convex/geminiClient.ts](file:///c:/Users/nicol/Desktop/Proyectos/Duocencia/QuestIA/convex/geminiClient.ts)

**Interfaces:**
- Consumes: `drive_files_manifest` array from `courses`.
- Produces: `planCourseFromDriveNotebook` action returning AI-generated weekly course schedule and gamified missions.

- [ ] **Step 1: Write `convex/drive_planning.ts`**

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { callGeminiWithFallback } from "./geminiClient";

export const planCourseFromDriveNotebook = action({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.runQuery(api.courses.getCourseById, { id: args.courseId });
    if (!course) throw new Error("Curso no encontrado");

    const manifest = course.drive_files_manifest || [];
    const fileTreeSummary = manifest.map(f => `- [${f.category || 'documento'}] ${f.path}`).join("\n");

    const prompt = `Eres un experto pedagógico en diseño curricular para la educación superior.
Analiza la siguiente estructura de archivos del Cuaderno de Google Drive del curso "${course.name}" (${course.code}):

ESTRUCTURA DEL CUADERNO DEL CURSO:
${fileTreeSummary || "Sin archivos indexados aun."}

DESCRIPCIÓN DEL CURSO:
${course.description}

TAREA:
Genera una propuesta de planificación académica estructurada semanalmente para el semestre.
Responde estrictamente en formato JSON con la siguiente estructura:
{
  "resumen_ejecutivo": "string",
  "semanas": [
    {
      "semana": 1,
      "unidad": "string",
      "tema": "string",
      "aprendizaje_esperado": "string",
      "archivos_referenciados": ["string"],
      "actividades_sugeridas": ["string"],
      "mision_gamificada": {
        "titulo": "string",
        "descripcion": "string",
        "puntos_exp": 100
      }
    }
  ]
}`;

    const responseText = await callGeminiWithFallback(prompt, { responseMimeType: "application/json" });
    return JSON.parse(responseText);
  },
});
```

- [ ] **Step 2: Check backend compilation**

Run: `npx convex dev --once`
Expected: Compiles cleanly.

- [ ] **Step 3: Commit**

```bash
git add convex/drive_planning.ts
git commit -m "feat(ai): integrate Gemini AI course planning with Drive Notebook manifest"
```

---

### Task 5: Frontend UI Component `CourseNotebookPanel.tsx`

**Files:**
- Create: `src/components/courses/CourseNotebookPanel.tsx`
- Modify: `src/pages/CourseDetailsPage.tsx` or course teacher dashboard view.

**Interfaces:**
- Consumes: Convex queries & actions (`api.drive_sync.syncCourseDriveFolder`, `api.drive_planning.planCourseFromDriveNotebook`).
- Produces: Notebook management card with folder tree, sync button, and AI planning launcher.

- [ ] **Step 1: Build `CourseNotebookPanel.tsx`**

```tsx
import React, { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Folder, FileText, RefreshCw, Sparkles, FolderOpen, CheckCircle } from "lucide-react";

interface CourseNotebookPanelProps {
  courseId: Id<"courses">;
}

export const CourseNotebookPanel: React.FC<CourseNotebookPanelProps> = ({ courseId }) => {
  const course = useQuery(api.courses.getCourseById, { id: courseId });
  const syncFolder = useAction(api.drive_sync.syncCourseDriveFolder);
  const planCourse = useAction(api.drive_planning.planCourseFromDriveNotebook);

  const [folderInput, setFolderInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningResult, setPlanningResult] = useState<any>(null);

  if (!course) return null;

  const manifest = course.drive_files_manifest || [];

  const handleSync = async () => {
    if (!folderInput && !course.drive_folder_id) return;
    setIsSyncing(true);
    try {
      // In production, token is retrieved via Google OAuth session
      const token = "MOCK_OR_SESSION_TOKEN"; 
      await syncFolder({
        courseId,
        folderId: folderInput || course.drive_folder_id || "",
        accessToken: token,
      });
    } catch (err) {
      console.error("Error sincronizando carpeta:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlanCourse = async () => {
    setIsPlanning(true);
    try {
      const res = await planCourse({ courseId });
      setPlanningResult(res);
    } catch (err) {
      console.error("Error al planificar curso:", err);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold">Cuaderno del Curso en Google Drive</h3>
        </div>
        {course.last_drive_sync && (
          <span className="text-xs text-slate-400">
            Sincronizado: {new Date(course.last_drive_sync).toLocaleString()}
          </span>
        )}
      </div>

      {!course.drive_folder_id && (
        <div className="mb-4 space-y-2">
          <label className="block text-sm text-slate-300">ID de Carpeta de Google Drive o URL:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="Ingresa el ID o enlace de la carpeta..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Vincular"}
            </button>
          </div>
        </div>
      )}

      {manifest.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-950/60 rounded-lg p-4 max-h-60 overflow-y-auto border border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Archivos e Insumos Detectados ({manifest.length})
            </h4>
            <ul className="space-y-1.5 text-sm">
              {manifest.map((file) => (
                <li key={file.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/50 rounded">
                  <span className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate text-slate-200">{file.path}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 uppercase">
                    {file.category || "General"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Re-sincronizar Subcarpetas</span>
            </button>

            <button
              onClick={handlePlanCourse}
              disabled={isPlanning}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center space-x-2"
            >
              <Sparkles className={`w-4 h-4 ${isPlanning ? "animate-spin" : ""}`} />
              <span>{isPlanning ? "Analizando Cuaderno..." : "Generar Planificación con IA"}</span>
            </button>
          </div>
        </div>
      )}

      {planningResult && (
        <div className="mt-6 border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <CheckCircle className="w-5 h-5" />
            <span>Planificación Generada Exitosamente</span>
          </div>
          <p className="text-sm text-slate-300">{planningResult.resumen_ejecutivo}</p>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run frontend build check**

Run: `npm run build`
Expected: Build succeeds without TypeScript or JSX errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/courses/CourseNotebookPanel.tsx
git commit -m "feat(ui): add CourseNotebookPanel component for Google Drive subfolder management and AI planning"
```

---

### Task 6: Final Verification and System Integration Test

- [ ] **Step 1: Execute full project build & type-check**

Run: `npm run build`
Expected: Clean build output.

- [ ] **Step 2: Run linting check**

Run: `npm run lint`
Expected: No errors or unhandled promises.
