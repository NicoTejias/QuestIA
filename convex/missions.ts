import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Crear una misión
export const createMission = mutation({
    args: {
        course_id: v.id("courses"),
        title: v.string(),
        description: v.string(),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (!user || user.role !== "teacher")
            throw new Error("Solo docentes pueden crear misiones");

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
        return await ctx.db
            .query("missions")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();
    },
});

// Completar una misión y otorgar puntos
export const completeMission = mutation({
    args: { mission_id: v.id("missions") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const mission = await ctx.db.get(args.mission_id);
        if (!mission) throw new Error("Misión no encontrada");

        // Verificar que no se haya completado ya
        const existing = await ctx.db
            .query("mission_submissions")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("mission_id"), args.mission_id))
            .unique();

        if (existing) throw new Error("Ya completaste esta misión");

        // Registrar la entrega
        await ctx.db.insert("mission_submissions", {
            mission_id: args.mission_id,
            user_id: userId,
            completed_at: Date.now(),
        });

        // Sumar puntos al enrollment
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("course_id"), mission.course_id))
            .unique();

        if (!enrollment) throw new Error("No inscrito en este ramo");

        await ctx.db.patch(enrollment._id, {
            total_points: enrollment.total_points + mission.points,
        });

        return {
            success: true,
            points_earned: mission.points,
            new_total: enrollment.total_points + mission.points,
        };
    },
});

// Leaderboard del ramo
export const getLeaderboard = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        const leaderboard = [];
        for (const en of enrollments) {
            const user = await ctx.db.get(en.user_id);
            if (user) {
                leaderboard.push({
                    userId: user._id,
                    name: user.name || "Anónimo",
                    points: en.total_points,
                    belbin: user.belbin_profile?.role_dominant || "Sin determinar",
                });
            }
        }
        return leaderboard.sort((a, b) => b.points - a.points);
    },
});
