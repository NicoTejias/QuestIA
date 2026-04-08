# Diseño: Corrección de Nombres de Alumnos y Limpieza de Landing Page

Este documento detalla el plan para asegurar que los nombres de los alumnos en QuestIA coincidan con los cargados por los docentes en las listas blancas (whitelists) y para simplificar las opciones de demo en la página de inicio.

## 1. Landing Page: Eliminación de Demo Alumno

Se eliminará el botón de acceso directo a la "Demo Modo Alumno" desde la página principal para evitar confusiones de los usuarios y problemas de cuentas temporales.

**Archivos afectados:**
- `src/pages/LandingPage.tsx`: Eliminar el componente `Link` que apunta a la demo de alumno.

## 2. Nombres de Alumnos: Fuente de Verdad (Whitelist)

Actualmente, los nombres mostrados en rankings, listas de alumnos y canjes provienen del perfil de Clerk del usuario. Si un usuario tiene un nombre genérico como "alumno", el docente no puede identificarlo. Se cambiará la lógica para priorizar el nombre definido en la `whitelist`.

### Estrategia Técnica
Se implementará una lógica de cruce de datos en las queries de Convex que:
1. Obtiene el identificador del alumno (RUT o Email) desde su perfil de usuario.
2. Busca la entrada correspondiente en la tabla `whitelists` para el curso actual.
3. Si existe y tiene un `student_name`, usa ese nombre en lugar de `user.name`.

### Funciones a modificar en `convex/courses.ts`:
- `getCourseStudents`: Ya tiene parte de esta lógica, se reforzará para que sea consistente.
- `getGlobalRanking`: Se modificará para buscar en la whitelist de los ramos relacionados y obtener el nombre oficial.

### Funciones a modificar en `convex/rewards.ts`:
- `getTeacherRedemptions`: Se actualizará para buscar el nombre en la whitelist del ramo al que pertenece la recompensa canjeada.
- `getPendingRedemptions`: Similar a la anterior, para la vista de canjes pendientes por curso.

## 3. Resolución del Caso Hugo Osorio

Al unificar los nombres con la whitelist, si Hugo Osorio aparecía antes como "Alumno", el docente ahora podrá verlo con su nombre real en el panel de `GestionCanjesPanel.tsx`. 

## 4. Verificación y Pruebas
- Verificar que la Landing Page ya no muestra el botón de Demo Alumno.
- Comprobar en el panel de docente que los alumnos inscritos muestran el nombre de la whitelist.
- Validar que el Ranking (Global y por curso) muestra los nombres oficiales.
- Confirmar que los canjes pendientes y completados muestran el nombre correcto.

---
**Estado:** Pendiente de implementación.
