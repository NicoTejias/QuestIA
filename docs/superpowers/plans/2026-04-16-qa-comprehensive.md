# Plan Integral de Pruebas - QuestIA

**Fecha:** 16 de Abril de 2026  
**Objetivo:** Detectar y corregir errores, pulir experiencia de usuario

---

## Fase 1: Pruebas de Autenticación

### 1.1 Login / Registro
- [ ] Login con Google funciona correctamente
- [ ] Registro de nuevo usuario completa todos los campos
- [ ] Recuperación de contraseña
- [ ] Cerrar sesión
- [ ] Redirección tras login correcto

### 1.2 Roles y Permisos
- [ ] Usuario nuevo sin rol puede completar perfil Belbin
- [ ] Docente puede crear/editar cursos
- [ ] Estudiante puede inscribirse en cursos

---

## Fase 2: Dashboard Estudiante

### 2.1 Panel Principal
- [ ] Dashboard carga sin errores
- [ ] Sidebar muestra opciones correctas según rol
- [ ] Header muestra nombre y puntos actuales

### 2.2 Quizzes
- [ ] Lista de quizzes disponibles carga
- [ ] Jugador de Quiz (todos los tipos):
  - [ ] Multiple Choice
  - [ ] True/False
  - [ ] Fill in Blank
  - [ ] Order Steps
  - [ ] Match Game
  - [ ] Word Search
  - [ ] Memory
- [ ] Envío de respuestas funciona
- [ ] Resultados se guardan correctamente

### 2.3 Misiones
- [ ] Lista de misiones disponibles
- [ ] Progreso de misiones se actualiza
- [ ] Recompensas al completar misión

### 2.4 Recompensas (Tienda)
- [ ] Catálogo de recompensas carga
- [ ] Canje de puntos funciona
- [ ] Saldo de puntos se descuenta

### 2.5 Rankings
- [ ] Ranking por curso
- [ ] Ranking global
- [ ] Nombres correctos (whitelist)

### 2.6 Perfil
- [ ] Completar/test Belbin (56 preguntas)
- [ ] Actualizar datos personales
- [ ] Ver historial de logros

### 2.7 Asistencia
- [ ] Ver asistencia por curso
- [ ] Registrar asistencia con código QR

---

## Fase 3: Dashboard Docente

### 3.1 Gestión de Cursos
- [ ] Crear nuevo curso
- [ ] Editar curso existente
- [ ] Importar alumnos (whitelist/RUT)
- [ ] Eliminar curso

### 3.2 Evaluaciones
- [ ] Crear evaluación
- [ ] Editar evaluación
- [ ] Eliminar evaluación
- [ ] Ver evaluaciones por curso

### 3.3 Quizzes IA
- [ ] Generar quiz desde documento
- [ ] Generar quiz desde descripción
- [ ] Asignar quiz a curso/misión
- [ ] Ver resultados de quizzes

### 3.4 Misiones y Recompensas
- [ ] Crear misión
- [ ] Crear recompensa
- [ ] Gestionar canjes (pendientes/aprobados)
- [ ] Asignar puntos

### 3.5 Material
- [ ] Subir documentos (PDF/DOCX)
- [ ] Eliminar material
- [ ] Ver descargas

### 3.6 Grupos
- [ ] Generar grupos por rol Belbin
- [ ] Editar grupos manualmente

### 3.7 Analíticas
- [ ] Ver estadísticas de estudiantes
- [ ] Ver rendimiento por curso
- [ ] Exportar datos

### 3.8 Asistencia
- [ ] Generar código QR
- [ ] Ver registro de asistencia
- [ ] Cerrar asistencia

### 3.9 Chat
- [ ] Enviar mensajes a estudiantes
- [ ] Recibir respuestas

---

## Fase 4: Sistema de Puntos y Gamificación

- [ ] Puntos se acumulan correctamente
- [ ] Transferencias entre ramos
- [ ] Rachas diarias
- [ ] Badges/Logros se otorgan
- [ ] Ranking se actualiza

---

## Fase 5: Notificaciones

- [ ] Notificaciones Push funcionan
- [ ] Notificaciones en app funcionan
- [ ] Notificaciones de canjes
- [ ] Notificaciones de nuevas misiones

---

## Fase 6: Errores Comunes a Verificar

### 6.1 Errores del Lint (conocidos)
- [ ] **MatchGame.tsx** - Math.random durante render (ERROR - debe corregirse)
- [ ] TeacherTour.tsx - dependency de useEffect

### 6.2 Casos Edge
- [ ] Usuario sin cursos inscritos
- [ ] Quiz sin preguntas
- [ ] Recompensa con stock 0
- [ ] Puntos insuficientes para canje
- [ ] Límite de intentos alcanzado

### 6.3 Errores de Consola
- [ ] Revisar console por errores JS
- [ ] Revisar console por warnings de React

---

## Fase 7: UX/UI

- [ ] Diseño responsive (mobile/desktop)
- [ ] Loading states visibles
- [ ] Mensajes de error claros
- [ ] Tooltips donde diperlukan
- [ ] Navegación intuitiva

---

## Ejecución de Pruebas

### Preparar Entorno
```bash
npm run dev
```

### Ejecutar Lint
```bash
npm run lint
```

### Ejecutar Tests
```bash
npm run test:run
```

---

## Registro de Issues Encontrados

| # | Fecha | Área | Descripción | Estado |
|---|-------|------|-------------|--------|
| 1 | 16/04/2026 | Frontend | MatchGame.tsx - Math.random durante render (ERROR) - Ya usa shuffle determinista | FIXED |
| 2 | 16/04/2026 | Frontend | QuizPlayer/index.tsx - eslint-disable innecesario | FIXED |
| 3 | 16/04/2026 | Frontend | useSupabaseQuery.ts - warnings de useCallback (no críticos) | PENDING |
| 4 | 16/04/2026 | Backend | evaluaciones.ts:258 - bug destructuring evaluacion_id | FIXED (ya estaba en main) |
| 5 | 16/04/2026 | Frontend | TeacherTour.tsx - dependency useEffect (warning) | PENDING |

---

## Avances Completados (Fase 1: Código)

- [x] Ejecutar `npm run lint` - 0 errors, 2 warnings
- [x] Fix MatchGame.tsx - Ya usaba shuffle determinista
- [x] Fix QuizPlayer/index.tsx - Eliminado eslint-disable innecesario
- [x] Explorar código convex - Sin bugs críticos adicionales encontrados
- [x] Documentar en plan

---

**Nota:** Este plan será actualizado a medida que se encuentren nuevos issues.