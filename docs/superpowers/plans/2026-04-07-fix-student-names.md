# Plan de Implementación: Corrección de Nombres de Alumnos y Limpieza de Landing Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el acceso a la demo de alumno desde la landing page y asegurar que los nombres de los alumnos en rankings, listas y canjes provengan de la whitelist cargada por el docente.

**Architecture:** Se modificará el frontend para remover el botón de demo y se actualizarán las funciones backend en Convex para que prioricen el nombre del alumno en la tabla `whitelists` mediante un cruce de datos basado en el identificador (RUT/Email).

**Tech Stack:** React, Tailwind CSS, Convex.

---

### Task 1: Limpieza de Landing Page

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Eliminar el botón de Demo Modo Alumno**

```tsx
// src/pages/LandingPage.tsx
// Buscar y eliminar el siguiente bloque (alrededor de la línea 138-146):
-                        <Link
-                            to="/registro"
-                            onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
-                            className="w-full sm:w-auto group bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-lg border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
-                        >
-                            <span className="p-1 px-2.5 bg-primary/20 text-primary-light rounded-lg text-sm">Demo</span>
-                            Modo Alumno
-                            <User className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
-                        </Link>
```

- [ ] **Step 2: Verificar que el botón ya no aparece**

- [ ] **Step 3: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "ui: remove student demo button from landing page"
```

### Task 2: Nombres Oficiales en Lista de Alumnos

**Files:**
- Modify: `convex/courses.ts`

- [ ] **Step 1: Actualizar `getCourseStudents` para priorizar el nombre de la whitelist**

En `convex/courses.ts`, dentro de `getCourseStudents`, modificar la lógica de cruce de datos (alrededor de la línea 450).

```typescript
// En el mapeo final de la página:
name: item.student_name || userDoc.name || "Sin nombre",
```
*Nota: `item` es el registro de la whitelist.*

- [ ] **Step 2: Commit**

```bash
git add convex/courses.ts
git commit -m "feat: prioritize whitelist names in course student list"
```

### Task 3: Nombres Oficiales en Ranking Global

**Files:**
- Modify: `convex/courses.ts`

- [ ] **Step 1: Actualizar `getGlobalRanking` para usar nombres de la whitelist**

Modificar `getGlobalRanking` en `convex/courses.ts` para que cargue las whitelists de los cursos relacionados y asigne el nombre correcto.

```typescript
// convex/courses.ts
// Dentro de getGlobalRanking:
// 1. Ya se cargan las whitelists en allWhitelists.
// 2. Crear un mapa de identificador -> nombre a partir de allWhitelists.
const nameMap = new Map();
allWhitelists.forEach(w => {
    if (w.student_name) {
        nameMap.set(`${w.course_id}_${w.student_identifier.toLowerCase().trim()}`, w.student_name);
    }
});

// 3. En el mapeo de resultados (línea 710 aprox):
const idEN = (user.student_id || "").toLowerCase().trim();
const emailEN = (user.email || "").toLowerCase().trim();
const officialName = nameMap.get(`${en.course_id}_${idEN}`) || nameMap.get(`${en.course_id}_${emailEN}`);

return {
    _id: en._id,
    name: officialName || user?.name || "Sin nombre",
    // ...
};
```

- [ ] **Step 2: Commit**

```bash
git add convex/courses.ts
git commit -m "feat: prioritize whitelist names in global ranking"
```

### Task 4: Nombres Oficiales en Panel de Canjes

**Files:**
- Modify: `convex/rewards.ts`

- [ ] **Step 1: Actualizar `getTeacherRedemptions` para usar nombres de la whitelist**

En `convex/rewards.ts`, dentro de `getTeacherRedemptions`, cargar la whitelist del ramo correspondiente para cada canje y obtener el nombre.

```typescript
// convex/rewards.ts
// Dentro de getTeacherRedemptions:
// 1. Después de obtener los alumnos (línea 357 aprox):
const redemptionsWithNames = await Promise.all(sorted.map(async (r) => {
    const student = studentMap.get(r.user_id) as any;
    const reward = rewardMap.get(r.reward_id);
    const course = reward ? courseMap.get(reward.course_id) : null;
    
    let whitelistName = null;
    if (course && student) {
        const iden = (student.student_id || student.email || "").toLowerCase().trim();
        const wlEntry = await ctx.db
            .query("whitelists")
            .withIndex("by_course", q => q.eq("course_id", course._id))
            .collect(); // Podría optimizarse cargando todas las whitelists antes si son muchos canjes
        
        const match = wlEntry.find(w => w.student_identifier.toLowerCase().trim() === iden);
        whitelistName = match?.student_name;
    }

    return {
        // ...
        student_name: whitelistName || student?.name || "Alumno",
        // ...
    };
}));

return redemptionsWithNames;
```

*Nota: Para mejor performance, cargar las whitelists de todos los cursos del docente al inicio del handler.*

- [ ] **Step 2: Commit**

```bash
git add convex/rewards.ts
git commit -m "feat: prioritize whitelist names in teacher redemptions panel"
```

### Task 5: Optimización y Verificación Final

**Files:**
- Modify: `convex/rewards.ts` (Refactor opcional para performance)
- Modify: `convex/courses.ts` (Refactor opcional para concordancia)

- [ ] **Step 1: Asegurar que `getPendingRedemptions` también use nombres de la whitelist**

- [ ] **Step 2: Verificar funcionamiento global**
    *   Revisar Ranking Docente.
    *   Revisar Gestión de Canjes.
    *   Revisar Lista de Alumnos en Curso.

- [ ] **Step 3: Commit**

```bash
git add convex/rewards.ts convex/courses.ts
git commit -m "chore: final polish on student name prioritization"
```
