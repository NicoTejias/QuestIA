import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";
import { requireAuth, requireTeacher } from "./withUser";
import { paginationOptsValidator } from "convex/server";
import { pushNotification } from "./notifications";

// Crear un nuevo ramo
export const createCourse = mutation({
    args: { name: v.string(), code: v.string(), description: v.string(), career_id: v.optional(v.id("careers")) },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        return await ctx.db.insert("courses", {
            name: args.name,
            code: args.code,
            description: args.description,
            teacher_id: user._id,
            career_id: args.career_id,
        });
    },
});

// Subir lista blanca de alumnos
export const batchUploadWhitelist = mutation({
    args: {
        course_id: v.id("courses"),
        clear_existing: v.optional(v.boolean()),
        sync_mode: v.optional(v.boolean()),  // Modo sincronizar: agrega nuevos, elimina los que no están
        students: v.array(v.object({
            identifier: v.string(),
            name: v.optional(v.string()),
            section: v.optional(v.string())
        }))
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado para este ramo");

        // 1. Limpieza total (modo legacy)
        if (args.clear_existing) {
            const existingEntries = await ctx.db
                .query("whitelists")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .collect();
            for (const ent of existingEntries) {
                await ctx.db.delete(ent._id);
            }
        }

        let added = 0;
        let updated = 0;
        let removed = 0;
        const seen = new Set<string>();

        const currentWhitelist = await ctx.db
            .query("whitelists")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        // Helper: buscar match por cuerpo numérico del RUT
        const findMatch = (numbersOnly: string) => {
            return currentWhitelist.find(w => {
                const dbNumbers = w.student_identifier.replace(/[^\d]/g, '');
                if (!dbNumbers || !numbersOnly) return false;
                return dbNumbers === numbersOnly ||
                    (dbNumbers.length >= 7 && numbersOnly.length >= 7 &&
                        (dbNumbers.includes(numbersOnly) || numbersOnly.includes(dbNumbers)));
            });
        };

        // Set de IDs procesados para detectar eliminados en modo sync
        const processedDbIds = new Set<string>();

        for (const student of args.students) {
            const rawId = student.identifier.trim();
            if (!rawId || rawId.length < 3) continue;

            const normalized = normalizeRut(rawId);
            const numbersOnly = normalized.replace(/[^\d]/g, '');
            if (!normalized || seen.has(normalized)) continue;

            const existing = findMatch(numbersOnly);

            if (existing) {
                await ctx.db.patch(existing._id, {
                    student_identifier: normalized,
                    section: student.section?.trim() || existing.section,
                    student_name: student.name?.trim() || existing.student_name
                });
                updated++;
                processedDbIds.add(existing._id);
            } else {
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

        // 2. Modo sync: eliminar alumnos que ya no están en la lista nueva
        if (args.sync_mode && !args.clear_existing) {
            for (const existing of currentWhitelist) {
                if (!processedDbIds.has(existing._id)) {
                    await ctx.db.delete(existing._id);
                    removed++;
                }
            }
        }

        return { added, updated, removed };
    },
});

// Vincular un Google Sheets a un ramo para sync automático
export const linkGoogleSheets = mutation({
    args: {
        course_id: v.id("courses"),
        sheets_id: v.string(),
        sheets_name: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado");

        await ctx.db.patch(args.course_id, {
            linked_sheets_id: args.sheets_id,
            linked_sheets_name: args.sheets_name,
        });
    },
});

// Desvincular Google Sheets de un ramo
export const unlinkGoogleSheets = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado");

        await ctx.db.patch(args.course_id, {
            linked_sheets_id: undefined,
            linked_sheets_name: undefined,
            last_sheets_sync: undefined,
        });
    },
});

// Actualizar timestamp de último sync de Sheets
export const updateLastSheetsSync = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.course_id, {
            last_sheets_sync: Date.now(),
        });
    },
});

// Query interna: obtener ramos con Sheets vinculado (para cron de sync)
export const getCoursesWithLinkedSheets = internalQuery({
    args: {},
    handler: async (ctx) => {
        const allCourses = await ctx.db.query("courses").collect();
        return allCourses
            .filter(c => c.linked_sheets_id)
            .map(c => ({ _id: c._id, name: c.name, code: c.code, linked_sheets_id: c.linked_sheets_id }));
    },
});

