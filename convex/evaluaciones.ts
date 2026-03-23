import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api } from "./_generated/api";

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

        // Enviar notificación a los estudiantes del curso
        const allEnrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        // Filtrar por sección si es específica
        const enrollments = args.section 
            ? allEnrollments.filter(e => e.section === args.section)
            : allEnrollments;

        const typeText = args.tipo === "prueba" ? "nueva prueba" : "nuevo trabajo/informe";

        // Formateador de fecha simple y seguro para evitar problemas de locale en el servidor
        const formatDate = (ts: number) => {
            const d = new Date(ts);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };
        
        const fechaFormateada = formatDate(args.fecha);
        
        for (const enrollment of enrollments) {
            try {
                await ctx.db.insert("notifications", {
                    user_id: enrollment.user_id,
                    title: `📚 Nueva evaluación: ${args.titulo}`,
                    message: `${typeText} en ${course.name}${args.section ? ` (Sección ${args.section})` : ''}. Fecha: ${fechaFormateada}`,
                    type: "evaluacion_nueva",
                    related_id: evaluacionId.toString(),
                    read: false,
                    created_at: now,
                });

                // Enviar push notification si tiene token
                const studentUser = await ctx.db.get(enrollment.user_id);
                if (studentUser?.push_token) {
                    await ctx.scheduler.runAfter(0, api.fcm.sendPushNotification, {
                        token: studentUser.push_token,
                        title: `📚 Nueva evaluación: ${args.titulo}`,
                        body: `${typeText} en ${course.name}. Fecha: ${fechaFormateada}`,
                        data: { type: "evaluacion", evaluacion_id: evaluacionId.toString() },
                    });
                }
            } catch (e) {
                console.error(`Error procesando notificación para ${enrollment.user_id}:`, e);
            }
        }

        return evaluacionId;
    },
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

export const sendEvaluationReminders = mutation({
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
                    await ctx.db.insert("notifications", {
                        user_id: enrollment.user_id,
                        title: `📚 Recordatorio: ${typeText} en ${daysText}`,
                        message: `${evaluacion.titulo} - ${course.name} (${course.code}) ${evaluacion.hora ? `a las ${evaluacion.hora}` : ''}`,
                        type: "evaluation_reminder",
                        related_id: evaluacion._id.toString(),
                        read: false,
                        created_at: now,
                    });
                }
            }
        }
    },
});