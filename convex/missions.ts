import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

// Crear una misión
export const createMission = mutation({
    args: {
        course_id: v.id("courses"),
        title: v.string(),
        description: v.string(),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para crear misiones en este ramo");

        return await ctx.db.insert("missions", {
            course_id: args.course_id,
            title: args.title,
            description: args.description,
            points: args.points,
            status: "active",
        });
    },
});

// Obtener misiones de un ramo
export const getMissions = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);
            return await ctx.db
                .query("missions")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();
        } catch {
            return [];
        }
    },
});

// Completar una misión y otorgar puntos
export const completeMission = mutation({
    args: { mission_id: v.id("missions") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const mission = await ctx.db.get(args.mission_id);
        if (!mission) throw new Error("Misión no encontrada");

        // Verificar que no se haya completado ya
        const existing = await ctx.db
            .query("mission_submissions")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("mission_id"), args.mission_id))
            .unique();

        if (existing) throw new Error("Ya completaste esta misión");

        // Registrar la entrega
        await ctx.db.insert("mission_submissions", {
            mission_id: args.mission_id,
            user_id: user._id,
            completed_at: Date.now(),
        });

        // Sumar puntos al enrollment
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), mission.course_id))
            .unique();

        if (!enrollment) throw new Error("No inscrito en este ramo");

        await ctx.db.patch(enrollment._id, {
            ranking_points: (enrollment.ranking_points ?? enrollment.total_points ?? 0) + mission.points,
            spendable_points: (enrollment.spendable_points ?? enrollment.total_points ?? 0) + mission.points,
            total_points: (enrollment.total_points ?? 0) + mission.points, // Legacy
        });

        return {
            success: true,
            points_earned: mission.points,
            new_total: (enrollment.ranking_points ?? enrollment.total_points ?? 0) + mission.points,
        };
    },
});

import { paginationOptsValidator } from "convex/server";

// Leaderboard del ramo (paginado y ordenado por ranking_points)
export const getLeaderboard = query({
    args: {
        course_id: v.id("courses"),
        paginationOpts: paginationOptsValidator
    },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);

            const enrollmentsPaged = await ctx.db
                .query("enrollments")
                .withIndex("by_ranking", (q) => q.eq("course_id", args.course_id))
                .order("desc")
                .paginate(args.paginationOpts);

            // Let the mapping below handle empty pages
            const userIds = enrollmentsPaged.page.map(e => e.user_id);
            const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
            const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id, u!]));

            const page = enrollmentsPaged.page.map(en => {
                const user = userMap.get(en.user_id);
                return {
                    userId: en.user_id,
                    name: user?.name || "Anónimo",
                    points: en.ranking_points ?? en.total_points ?? 0,
                    belbin: user?.belbin_profile?.role_dominant || "Sin determinar",
                };
            });

            return { ...enrollmentsPaged, page };
        } catch {
            return { page: [], isDone: true, continueCursor: "" };
        }
    },
});

// Actualizar una misión (solo docente, con validación de ownership)
export const updateMission = mutation({
    args: {
        mission_id: v.id("missions"),
        title: v.string(),
        description: v.string(),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const mission = await ctx.db.get(args.mission_id);
        if (!mission) throw new Error("Misión no encontrada");

        const course = await ctx.db.get(mission.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para editar esta misión");

        await ctx.db.patch(args.mission_id, {
            title: args.title,
            description: args.description,
            points: args.points,
        });
    },
});

// Eliminar una misión (solo docente, con validación de ownership)
export const deleteMission = mutation({
    args: { mission_id: v.id("missions") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const mission = await ctx.db.get(args.mission_id);
        if (!mission) throw new Error("Misión no encontrada");

        // Verificar que el curso de la misión pertenezca al docente
        const course = await ctx.db.get(mission.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para eliminar esta misión");

        await ctx.db.delete(args.mission_id);
    },
});
