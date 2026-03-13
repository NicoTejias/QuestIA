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
        const rewardName = reward.name.toLowerCase();
        const isIceCube = rewardName.includes("congelar racha");
        const isMultiplierX2 = rewardName.includes("x2");
        const isMultiplierX15 = rewardName.includes("x1.5");
        const isGradeBump = rewardName.includes("subir nota");
        
        await ctx.db.insert("redemptions", {
            user_id: user._id,
            reward_id: reward._id,
            status: (isIceCube || isMultiplierX2 || isMultiplierX15) ? "completed" : "pending",
            timestamp: Date.now(),
        });

        // Aplicar efectos inmediatos
        if (isIceCube) {
            // Lógica de recuperación de racha si falló
            const now = Date.now();
            const lastBonus = user.last_daily_bonus_at || 0;
            const yesterday = now - 1000 * 60 * 60 * 24;
            
            // Si la racha se rompió (el último bono fue hace más de un día), la restauramos
            // Simulamos que el último bono fue ayer para que el próximo quiz continúe la racha
            await ctx.db.patch(user._id, {
                last_daily_bonus_at: yesterday, 
                // No tocamos daily_streak aquí, dejamos el que tenía antes de fallar
            });
        }

        if (isMultiplierX2) {
            await ctx.db.patch(enrollment._id, { active_multiplier: 2 });
        }

        if (isMultiplierX15) {
            await ctx.db.patch(enrollment._id, { active_multiplier: 1.5 });
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

// Inicializar recompensas recomendadas para un ramo (útil para ramos antiguos)
export const initRecommendedRewards = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado");

        const recommendedRewards = [
            { name: "Multiplicador de Puntaje x2", description: "Multiplica x2 los puntos de tu próximo quiz", cost: 100, stock: 999 },
            { name: "Multiplicador de Puntaje x1.5", description: "Multiplica x1.5 los puntos de tu próximo quiz", cost: 50, stock: 999 },
            { name: "Congelar Racha (Recuperación)", description: "Si fallaste ayer, recupera tu racha hoy comprando este item", cost: 10, stock: 999 },
            { name: "Subir Nota (3.7 a 4.0)", description: "Eleva tu nota final de una evaluación de 3.7 a 4.0", cost: 500, stock: 50 }
        ];

        let added = 0;
        for (const r of recommendedRewards) {
            const existing = await ctx.db
                .query("rewards")
                .withIndex("by_course", q => q.eq("course_id", args.course_id))
                .filter(q => q.eq(q.field("name"), r.name))
                .unique();
            
            if (!existing) {
                await ctx.db.insert("rewards", {
                    course_id: args.course_id,
                    ...r
                });
                added++;
            }
        }
        return { added };
    }
});
