import { internalMutation, mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api, internal } from "./_generated/api";
import { pushNotification } from "./notifications";

export const createEvaluacion = mutation({
    args: {
        course_id: v.id("courses"),
        titulo: v.string(),
        tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
        descripcion: v.optional(v.string()),
        fecha: v.number(),
        hora: v.optional(v.string()),
        puntos: v.optional(v.number()),
        section: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para agregar evaluaciones a este curso");
        }

        const now = Date.now();
        const evaluacionId = await ctx.db.insert("evaluaciones", {
            course_id: args.course_id,
            teacher_id: user._id,
            titulo: args.titulo,
            tipo: args.tipo,
            descripcion: args.descripcion,
            fecha: args.fecha,
            hora: args.hora,
            puntos: args.puntos,
            section: args.section,
            activo: true,
            created_at: now,
        });

        // Lanzar proceso de notificaciones en segundo plano para evitar timeouts en la mutación principal
        await ctx.scheduler.runAfter(0, api.evaluaciones.dispatchNotifications, {
            evaluacionId,
            courseId: args.course_id,
            section: args.section,
            titulo: args.titulo,
            tipo: args.tipo,
        });

        return evaluacionId;
    },
});

export const dispatchNotifications = action({
    args: {
        evaluacionId: v.id("evaluaciones"),
        courseId: v.id("courses"),
        section: v.optional(v.string()),
        titulo: v.string(),
        tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
    },
    handler: async (ctx, args) => {
        // Obtenemos los datos del curso (necesario para el mensaje)
        const course = await ctx.runQuery(api.courses.getCourseById, { courseId: args.courseId });
        if (!course) return;

        // 1. Crear las notificaciones en la base de datos para todos los alumnos correspondientes
        // Hacemos esto en una mutación interna
        const studentUserIds = await ctx.runMutation(internal.evaluaciones.internalCreateNotifications, {
            courseId: args.courseId,
            section: args.section,
            titulo: args.titulo,
            tipo: args.tipo,
            evaluacionId: args.evaluacionId,
            courseName: course.name,
        });

        if (!studentUserIds || studentUserIds.length === 0) return;

        // 2. Enviar notificaciones push (esto se hace desde la acción para no bloquear la mutación)
        // Obtenemos los tokens de los alumnos que los tengan
        const typeText = args.tipo === "prueba" ? "nueva prueba" : "nuevo trabajo/informe";
        
        // Formateador de fecha similar al del servidor
        const evaluacion = await ctx.runQuery(api.evaluaciones.getEvaluacionById, { evaluacionId: args.evaluacionId });
        if (!evaluacion) return;

        const formatDate = (ts: number) => {
            const d = new Date(ts);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };
        const fechaFormateada = formatDate(evaluacion.fecha);

        for (const userId of studentUserIds) {
            try {
                // Fetch student token - lo ideal sería traerlos todos juntos pero para push uno a uno está bien en una Action
                const student = await ctx.runQuery(internal.users.getUserById, { userId });
                if (student?.push_token) {
                    await ctx.runAction(api.fcm.sendPushNotification, {
                        token: student.push_token,
                        title: `📚 Nueva evaluación: ${args.titulo}`,
                        body: `${typeText} en ${course.name}. Fecha: ${fechaFormateada}`,
                        data: { type: "evaluacion", evaluacion_id: args.evaluacionId.toString() },
                    });
                }
            } catch (e) {
                console.error(`Error enviando push notification a ${userId}:`, e);
            }
        }
    },
});

export const getEvaluacionById = query({
    args: { evaluacionId: v.id("evaluaciones") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.evaluacionId);
    }
});

export const internalCreateNotifications = internalMutation({
    args: {
        courseId: v.id("courses"),
        section: v.optional(v.string()),
        titulo: v.string(),
        tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
        evaluacionId: v.id("evaluaciones"),
        courseName: v.string(),
    },
    handler: async (ctx, args) => {
        const allEnrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.courseId))
            .collect();

        const enrollments = args.section 
            ? allEnrollments.filter(e => e.section === args.section)
            : allEnrollments;

        const typeText = args.tipo === "prueba" ? "nueva prueba" : "nuevo trabajo/informe";
        const now = Date.now();
        
        const evaluacion = await ctx.db.get(args.evaluacionId);
        if (!evaluacion) return [];

        const formatDate = (ts: number) => {
            const d = new Date(ts);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };
        const fechaFormateada = formatDate(evaluacion.fecha);

        const studentUserIds = [];
        for (const enrollment of enrollments) {
            try {
                await pushNotification(
                    ctx,
                    enrollment.user_id,
                    `📚 Nueva evaluación: ${args.titulo}`,
                    `${typeText} en ${args.courseName}${args.section ? ` (Sección ${args.section})` : ''}. Fecha: ${fechaFormateada}`,
                    "evaluacion_nueva",
                    args.evaluacionId.toString()
                );
                studentUserIds.push(enrollment.user_id);
            } catch (e) {
                console.error(`Error insertando notificación para ${enrollment.user_id}:`, e);
            }
        }
        return studentUserIds;
    }
});