// Borrar toda la whitelist de un ramo
export const deleteCourseWhitelist = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) throw new Error("No autorizado");

        const entries = await ctx.db
            .query("whitelists")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();
        
        for (const ent of entries) {
            await ctx.db.delete(ent._id);
        }
        return { deleted: entries.length };
    }
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) throw new Error("No autorizado");

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

// Mutación global para limpiar TODAS las whitelists del docente actual
export const cleanAllMyWhitelists = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireTeacher(ctx);
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
            .collect();
        
        let totalDeleted = 0;
        let totalFixed = 0;
        let totalProcessed = 0;

        for (const course of courses) {
            const whitelist = await ctx.db
                .query("whitelists")
                .withIndex("by_course", (q) => q.eq("course_id", course._id))
                .collect();

            const seen = new Map();
            for (const item of whitelist) {
                const normalized = normalizeRut(item.student_identifier);
                if (!normalized || normalized.length < 5) {
                    await ctx.db.delete(item._id);
                    totalDeleted++;
                    continue;
                }

                if (seen.has(normalized)) {
                    const originalId = seen.get(normalized);
                    const original = (await ctx.db.get(originalId)) as any;

                    if (item.student_name && (!original?.student_name || original.student_name === "Pendiente de registro")) {
                        await ctx.db.patch(originalId, { student_name: item.student_name });
                    }
                    await ctx.db.delete(item._id);
                    totalDeleted++;
                } else {
                    if (item.student_identifier !== normalized) {
                        await ctx.db.patch(item._id, { student_identifier: normalized });
                        totalFixed++;
                    }
                    seen.set(normalized, item._id);
                }
            }
            totalProcessed += whitelist.length;
        }

        return { totalDeleted, totalFixed, coursesCount: courses.length, totalProcessed };
    }
});

// Mutación global para normalizar todas las whitelists del sistema (mantenimiento)
export const fixAllWhitelists = mutation({
    args: {},
    handler: async (ctx) => {
        const whitelist = await ctx.db.query("whitelists").collect();
        let fixed = 0;

        for (const item of whitelist) {
            const normalized = normalizeRut(item.student_identifier);
            if (normalized && normalized !== item.student_identifier) {
                await ctx.db.patch(item._id, { student_identifier: normalized });
                fixed++;
            }
        }
        return { fixed, total: whitelist.length };
    }
});

// Obtener ramos de un alumno con puntos y ranking
export const getMyCourses = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireAuth(ctx);

            // Si es docente, devolver sus propios ramos (Simulación de alumno)
            if (user.role === "teacher" || user.role === "admin") {
                const teaching = await ctx.db
                    .query("courses")
                    .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
                    .collect();
                
                return teaching.map(c => ({ 
                    ...c, 
                    total_points: 9999, // Puntos infinitos para simulación
                    ranking_points: 9999,
                    rank: 1,
                    is_simulation: true 
                }));
            }

            // Si es alumno, devolver ramos en los que está inscrito
            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .collect();

            const courses = [];
            for (const en of enrollments) {
                const course = await ctx.db.get(en.course_id);
                if (course) {
                    // CALCULAR RANK DEL ALUMNO EN ESTE RAMO
                    const betterStudents = await ctx.db
                        .query("enrollments")
                        .withIndex("by_course", (q) => q.eq("course_id", en.course_id))
                        .filter((q) => q.gt(q.field("ranking_points"), en.ranking_points ?? 0))
                        .collect();
                    
                    courses.push({ 
                        ...course, 
                        total_points: en.total_points,
                        spendable_points: en.spendable_points,
                        ranking_points: en.ranking_points,
                        rank: betterStudents.length + 1
                    });
                }
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
                .first();
        } catch {
            return null;
        }
    },
});

