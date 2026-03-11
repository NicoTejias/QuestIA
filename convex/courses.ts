import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";
import { requireAuth, requireTeacher } from "./withUser";

// Crear un nuevo ramo
export const createCourse = mutation({
    args: { name: v.string(), code: v.string(), description: v.string() },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        return await ctx.db.insert("courses", {
            name: args.name,
            code: args.code,
            description: args.description,
            teacher_id: user._id,
        });
    },
});

// Subir lista blanca de alumnos
export const batchUploadWhitelist = mutation({
    args: {
        course_id: v.id("courses"),
        students: v.array(v.object({
            identifier: v.string(),
            name: v.optional(v.string()),
            section: v.optional(v.string())
        }))
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        // Verificar que el curso pertenezca al docente
        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para este ramo");

        // REMOVED 1. LIMPIEZA TOTAL: Eliminamos el borrado previo para permitir 
        // tener estudiantes de multiples secciones/listas simultaneos.

        let added = 0;
        const seen = new Set(); // Para evitar duplicados dentro del mismo archivo

        for (const student of args.students) {
            const rawId = student.identifier.trim();
            if (!rawId || rawId.length < 3) continue;

            const normalized = normalizeRut(rawId);
            if (!normalized || seen.has(normalized)) continue;

            // Revisar si ya existe este estudiante en la whitelist de ESTE ramo
            const existing = await ctx.db
                .query("whitelists")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .filter((q) => q.eq(q.field("student_identifier"), normalized))
                .unique();

            if (existing) {
                // Si existe, solo actualizamos su sección si viene una nueva
                if (student.section?.trim()) {
                    await ctx.db.patch(existing._id, {
                        section: student.section.trim(),
                        student_name: student.name?.trim() || existing.student_name
                    });
                }
            } else {
                // Si no existe, lo insertamos
                await ctx.db.insert("whitelists", {
                    course_id: args.course_id,
                    student_identifier: normalized,
                    student_name: student.name?.trim() || undefined,
                    section: student.section?.trim() || undefined,
                });
                added++;
            }

            seen.add(normalized);
        }
        return { added };
    },
});

/**
 * Limpia y normaliza la whitelist de un curso específico.
 * Elimina duplicados y asegura que todos tengan dígito verificador.
 */
export const cleanUpWhitelist = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id) throw new Error("No autorizado");

        const whitelist = await ctx.db
            .query("whitelists")
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .collect();

        const seen = new Map();
        let deleted = 0;
        let fixed = 0;

        for (const item of whitelist) {
            const normalized = normalizeRut(item.student_identifier);

            // Si no se puede normalizar o es basura, eliminar
            if (!normalized || normalized.length < 5) {
                await ctx.db.delete(item._id);
                deleted++;
                continue;
            }

            if (seen.has(normalized)) {
                // Duplicado: Actualizar nombre en el original si este tiene nombre
                const originalId = seen.get(normalized);
                const original = await ctx.db.get(originalId);

                // Casting simple para evitar el error de unión de tipos en Convex si no hay esquema estricto en el get
                const originalDoc = original as any;

                if (item.student_name && (!originalDoc?.student_name || originalDoc.student_name === "Pendiente de registro")) {
                    await ctx.db.patch(originalId, { student_name: item.student_name });
                }

                await ctx.db.delete(item._id);
                deleted++;
            } else {
                // No es duplicado, pero si el el ID guardado no era igual al normalizado, lo arreglamos
                if (item.student_identifier !== normalized) {
                    await ctx.db.patch(item._id, { student_identifier: normalized });
                    fixed++;
                }
                seen.set(normalized, item._id);
            }
        }

        return { deleted, fixed, total: whitelist.length };
    }
});

// Obtener ramos de un alumno con puntos
export const getMyCourses = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireAuth(ctx);

            // Si es docente, devolver sus propios ramos
            if (user.role === "teacher") {
                return await ctx.db
                    .query("courses")
                    .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
                    .collect();
            }

            // Si es alumno, devolver ramos en los que está inscrito
            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .collect();

            const courses = [];
            for (const en of enrollments) {
                const course = await ctx.db.get(en.course_id);
                if (course) courses.push({ ...course, total_points: en.total_points });
            }
            return courses;
        } catch {
            return [];
        }
    },
});

