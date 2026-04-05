import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api } from "./_generated/api";


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
        stock: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado para crear recompensas en este ramo");

        // Si no se especifica stock, el default es 1 por alumno inscrito actualmente
        let finalStock = args.stock;
        if (finalStock === undefined) {
             const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .collect();
            finalStock = Math.max(enrollments.length, 1); // Al menos 1 si no hay alumnos aún
        }

        const rewardId = await ctx.db.insert("rewards", {
            course_id: args.course_id,
            name: args.name,
            description: args.description,
            cost: args.cost,
            stock: finalStock,
        });

        // Notificar a los alumnos inscritos
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();
        
        for (const en of enrollments) {
            const student = await ctx.db.get(en.user_id);
            if (student?.push_token) {
                await ctx.scheduler.runAfter(0, api.fcm.sendPushNotification, {
                    token: student.push_token,
                    title: `¡Nuevas Recompensas! 🎁`,
                    body: `Se ha agregado "${args.name}" a la tienda de ${course.name}. ¡Canjéala con tus puntos!`,
                });
            }
        }

        return rewardId;
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

        // Notificar al docente del ramo
        const course = await ctx.db.get(reward.course_id);
        if (course) {
            await ctx.db.insert("notifications", {
                user_id: course.teacher_id,
                title: "🎁 Canje pendiente",
                message: `${user.name || "Un alumno"} canjeó "${reward.name}" en ${course.name}. Revisa los canjes pendientes.`,
                type: "reward_redeemed",
                read: false,
                related_id: reward.course_id,
                created_at: Date.now(),
            });
        }

        // Registrar canje
        const rewardName = reward.name.toLowerCase();
        const isIceCube = rewardName.includes("congelar racha");
        const isMultiplierX2 = rewardName.includes("x2");
        const isMultiplierX15 = rewardName.includes("x1.5");
        
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

// Obtener canjes pendientes de un ramo (solo docente)
export const getPendingRedemptions = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            const user = await requireTeacher(ctx);
            const course = await ctx.db.get(args.course_id);
            if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
                return [];

            // Obtener todas las recompensas del ramo
            const rewards = await ctx.db
                .query("rewards")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .collect();
            if (rewards.length === 0) return [];

            const rewardMap = new Map(rewards.map(r => [r._id, r]));

            // Obtener canjes pendientes de esas recompensas
            const redemptionsNested = await Promise.all(
                rewards.map(reward =>
                    ctx.db
                        .query("redemptions")
                        .withIndex("by_reward", (q) => q.eq("reward_id", reward._id))
                        .filter((q) => q.eq(q.field("status"), "pending"))
                        .collect()
                )
            );
            const allRedemptions = redemptionsNested.flat();
            if (allRedemptions.length === 0) return [];

            // Enriquecer con datos del alumno y la recompensa
            return await Promise.all(allRedemptions.map(async (r) => {
                const student = await ctx.db.get(r.user_id) as any;
                const reward = rewardMap.get(r.reward_id);
                return {
                    _id: r._id,
                    timestamp: r.timestamp,
                    status: r.status,
                    student_name: student?.name || "Alumno",
                    student_email: student?.email || "",
                    reward_name: reward?.name || "Recompensa",
                    reward_cost: reward?.cost || 0,
                };
            }));
        } catch {
            return [];
        }
    },
});

// Marcar canje como entregado (solo docente)
export const markRedemptionDelivered = mutation({
    args: { redemption_id: v.id("redemptions") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const redemption = await ctx.db.get(args.redemption_id);
        if (!redemption) throw new Error("Canje no encontrado");

        const reward = await ctx.db.get(redemption.reward_id);
        if (!reward) throw new Error("Recompensa no encontrada");

        const course = await ctx.db.get(reward.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado");

        await ctx.db.patch(args.redemption_id, { status: "completed" });

        // Notificar al alumno que fue entregado
        await ctx.db.insert("notifications", {
            user_id: redemption.user_id,
            title: "🎁 ¡Recompensa entregada!",
            message: `Tu canje de "${reward.name}" ha sido marcado como entregado por el docente.`,
            type: "reward_delivered",
            read: false,
            created_at: Date.now(),
        });
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No autorizado para eliminar esta recompensa");

        await ctx.db.delete(args.reward_id);
    },
});

// Obtener todos los canjes de todos los ramos del docente
export const getTeacherRedemptions = query({
    args: { status: v.optional(v.union(v.literal("pending"), v.literal("completed"))) },
    handler: async (ctx, args) => {
        try {
            const user = await requireTeacher(ctx);
            // Obtener todos los cursos del docente
            const myCourses = await ctx.db
                .query("courses")
                .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
                .collect();
            
            if (myCourses.length === 0) return [];
            const courseIds = myCourses.map(c => c._id);
            const courseMap = new Map(myCourses.map(c => [c._id, c]));

            // Obtener todas las recompensas de esos cursos
            const allRewards = await ctx.db.query("rewards").collect();
            const myRewards = allRewards.filter(r => courseIds.includes(r.course_id));
            if (myRewards.length === 0) return [];
            
            const rewardIds = myRewards.map(r => r._id);
            const rewardMap = new Map(myRewards.map(r => [r._id, r]));

            // Obtener canjes de esas recompensas
            const allRedemptions = await ctx.db.query("redemptions").collect();
            const myRedemptions = allRedemptions.filter(r => rewardIds.includes(r.reward_id));
            
            // Filtrar por status
            const filtered = args.status ? myRedemptions.filter(r => r.status === args.status) : myRedemptions;
            
            // Ordenar por más reciente
            const sorted = filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // Enriquecer
            return await Promise.all(sorted.map(async (r) => {
                const student = await ctx.db.get(r.user_id) as any;
                const reward = rewardMap.get(r.reward_id);
                const course = reward ? courseMap.get(reward.course_id) : null;
                return {
                    _id: r._id,
                    timestamp: r.timestamp,
                    status: r.status,
                    student_name: student?.name || "Alumno",
                    student_email: student?.email || "",
                    reward_name: reward?.name || "Recompensa",
                    reward_cost: reward?.cost || 0,
                    course_name: course?.name || "Ramo desconocido",
                    course_id: course?._id
                };
            }));
        } catch {
            return [];
        }
    }
});

