import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Obtener recompensas de un ramo
export const getRewardsByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("rewards")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.gt(q.field("stock"), 0))
            .collect();
    },
});

// Crear una recompensa (solo docente)
export const createReward = mutation({
    args: {
        course_id: v.id("courses"),
        name: v.string(),
        description: v.string(),
        cost: v.number(),
        stock: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (!user || user.role !== "teacher")
            throw new Error("Solo docentes pueden crear recompensas");

        return await ctx.db.insert("rewards", {
            course_id: args.course_id,
            name: args.name,
            description: args.description,
            cost: args.cost,
            stock: args.stock,
        });
    },
});

// Canjear una recompensa
export const redeemReward = mutation({
    args: { reward_id: v.id("rewards") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const reward = await ctx.db.get(args.reward_id);
        if (!reward || reward.stock <= 0) throw new Error("Recompensa agotada");

        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("course_id"), reward.course_id))
            .unique();

        if (!enrollment || enrollment.total_points < reward.cost) {
            throw new Error("Puntos insuficientes");
        }

        // Atómicamente: Descontar puntos y reducir stock
        await ctx.db.patch(enrollment._id, {
            total_points: enrollment.total_points - reward.cost,
        });

        await ctx.db.patch(reward._id, {
            stock: reward.stock - 1,
        });

        // Registrar canje
        await ctx.db.insert("redemptions", {
            user_id: userId,
            reward_id: reward._id,
            status: "pending",
            timestamp: Date.now(),
        });

        return { success: true };
    },
});