// Obtener estado de inscripción de un alumno en un ramo
export const getEnrollmentStatus = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            const user = await requireAuth(ctx);

            return await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .filter((q) => q.eq(q.field("course_id"), args.course_id))
                .unique();
        } catch {
            return null;
        }
    },
});

import { paginationOptsValidator } from "convex/server";

// Obtener alumnos de un ramo (para docentes) incluyendo whitelist
export const getCourseStudents = query({
    args: {
        course_id: v.id("courses"),
        paginationOpts: paginationOptsValidator
    },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);

            // 1. Paginar sobre la Whitelist (nuestra fuente de verdad de quién debería estar en el curso)
            const whitelistPaged = await ctx.db
                .query("whitelists")
                .filter((q) => q.eq(q.field("course_id"), args.course_id))
                .paginate(args.paginationOpts);

            if (whitelistPaged.page.length === 0) {
                return whitelistPaged;
            }

            // 2. Obtener inscripciones correspondientes a estas entradas de la whitelist para estas páginas
            // Mapeamos los identificadores normalizados para buscar inscritos
            const identifiers = whitelistPaged.page.map(w => w.student_identifier.toLowerCase().trim());

            // Para evitar N+1 al buscar enrolamientos, obtenemos todos los enrolamientos del curso
            // Idealmente enrolments tendría un índice por identificador, pero si no, 
            // buscaremos los usuarios primero.
            // En nuestra app, el usuario tiene un student_id.

            // Paso A: Buscar usuarios que tengan estos IDs
            const users = await Promise.all(
                identifiers.map(async (id) => {
                    const normalized = normalizeRut(id);
                    if (!normalized) return null;

                    // 1. Intentar búsqueda por ID normalizado
                    const userByNormalized = await ctx.db
                        .query("users")
                        .withIndex("by_student_id", q => q.eq("student_id", normalized))
                        .unique();

                    if (userByNormalized) return userByNormalized;

                    // 2. Intentar por ID limpio (sin puntos ni guion)
                    const clean = normalized.replace(/[^\dkK]/g, '').toUpperCase();
                    const userByClean = await ctx.db
                        .query("users")
                        .withIndex("by_student_id", q => q.eq("student_id", clean))
                        .unique();

                    if (userByClean) return userByClean;

                    // 3. Si el ID original era limpio, intentar normalizarlo
                    const userByRaw = await ctx.db
                        .query("users")
                        .withIndex("by_student_id", q => q.eq("student_id", id.toUpperCase()))
                        .unique();

                    return userByRaw;
                })
            );

            const idToUserMap = new Map();
            const userIds = [];
            for (let i = 0; i < identifiers.length; i++) {
                const u = users[i];
                if (u) {
                    idToUserMap.set(identifiers[i], u);
                    userIds.push(u._id);
                }
            }

            // Paso B: Obtener enrolamientos para estos usuarios en ESTE curso
            const enrollments = await Promise.all(
                userIds.map(uid =>
                    ctx.db
                        .query("enrollments")
                        .withIndex("by_user", q => q.eq("user_id", uid))
                        .filter(q => q.eq(q.field("course_id"), args.course_id))
                        .unique()
                )
            );

            const userIdToEnrollmentMap = new Map();
            enrollments.forEach(en => {
                if (en) userIdToEnrollmentMap.set(en.user_id, en);
            });

            // 3. Cruzar datos
            const page = whitelistPaged.page.map(item => {
                const iden = item.student_identifier.toLowerCase().trim();
                const userDoc = idToUserMap.get(iden);
                const enDoc = userDoc ? userIdToEnrollmentMap.get(userDoc._id) : null;

                if (userDoc && enDoc) {
                    return {
                        _id: userDoc._id,
                        name: userDoc.name || item.student_name || "Sin nombre",
                        email: userDoc.email,
                        student_id: userDoc.student_id,
                        spendable_points: enDoc.spendable_points || enDoc.total_points || 0,
                        ranking_points: enDoc.ranking_points || enDoc.total_points || 0,
                        total_points: enDoc.spendable_points || enDoc.total_points || 0, // Aliased for legacy
                        belbin: userDoc.belbin_profile?.role_dominant || "Sin determinar",
                        section: enDoc.section || item.section || undefined,
                        daily_streak: userDoc.daily_streak || 0,
                        ice_cubes: userDoc.ice_cubes || 0,
                        status: "registered"
                    };
                } else {
                    return {
                        _id: item._id,
                        name: item.student_name || null,
                        identifier: item.student_identifier,
                        spendable_points: 0,
                        ranking_points: 0,
                        total_points: 0,
                        section: item.section || undefined,
                        status: "pending"
                    };
                }
            });

            return { ...whitelistPaged, page };
        } catch {
            return { page: [], isDone: true, continueCursor: "" };
        }
    },
});

