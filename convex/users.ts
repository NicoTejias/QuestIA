import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";
import { requireAuth } from "./withUser";

// Obtener el perfil del usuario actual autenticado
export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireAuth(ctx);
            return user;
        } catch {
            return null;
        }
    },
});

export const saveBelbinProfile = mutation({
    args: {
        role_dominant: v.string(),
        category: v.string(),
        scores: v.object({
            Cerebro: v.optional(v.number()),
            Evaluador: v.optional(v.number()),
            Especialista: v.optional(v.number()),
            Impulsor: v.optional(v.number()),
            Implementador: v.optional(v.number()),
            Finalizador: v.optional(v.number()),
            Coordinador: v.optional(v.number()),
            Investigador: v.optional(v.number()),
            Cohesionador: v.optional(v.number())
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        await ctx.db.patch(user._id, {
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
// Normaliza el RUT del alumno antes de comparar para evitar problemas de formato
export const autoEnroll = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);
        if (!user || !user.student_id) return { enrolled: 0 };

        // Normalizar el RUT del alumno para que matchee con la whitelist
        const normalizedId = normalizeRut(user.student_id);
        const rawId = user.student_id.trim();

        // Buscar por RUT normalizado Y por RUT sin normalizar (para backwards compatibility)
        const byNormalized = normalizedId
            ? await ctx.db
                .query("whitelists")
                .withIndex("by_identifier", (q) =>
                    q.eq("student_identifier", normalizedId)
                )
                .collect()
            : [];

        const byRaw = await ctx.db
            .query("whitelists")
            .withIndex("by_identifier", (q) =>
                q.eq("student_identifier", rawId)
            )
            .collect();

        // Combinar sin duplicados
        const seen = new Set<string>();
        const matchingWhitelists = [];
        for (const item of [...byNormalized, ...byRaw]) {
            if (!seen.has(item._id)) {
                seen.add(item._id);
                matchingWhitelists.push(item);
            }
        }

        let enrolled = 0;
        for (const item of matchingWhitelists) {
            // Verificar que no exista ya la inscripción
            const existing = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .filter((q) => q.eq(q.field("course_id"), item.course_id))
                .unique();

            if (!existing) {
                await ctx.db.insert("enrollments", {
                    user_id: user._id,
                    course_id: item.course_id,
                    ranking_points: 0,
                    spendable_points: 0,
                    total_points: 0, // Legacy compatibility
                });
                enrolled++;
            }
        }

        return { enrolled };
    },
});
