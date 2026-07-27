# Restructuración de Landing Page con Selector de Roles

## Resumen
Reestructurar la `LandingPage` de QuestIA para que la llamada a la acción principal del Hero sea clara e indique caminos específicos para cada tipo de usuario:
1. **Soy Docente** -> Lleva al registro/login enfocado en docentes (`localStorage.setItem('questia_demo_intent', 'teacher')` y redirige a `/registro` o `/login`).
2. **Soy Alumno** -> Lleva al registro/login enfocado en estudiantes (`localStorage.setItem('questia_demo_intent', 'student')` y redirige a `/registro` o `/login`).
3. **Demo Docente** -> Acceso o prueba rápida con intencionalidad demo docente (`localStorage.setItem('questia_demo_intent', 'demo')` y redirige a `/login`).

## Cambios Propuestos

### 1. `src/pages/LandingPage.tsx`
- Rediseñar el contenedor de botones de acción en la sección `Hero`.
- Reemplazar la llamada única actual por 3 tarjetas/botones principales bien estructurados y destacados:
  - **Tarjeta/Botón 1: Soy Docente**
    - Botón primario (`bg-primary`).
    - Icono: `GraduationCap` / `Sparkles`.
    - Texto secundario: "Crea tu curso y evalúa con IA".
  - **Tarjeta/Botón 2: Soy Alumno**
    - Botón secundario con borde sutil o estilo cristal.
    - Icono: `UserCheck` / `Trophy`.
    - Texto secundario: "Únete a tu clase y gana puntos".
  - **Tarjeta/Botón 3: Demo Docente**
    - Botón terciario / enlace rápido con badge "Probador rápido".
    - Icono: `PlayCircle` / `Sparkles`.
    - Texto secundario: "Explora la plataforma sin configuración".
- Ajustar también el menú superior (Navbar) si es necesario para mantener coherencia.

## Plan de Verificación
- Verificar visualmente la renderización de la página con los 3 botones en la landing.
- Verificar que los clics guíen a las rutas/intenciones correctas.
- Ejecutar `npm run build` para asegurar la compilación limpia en TypeScript/Vite.