// Obtener detalle de un ramo
export const getCourseById = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        const course = await ctx.db.get(args.courseId);
        if (!course) return null;

        const teacher = await ctx.db.get(course.teacher_id);
        return {
            ...course,
            teacher_name: teacher?.name || "Docente",
        };
    },
});
// Actualizar un ramo (solo docente, con validación de ownership)
export const updateCourse = mutation({
    args: {
        course_id: v.id("courses"),
        name: v.string(),
        code: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para editar este ramo");

        await ctx.db.patch(args.course_id, {
            name: args.name,
            code: args.code,
            description: args.description,
        });
    },
});

// Eliminar un ramo (solo docente, con validación de ownership)
export const deleteCourse = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para eliminar este ramo");

        // ELIMINACIÓN EN CASCADA MANUAL
        // 1. Matricular (enrollments)
        const enrollments = await ctx.db.query("enrollments").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const e of enrollments) await ctx.db.delete(e._id);

        // 2. Misiones
        const missions = await ctx.db.query("missions").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const m of missions) await ctx.db.delete(m._id);

        // 3. Recompensas
        const rewards = await ctx.db.query("rewards").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const r of rewards) await ctx.db.delete(r._id);

        // 4. Whitelist
        const whitelists = await ctx.db.query("whitelists").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const w of whitelists) await ctx.db.delete(w._id);

        // 5. Documentos
        const documents = await ctx.db.query("course_documents").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const d of documents) await ctx.db.delete(d._id);

        // 6. Quizzes
        const quizzes = await ctx.db.query("quizzes").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const q of quizzes) await ctx.db.delete(q._id);

        // Finalmente el ramo
        await ctx.db.delete(args.course_id);
    },
});

// Reiniciar todos los puntos de un ramo (Solo docente)
export const resetCoursePoints = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id) {
            throw new Error("No autorizado para reiniciar este ramo");
        }

        // 1. Resetear puntos en Enrollments
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", q => q.eq("course_id", args.course_id))
            .collect();

        let studentsReset = 0;
        for (const e of enrollments) {
            await ctx.db.patch(e._id, {
                ranking_points: 0,
                spendable_points: 0,
                total_points: 0
            });
            studentsReset++;
        }

        // 2. Borrar las misiones completadas (submissions) de este curso
        // Primero necesitamos los IDs de las misiones de este curso
        const missions = await ctx.db.query("missions").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        let missionsReset = 0;

        for (const m of missions) {
            const submissions = await ctx.db.query("mission_submissions").withIndex("by_mission", q => q.eq("mission_id", m._id)).collect();
            for (const sub of submissions) {
                await ctx.db.delete(sub._id);
                missionsReset++;
            }
        }

        // 3. Borrar los quizzes completados (submissions) de este curso
        const quizzes = await ctx.db.query("quizzes").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        let quizzesReset = 0;

        for (const quiz of quizzes) {
            const submissions = await ctx.db.query("quiz_submissions").withIndex("by_quiz", q => q.eq("quiz_id", quiz._id)).collect();
            for (const sub of submissions) {
                await ctx.db.delete(sub._id);
                quizzesReset++;
            }
        }

        return {
            success: true,
            studentsReset,
            missionsReset,
            quizzesReset
        };
    }
});
