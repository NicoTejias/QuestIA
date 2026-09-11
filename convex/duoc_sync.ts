import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";

/**
 * Mutación para procesar y sincronizar datos de Duoc UC (cursos, alumnos, evaluaciones)
 * Invocada directamente por el webhook HTTP autenticado con API Key.
 */
export const syncDuocData = internalMutation({
    args: {
        teacherEmail: v.string(),
        courseCode: v.string(),
        courseName: v.string(),
        courseDescription: v.optional(v.string()),
        section: v.optional(v.string()),
        students: v.optional(v.array(v.object({
            identifier: v.string(), // RUT o Correo
            name: v.optional(v.string()),
            section: v.optional(v.string()),
        }))),
        evaluaciones: v.optional(v.array(v.object({
            titulo: v.string(),
            tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
            fecha: v.number(), // Timestamp Unix ms
            hora: v.optional(v.string()),
            puntos: v.optional(v.number()),
            descripcion: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        // 1. Validar o buscar al docente por su correo
        let teacher = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.teacherEmail))
            .first();

        if (!teacher) {
            // Si el docente no existe aún, se registra como docente automáticamente
            const teacherId = await ctx.db.insert("users", {
                email: args.teacherEmail,
                name: args.teacherEmail.split("@")[0],
                role: "teacher",
                is_verified: true,
            });
            teacher = await ctx.db.get(teacherId);
        }

        if (!teacher) {
            throw new Error("No se pudo resolver el usuario docente");
        }

        // 2. Buscar o crear el curso según su código
        let course = await ctx.db
            .query("courses")
            .withIndex("by_code", (q) => q.eq("code", args.courseCode))
            .first();

        if (!course) {
            const newCourseId = await ctx.db.insert("courses", {
                name: args.courseName,
                code: args.courseCode,
                teacher_id: teacher._id,
                description: args.courseDescription || `Ramo ${args.courseName} sincronizado desde Duoc`,
            });
            course = await ctx.db.get(newCourseId);
        } else if (course.teacher_id !== teacher._id) {
            // Actualizar docente si corresponde
            await ctx.db.patch(course._id, { teacher_id: teacher._id });
        }

        if (!course) throw new Error("Error al inicializar el curso");

        // 3. Sincronizar Alumnos a la tabla whitelists
        let studentsAdded = 0;
        let studentsUpdated = 0;

        if (args.students && args.students.length > 0) {
            const existingWhitelist = await ctx.db
                .query("whitelists")
                .withIndex("by_course", (q) => q.eq("course_id", course!._id))
                .collect();

            const existingMap = new Map(
                existingWhitelist.map((w) => [normalizeRut(w.student_identifier), w])
            );

            for (const student of args.students) {
                const normId = normalizeRut(student.identifier);
                if (!normId) continue;

                const studentSection = student.section || args.section;
                const existing = existingMap.get(normId);

                if (existing) {
                    if (
                        (student.name && existing.student_name !== student.name) ||
                        (studentSection && existing.section !== studentSection)
                    ) {
                        await ctx.db.patch(existing._id, {
                            student_name: student.name || existing.student_name,
                            section: studentSection || existing.section,
                        });
                        studentsUpdated++;
                    }
                } else {
                    await ctx.db.insert("whitelists", {
                        course_id: course._id,
                        student_identifier: normId,
                        student_name: student.name,
                        section: studentSection,
                    });
                    studentsAdded++;
                }
            }
        }

        // 4. Sincronizar Evaluaciones si vienen en el payload
        let evaluacionesAdded = 0;
        if (args.evaluaciones && args.evaluaciones.length > 0) {
            const existingEvals = await ctx.db
                .query("evaluaciones")
                .withIndex("by_course", (q) => q.eq("course_id", course!._id))
                .collect();

            for (const ev of args.evaluaciones) {
                const exists = existingEvals.some(
                    (e) => e.titulo.trim().toLowerCase() === ev.titulo.trim().toLowerCase()
                );
                if (!exists) {
                    await ctx.db.insert("evaluaciones", {
                        course_id: course._id,
                        teacher_id: teacher._id,
                        titulo: ev.titulo,
                        tipo: ev.tipo,
                        fecha: ev.fecha,
                        hora: ev.hora,
                        puntos: ev.puntos,
                        descripcion: ev.descripcion,
                        section: args.section,
                        activo: true,
                        created_at: Date.now(),
                    });
                    evaluacionesAdded++;
                }
            }
        }

        return {
            success: true,
            courseId: course._id,
            courseCode: course.code,
            studentsAdded,
            studentsUpdated,
            evaluacionesAdded,
        };
    },
});