// Obtener alumnos de un ramo (para docentes) incluyendo whitelist
export const getCourseStudents = query({
    args: {
        course_id: v.id("courses"),
        paginationOpts: paginationOptsValidator
    },
    handler: async (ctx, args) => {
        try {
            const caller = await requireAuth(ctx);
            // Solo el docente del ramo o un admin pueden ver la lista de alumnos
            const course = await ctx.db.get(args.course_id);
            if (course && course.teacher_id !== caller._id && caller.role !== "admin") {
                return { page: [], isDone: true, continueCursor: "" };
            }

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

            // Paso A: Buscar usuarios que tengan estos IDs
            const users = await Promise.all(
                identifiers.map(async (id) => {
                    if (!id) return null;
                    const normalized = normalizeRut(id);

                    // 1. Intentar búsqueda por ID normalizado en student_id
                    if (normalized) {
                        const userByNormalized = await ctx.db
                            .query("users")
                            .withIndex("by_student_id", q => q.eq("student_id", normalized))
                            .unique();
                        if (userByNormalized) return userByNormalized;
                    }

                    // 2. Intentar buscar por correo electrónico (exacto)
                    const userByEmail = await ctx.db
                        .query("users")
                        .withIndex("email", q => q.eq("email", id))
                        .unique();
                    if (userByEmail) return userByEmail;

                    // 3. Intentar por el ID literal tal cual viene en la whitelist
                    const userByRaw = await ctx.db
                        .query("users")
                        .withIndex("by_student_id", q => q.eq("student_id", id.toUpperCase()))
                        .unique();
                    if (userByRaw) return userByRaw;

                    // 4. Fallback por cuerpo numérico (sin DV o con prefijos/sufijos extra)
                    const bodyMatch = id.replace(/[^\d]/g, '');
                    if (bodyMatch.length >= 7) {
                        const allUsers = await ctx.db.query("users").collect(); // Fallback pesado pero necesario si el índice exacto falla
                        const matchingBodyUser = allUsers.find(u => {
                             if (!u.student_id) return false;
                             const uBody = u.student_id.replace(/[^\d]/g, '');
                             return uBody === bodyMatch || uBody.includes(bodyMatch) || bodyMatch.includes(uBody);
                        });
                        if (matchingBodyUser) return matchingBodyUser;
                    }

                    // 5. Intentar búsqueda por email con el ID normalizado
                    if (id.includes("@")) {
                        const userByEmailAgain = await ctx.db
                            .query("users")
                            .withIndex("email", q => q.eq("email", id.toLowerCase().trim()))
                            .unique();
                        if (userByEmailAgain) return userByEmailAgain;
                    }

                    return null;
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
                        .first()
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
                        enrollment_id: enDoc._id,
                        name: item.student_name || userDoc.name || "Sin nombre",
                        email: userDoc.email,
                        student_id: userDoc.student_id,
                        spendable_points: enDoc.spendable_points || enDoc.total_points || 0,
                        ranking_points: enDoc.ranking_points || enDoc.total_points || 0,
                        total_points: enDoc.ranking_points || enDoc.total_points || 0,
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

// Actualizar un ramo
export const updateCourse = mutation({
    args: {
        course_id: v.id("courses"),
        name: v.string(),
        code: v.string(),
        description: v.string(),
        career_id: v.optional(v.id("careers")),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado para editar este ramo");

        await ctx.db.patch(args.course_id, {
            name: args.name,
            code: args.code,
            description: args.description,
            career_id: args.career_id,
        });
    },
});

// Eliminar un ramo
export const deleteCourse = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado para eliminar este ramo");

        const enrollments = await ctx.db.query("enrollments").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const e of enrollments) await ctx.db.delete(e._id);

        const missions = await ctx.db.query("missions").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const m of missions) await ctx.db.delete(m._id);

        const rewards = await ctx.db.query("rewards").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const r of rewards) await ctx.db.delete(r._id);

        const whitelists = await ctx.db.query("whitelists").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const w of whitelists) await ctx.db.delete(w._id);

        const documents = await ctx.db.query("course_documents").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const d of documents) await ctx.db.delete(d._id);

        const quizzes = await ctx.db.query("quizzes").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        for (const q of quizzes) await ctx.db.delete(q._id);

        await ctx.db.delete(args.course_id);
    },
});

// Reiniciar todos los puntos de un ramo
export const resetCoursePoints = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No autorizado para reiniciar este ramo");
        }

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

        const missions = await ctx.db.query("missions").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        let missionsReset = 0;
        for (const m of missions) {
            const submissions = await ctx.db.query("mission_submissions").withIndex("by_mission", q => q.eq("mission_id", m._id)).collect();
            for (const sub of submissions) {
                await ctx.db.delete(sub._id);
                missionsReset++;
            }
        }

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

