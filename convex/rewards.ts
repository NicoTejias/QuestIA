import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

import { paginationOptsValidator } from "convex/server";

// Obtener recompensas de un ramo (paginado)
export const getRewardsByCourse = query({
    args: {
        course_id: v.id("courses"),
        paginationOpts: paginationOptsValidator
    },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);
            return await ctx.db
                .query("rewards")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .filter((q) => q.gt(q.field("stock"), 0))
                .paginate(args.paginationOpts);
        } catch {
            return { page: [], isDone: true, continueCursor: "" };
        }
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
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para crear recompensas en este ramo");

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
        const user = await requireAuth(ctx);

        const reward = await ctx.db.get(args.reward_id);
        if (!reward || reward.stock <= 0) throw new Error("Recompensa agotada");

        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), reward.course_id))
            .unique();

        if (!enrollment) throw new Error("No inscrito en este ramo");

        const available = enrollment.spendable_points ?? enrollment.total_points ?? 0;
        if (available < reward.cost) {
            throw new Error("Puntos insuficientes");
        }

        // Atómicamente: Descontar puntos y reducir stock
        await ctx.db.patch(enrollment._id, {
            spendable_points: (enrollment.spendable_points ?? enrollment.total_points ?? 0) - reward.cost,
            total_points: (enrollment.total_points ?? 0) - reward.cost, // Legacy sync
        });

        await ctx.db.patch(reward._id, {
            stock: reward.stock - 1,
        });

        // Registrar canje
        const isIceCube = reward.name.toLowerCase().includes("congelar la racha");
        
        await ctx.db.insert("redemptions", {
            user_id: user._id,
            reward_id: reward._id,
            status: isIceCube ? "completed" : "pending",
            timestamp: Date.now(),
        });

        // Si es un congelador de racha, lo aplicamos directamente al inventario del usuario
        if (isIceCube) {
            const currentCubes = user.ice_cubes || 0;
            await ctx.db.patch(user._id, {
                ice_cubes: currentCubes + 1
            });
        }

        return { success: true };
    },
});

// Actualizar una recompensa (solo docente, con validación de ownership)
export const updateReward = mutation({
    args: {
        reward_id: v.id("rewards"),
        name: v.string(),
        description: v.string(),
        cost: v.number(),
        stock: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const reward = await ctx.db.get(args.reward_id);
        if (!reward) throw new Error("Recompensa no encontrada");

        const course = await ctx.db.get(reward.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para editar esta recompensa");

        await ctx.db.patch(args.reward_id, {
            name: args.name,
            description: args.description,
            cost: args.cost,
            stock: args.stock,
        });
    },
});

// Eliminar una recompensa (solo docente, con validación de ownership)
export const deleteReward = mutation({
    args: { reward_id: v.id("rewards") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const reward = await ctx.db.get(args.reward_id);
        if (!reward) throw new Error("Recompensa no encontrada");

        // Verificar que el curso de la recompensa pertenezca al docente
        const course = await ctx.db.get(reward.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para eliminar esta recompensa");

        await ctx.db.delete(args.reward_id);
    },
});
