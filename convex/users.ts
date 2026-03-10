import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";
import { requireAuth } from "./withUser";
import { getAuthUserId } from "@convex-dev/auth/server";

// Obtener el perfil del usuario actual autenticado
export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        try {
            const userId = await getAuthUserId(ctx);
            if (!userId) return null;
            return await ctx.db.get(userId);
        } catch (e) {
            console.error("Error in getProfile:", e);
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

export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        student_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const patch: any = {};
        if (args.name !== undefined) patch.name = args.name;

        if (args.student_id !== undefined) {
            // Normalizar si es alumno
            patch.student_id = (user.role === "student")
                ? normalizeRut(args.student_id)
                : args.student_id;
        }

        if (Object.keys(patch).length > 0) {
            await ctx.db.patch(user._id, patch);
        }
        return { success: true };
    },
});

// Mutación de utilidad para corregir IDs no normalizados y sincronizar inscripciones
export const fixAllStudentIds = mutation({
    args: {},
    handler: async (ctx) => {
        // Obtenemos todos los usuarios y whitelists
        const users = await ctx.db.query("users").collect();
        const whitelists = await ctx.db.query("whitelists").collect();

        let fixed = 0;
        let enrolled = 0;

        for (const u of users) {
            // Solo normalizamos e inscribimos si es alumno y tiene ID
            if (u.role === "student" && u.student_id) {
                let currentId = u.student_id;
                const normalized = normalizeRut(u.student_id);

                // 1. Corregir formato del ID
                if (normalized && normalized !== u.student_id) {
                    await ctx.db.patch(u._id, { student_id: normalized });
                    currentId = normalized;
                    fixed++;
                }

                // 2. Sincronizar con Whitelist
                const cleanId = currentId.replace(/[^\dkK]/g, '').toUpperCase();

                for (const w of whitelists) {
                    const wNormalized = w.student_identifier ? normalizeRut(w.student_identifier) : null;
                    const wClean = w.student_identifier ? w.student_identifier.replace(/[^\dkK]/g, '').toUpperCase() : "";

                    if (
                        (wNormalized && wNormalized === currentId) ||
                        (wClean && wClean === cleanId) ||
                        (w.student_identifier === currentId)
                    ) {
                        // Coinciden los IDs. Verificar si ya existe inscripción (enrollment)
                        const existing = await ctx.db
                            .query("enrollments")
                            .withIndex("by_user", (q) => q.eq("user_id", u._id))
                            .filter((q) => q.eq(q.field("course_id"), w.course_id))
                            .unique();

                        if (!existing) {
                            await ctx.db.insert("enrollments", {
                                user_id: u._id,
                                course_id: w.course_id,
                                ranking_points: 0,
                                spendable_points: 0,
                                total_points: 0,
                            });
                            enrolled++;
                        }
                    }
                }
            }
        }
        return { fixed, enrolled };
    }
});