// Dar puntos de participación a un alumno (solo docente)
export const giveParticipationPoints = mutation({
    args: {
        enrollment_id: v.id("enrollments"),
        points: v.number(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const teacher = await requireTeacher(ctx);

        if (args.points <= 0 || args.points > 10000) throw new Error("Puntos inválidos (1-10000)");

        const enrollment = await ctx.db.get(args.enrollment_id);
        if (!enrollment) throw new Error("Inscripción no encontrada");

        const course = await ctx.db.get(enrollment.course_id);
        if (!course || (course.teacher_id !== teacher._id && teacher.role !== "admin"))
            throw new Error("No autorizado");

        await ctx.db.patch(args.enrollment_id, {
            total_points: (enrollment.total_points ?? 0) + args.points,
            spendable_points: (enrollment.spendable_points ?? 0) + args.points,
            ranking_points: (enrollment.ranking_points ?? 0) + args.points,
        });

        // Notificar al alumno (DB + push FCM)
        const reason = args.reason || "Participación en clase";
        await pushNotification(
            ctx,
            enrollment.user_id,
            `⭐ +${args.points} puntos de participación`,
            `${teacher.name || "Tu docente"} te dio ${args.points} pts por: ${reason} en ${course.name}.`,
            "participation_points"
        );

        return { success: true };
    },
});

// Obtener ranking global
export const getGlobalRanking = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);
            const refCourse = await ctx.db.get(args.course_id);
            if (!refCourse) return [];

            const relatedCourses = await ctx.db
                .query("courses")
                .withIndex("by_name", q => q.eq("name", refCourse.name))
                .collect();

            const courseIds = relatedCourses.map(c => c._id);
            const courseMap = new Map();
            relatedCourses.forEach(c => courseMap.set(c._id, c));

            const teachers = await Promise.all(relatedCourses.map(c => ctx.db.get(c.teacher_id)));
            const teacherMap = new Map();
            teachers.forEach(t => { if (t) teacherMap.set(t._id, t.name); });

            const allEnrollments = [];
            for (const cId of courseIds) {
                const ens = await ctx.db
                    .query("enrollments")
                    .withIndex("by_course", q => q.eq("course_id", cId))
                    .collect();
                allEnrollments.push(...ens);
            }

            const allWhitelists = [];
            for (const cId of courseIds) {
                const whs = await ctx.db
                    .query("whitelists")
                    .withIndex("by_course", q => q.eq("course_id", cId))
                    .collect();
                allWhitelists.push(...whs);
            }

            const sectionMap = new Map();
            const nameMap = new Map();
            allWhitelists.forEach(w => {
                const key = `${w.course_id}_${w.student_identifier.toLowerCase().trim()}`;
                if (w.section) {
                    sectionMap.set(key, w.section);
                }
                if (w.student_name) {
                    nameMap.set(key, w.student_name);
                }
            });

            const results = await Promise.all(allEnrollments.map(async (en) => {
                const user = await ctx.db.get(en.user_id);
                const course = courseMap.get(en.course_id);

                let section = en.section;
                let officialName = null;
                
                if (user) {
                    const idEN = (user.student_id || "").toLowerCase().trim();
                    const emailEN = (user.email || "").toLowerCase().trim();
                    
                    const idKey = `${en.course_id}_${idEN}`;
                    const emailKey = `${en.course_id}_${emailEN}`;

                    if (!section) {
                        section = sectionMap.get(idKey) || sectionMap.get(emailKey);
                    }
                    officialName = nameMap.get(idKey) || nameMap.get(emailKey);
                }

                return {
                    _id: en._id,
                    name: officialName || user?.name || "Sin nombre",
                    student_id: user?.student_id,
                    ranking_points: en.ranking_points || en.total_points || 0,
                    section: section || "S/S",
                    courseName: course?.name,
                    teacherName: teacherMap.get(course?.teacher_id) || "Docente"
                };
            }));

            return results.sort((a, b) => b.ranking_points - a.ranking_points).slice(0, 100);
        } catch {
            return [];
        }
    },
});