export const getEvaluacionesPorCurso = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        await requireAuth(ctx);
        
        const evaluaciones = await ctx.db
            .query("evaluaciones")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.eq(q.field("activo"), true))
            .collect();

        return evaluaciones.sort((a, b) => a.fecha - b.fecha);
    },
});

export const getEvaluacionesEstudiante = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);
        
        try {
            let courseIds: string[] = [];
            
            if (user.role === "teacher" || user.role === "admin") {
                const myCourses = await ctx.db
                    .query("courses")
                    .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
                    .collect();
                courseIds = myCourses.map(c => c._id);
            } else {
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_user", (q) => q.eq("user_id", user._id))
                    .collect();
                courseIds = enrollments.map(e => e.course_id);
            }

            const allEvaluaciones: any[] = [];
            
            for (const courseId of courseIds) {
                const evals = await ctx.db
                    .query("evaluaciones")
                    .withIndex("by_course", (q) => q.eq("course_id", courseId as any))
                    .filter((q) => q.eq(q.field("activo"), true))
                    .collect();
                
                const course = await ctx.db.get(courseId as any);
                
                allEvaluaciones.push(...evals.map(e => ({
                    ...e,
                    course_name: (course as any)?.name,
                    course_code: (course as any)?.code,
                })));
            }

            return allEvaluaciones.sort((a, b) => a.fecha - b.fecha);
        } catch (error: any) {
            console.error("DEBUG EVAL ERROR", error);
            throw new Error(`Detalle del error en getEvaluacionesEstudiante: ${error.message || error}`);
        }
    },
});

export const updateEvaluacion = mutation({
    args: {
        evaluacion_id: v.id("evaluaciones"),
        titulo: v.optional(v.string()),
        tipo: v.optional(v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe"))),
        descripcion: v.optional(v.string()),
        fecha: v.optional(v.number()),
        hora: v.optional(v.string()),
        puntos: v.optional(v.number()),
        activo: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        
        const evaluacion = await ctx.db.get(args.evaluacion_id);
        if (!evaluacion) {
            throw new Error("Evaluación no encontrada");
        }

        const course = await ctx.db.get(evaluacion.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para modificar esta evaluación");
        }

        const { evaluacion_id, ...updates } = args;
        await ctx.db.patch(args.evaluacion_id, updates);
    },
});

export const deleteEvaluacion = mutation({
    args: { evaluacion_id: v.id("evaluaciones") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        
        const evaluacion = await ctx.db.get(args.evaluacion_id);
        if (!evaluacion) {
            throw new Error("Evaluación no encontrada");
        }

        const course = await ctx.db.get(evaluacion.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para eliminar esta evaluación");
        }

        await ctx.db.patch(args.evaluacion_id, { activo: false });
    },
});

export const sendEvaluationReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const twoDays = 2 * 24 * 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        const allEvaluaciones = await ctx.db
            .query("evaluaciones")
            .withIndex("by_fecha", (q) => q.gte("fecha", now))
            .collect();

        const activeEvaluaciones = allEvaluaciones.filter(e => e.activo);

        for (const evaluacion of activeEvaluaciones) {
            const timeDiff = evaluacion.fecha - now;
            const shouldNotify2Days = timeDiff <= twoDays && timeDiff > oneDay;
            const shouldNotify1Day = timeDiff <= oneDay && timeDiff > 0;

            if (!shouldNotify2Days && !shouldNotify1Day) continue;

            const course = await ctx.db.get(evaluacion.course_id);
            if (!course) continue;

            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_course", (q) => q.eq("course_id", evaluacion.course_id))
                .collect();

            const daysText = shouldNotify2Days ? "2 días" : "1 día";
            const typeText = evaluacion.tipo === "prueba" ? "prueba" : "trabajo/informe";

            for (const enrollment of enrollments) {
                const existingNotifs = await ctx.db
                    .query("notifications")
                    .filter((q) => 
                        q.and(
                            q.eq(q.field("user_id"), enrollment.user_id),
                            q.eq(q.field("type"), "evaluation_reminder"),
                            q.eq(q.field("related_id"), evaluacion._id.toString())
                        )
                    )
                    .collect();

                const alreadyNotified = existingNotifs.some(n => n.message.includes(daysText));
                
                if (!alreadyNotified) {
                    await pushNotification(
                        ctx,
                        enrollment.user_id,
                        `📚 Recordatorio: ${typeText} en ${daysText}`,
                        `${evaluacion.titulo} - ${course.name} (${course.code}) ${evaluacion.hora ? `a las ${evaluacion.hora}` : ''}`,
                        "evaluation_reminder",
                        evaluacion._id.toString()
                    );
                }
            }
        }
    },
});