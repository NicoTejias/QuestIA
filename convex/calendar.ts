import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

// Obtener todas las clases de un curso ordenadas por fecha
export const getClasesByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        await requireAuth(ctx);

        return await ctx.db
            .query("clases_calendarizadas")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect()
            .then((clases) => clases.sort((a, b) => a.fecha - b.fecha));
    },
});

// Guardar la configuración del horario de un curso
export const saveScheduleConfig = mutation({
    args: {
        course_id: v.id("courses"),
        schedule_config: v.object({
            semestre: v.union(v.literal("2026-1"), v.literal("2026-2")),
            seccion: v.string(),
            regimen: v.union(v.literal("diurno"), v.literal("vespertino")),
            semanas_semestre: v.number(),
            dias_semana: v.array(v.number()),
            bloques_horario: v.array(v.string()),
            fecha_inicio: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para modificar este curso");
        }

        await ctx.db.patch(args.course_id, {
            schedule_config: args.schedule_config,
        });

        return { success: true };
    },
});

// Actualizar campos específicos de una clase calendarizada (notas, materiales, etc.)
export const updateClase = mutation({
    args: {
        clase_id: v.id("clases_calendarizadas"),
        observaciones: v.optional(v.string()),
        materiales_pedidos: v.optional(v.boolean()),
        estado: v.optional(v.union(v.literal("programada"), v.literal("dictada"), v.literal("suspendida"))),
        quiz_id: v.optional(v.id("quizzes")),
        mision_id: v.optional(v.id("missions")),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const clase = await ctx.db.get(args.clase_id);
        if (!clase) throw new Error("Clase no encontrada");

        const course = await ctx.db.get(clase.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para modificar esta clase");
        }

        const patches: Record<string, any> = {};
        if (args.observaciones !== undefined) patches.observaciones = args.observaciones;
        if (args.materiales_pedidos !== undefined) patches.materiales_pedidos = args.materiales_pedidos;
        if (args.estado !== undefined) patches.estado = args.estado;
        if (args.quiz_id !== undefined) patches.quiz_id = args.quiz_id;
        if (args.mision_id !== undefined) patches.mision_id = args.mision_id;

        await ctx.db.patch(args.clase_id, patches);

        return { success: true };
    },
});

// Limpiar todas las clases calendarizadas asociadas a un curso
export const limpiarCalendario = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para modificar este curso");
        }

        const clases = await ctx.db
            .query("clases_calendarizadas")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        for (const clase of clases) {
            await ctx.db.delete(clase._id);
        }

        return { success: true };
    },
});

// Mutación para insertar clases y evaluaciones en lote
export const bulkInsertClases = mutation({
    args: {
        course_id: v.id("courses"),
        clases: v.array(v.object({
            semana: v.number(),
            sesion: v.number(),
            fecha: v.number(),
            titulo: v.string(),
            contenido: v.string(),
            actividades: v.optional(v.string()),
            materiales_requeridos: v.optional(v.string()),
            tiene_evaluacion: v.boolean(),
            tipo_evaluacion: v.optional(v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe"), v.literal("ninguna"))),
            titulo_evaluacion: v.optional(v.string()),
            es_feriado: v.optional(v.boolean()),
            detalle_feriado: v.optional(v.string()),
            estado: v.union(v.literal("programada"), v.literal("dictada"), v.literal("suspendida")),
        })),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para modificar este curso");
        }

        for (const c of args.clases) {
            let evaluacion_id: any = undefined;

            // Si tiene una evaluación válida, la insertamos en la tabla evaluaciones de QuestIA
            if (c.tiene_evaluacion && c.tipo_evaluacion && c.tipo_evaluacion !== "ninguna" && c.titulo_evaluacion) {
                evaluacion_id = await ctx.db.insert("evaluaciones", {
                    course_id: args.course_id,
                    teacher_id: user._id,
                    titulo: c.titulo_evaluacion,
                    tipo: c.tipo_evaluacion as any,
                    descripcion: `Evaluación oficial planificada para la clase: ${c.titulo}`,
                    fecha: c.fecha,
                    activo: true,
                    section: course.schedule_config?.seccion || undefined,
                    created_at: Date.now(),
                });
            }

            // Insertamos la clase calendarizada
            await ctx.db.insert("clases_calendarizadas", {
                course_id: args.course_id,
                semana: c.semana,
                sesion: c.sesion,
                fecha: c.fecha,
                titulo: c.titulo,
                contenido: c.contenido,
                actividades: c.actividades,
                materiales_requeridos: c.materiales_requeridos,
                materiales_pedidos: false,
                tiene_evaluacion: c.tiene_evaluacion,
                evaluacion_id: evaluacion_id,
                es_feriado: c.es_feriado,
                detalle_feriado: c.detalle_feriado,
                estado: c.estado,
            });
        }

        return { success: true };
    },
});
