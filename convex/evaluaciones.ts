import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

export const createEvaluacion = mutation({
    args: {
        course_id: v.id("courses"),
        titulo: v.string(),
        tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
        descripcion: v.optional(v.string()),
        fecha: v.number(),
        hora: v.optional(v.string()),
        puntos: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        
        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id) {
            throw new Error("No tienes permiso para agregar evaluaciones a este curso");
        }

        const evaluacionId = await ctx.db.insert("evaluaciones", {
            course_id: args.course_id,
            teacher_id: user._id,
            titulo: args.titulo,
            tipo: args.tipo,
            descripcion: args.descripcion,
            fecha: args.fecha,
            hora: args.hora,
            puntos: args.puntos,
            activo: true,
            created_at: Date.now(),
        });

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
        
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect();

        const courseIds = enrollments.map(e => e.course_id);

        let allEvaluaciones: any[] = [];
        
        for (const courseId of courseIds) {
            const evals = await ctx.db
                .query("evaluaciones")
                .withIndex("by_course", (q) => q.eq("course_id", courseId))
                .filter((q) => q.eq(q.field("activo"), true))
                .collect();
            
            const course = await ctx.db.get(courseId);
            
            allEvaluaciones.push(...evals.map(e => ({
                ...e,
                course_name: course?.name,
                course_code: course?.code,
            })));
        }

        return allEvaluaciones.sort((a, b) => a.fecha - b.fecha);
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
        if (!course || course.teacher_id !== user._id) {
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
        if (!course || course.teacher_id !== user._id) {
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