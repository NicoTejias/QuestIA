# Plan de Implementación: Botones de Rol en Landing Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructurar el área Hero de `LandingPage.tsx` para presentar de forma clara e interactiva los 3 botones/accesos por rol: "Soy Docente", "Soy Alumno" y "Demo Docente".

**Architecture:** Modificar el componente `LandingPage.tsx` de React agregando una sección de selección de rol responsiva en el Hero con iconos descriptivos de `lucide-react`, guardando la intención (`teacher`, `student`, `demo`) en `localStorage` al hacer clic y redirigiendo hacia la autenticación o flujo demo correspondiente.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router.

## Global Constraints

- Respeta el diseño dark mode con estilo neón/glassmorphism de la landing actual (`#08080e`, `bg-primary`, `border-white/10`).
- No alterar las rutas existentes del sistema ni romper los componentes hijo.

---

### Task 1: Actualizar el Hero de `LandingPage.tsx` con el selector de roles de 3 botones

**Files:**
- Modify: `src/pages/LandingPage.tsx:1-250`

**Interfaces:**
- Consumes: `useNavigate`, `Link` desde `react-router-dom`, `GraduationCap`, `UserCheck`, `PlayCircle`, `Sparkles`, `ChevronRight` desde `lucide-react`.
- Produces: Sección Hero restructurada con tarjetas/botones interactivos para Docentes, Alumnos y Demo Docente.

- [ ] **Step 1: Modificar `src/pages/LandingPage.tsx` importando los iconos necesarios**

Agregar `GraduationCap`, `UserCheck`, `PlayCircle` a la lista de iconos importados de `lucide-react`.

- [ ] **Step 2: Restructurar la grilla de botones en el Hero**

Reemplazar la sección actual de botones en el Hero (`<Reveal delay={3}>`) por un contenedor responsivo que muestre las 3 opciones principales:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[900px] mb-14">
    {/* Botón 1: Soy Docente */}
    <Link
        to="/registro"
        onClick={() => localStorage.setItem('questia_demo_intent', 'teacher')}
        className="group relative flex flex-col items-center justify-between p-6 rounded-2xl bg-gradient-to-b from-primary/20 via-primary/10 to-transparent border border-primary/40 hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,214,51,0.25)] hover:-translate-y-1 text-center"
    >
        <div className="w-12 h-12 rounded-xl bg-primary text-[#0a0a0a] flex items-center justify-center mb-4 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
            <h3 className="text-lg font-black text-white mb-1">Soy Docente</h3>
            <p className="text-xs text-[#9090c0] font-medium leading-relaxed mb-4">
                Crea tu asignatura, automatiza quizzes con IA y monitorea el progreso de tus alumnos.
            </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-primary text-[#0a0a0a] text-xs font-extrabold px-4 py-2 rounded-lg group-hover:bg-primary-light transition-colors">
            Crear mi Curso <ChevronRight className="w-3.5 h-3.5" />
        </span>
    </Link>

    {/* Botón 2: Soy Alumno */}
    <Link
        to="/registro"
        onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
        className="group relative flex flex-col items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 text-center"
    >
        <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 border border-white/15 group-hover:scale-110 transition-transform">
            <UserCheck className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
            <h3 className="text-lg font-black text-white mb-1">Soy Alumno</h3>
            <p className="text-xs text-[#9090c0] font-medium leading-relaxed mb-4">
                Ingresa a tus misiones, realiza los quizzes y canjea tus puntos por recompensas.
            </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-white/20 transition-colors border border-white/15">
            Ingresar como Alumno <ChevronRight className="w-3.5 h-3.5" />
        </span>
    </Link>

    {/* Botón 3: Demo Docente */}
    <Link
        to="/login"
        onClick={() => localStorage.setItem('questia_demo_intent', 'demo')}
        className="group relative flex flex-col items-center justify-between p-6 rounded-2xl bg-gradient-to-b from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/30 hover:border-blue-400 transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:-translate-y-1 text-center"
    >
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform">
            <PlayCircle className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
            <div className="inline-block bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                Prueba Rápida
            </div>
            <h3 className="text-lg font-black text-white mb-1">Demo Docente</h3>
            <p className="text-xs text-[#9090c0] font-medium leading-relaxed mb-4">
                Explora un curso listo con datos de prueba sin necesidad de configuración previa.
            </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-blue-500/30 transition-colors border border-blue-500/30">
            Ver Demo Interactiva <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        </span>
    </Link>
</div>
```

- [ ] **Step 3: Ejecutar build y verificar tipos con TypeScript**

Run: `npx tsc --noEmit`
Expected: Sin errores de compilación de TypeScript.

---

### Task 2: Verificación de la aplicación y compilación de Vite

**Files:**
- Test: Build global

- [ ] **Step 1: Ejecutar script de build**

Run: `npm run build`
Expected: `dist` generado exitosamente sin errores de sintaxis ni de Vite.
