import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { getAuthUserId } from "@convex-dev/auth/server";

// Obtener el perfil del usuario actual autenticado
export const me = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        return await ctx.db.get(userId);
    },
});

// Guardar el perfil Belbin del usuario
export const saveBelbinProfile = mutation({
    args: {
        role_dominant: v.string(),
        category: v.string(),
        scores: v.any(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        await ctx.db.patch(userId, {
            belbin_profile: {
                role_dominant: args.role_dominant,
                category: args.category,
                scores: args.scores,
            },
        });

        return { success: true };
    },
});

// Auto-enrollment: cruza el student_id con las whitelists activas
export const autoEnroll = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (!user || !user.student_id) return { enrolled: 0 };

        const matchingWhitelists = await ctx.db
            .query("whitelists")
            .withIndex("by_identifier", (q) =>
                q.eq("student_identifier", user.student_id!)
            )
            .collect();

        let enrolled = 0;
        for (const item of matchingWhitelists) {
            // Verificar que no exista ya la inscripción
            const existing = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", userId))
                .filter((q) => q.eq(q.field("course_id"), item.course_id))
                .unique();

            if (!existing) {
                await ctx.db.insert("enrollments", {
                    user_id: userId,
                    course_id: item.course_id,
                    total_points: 0,
                });
                enrolled++;
            }
        }

        return { enrolled };
    },
});
