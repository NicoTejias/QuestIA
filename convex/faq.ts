import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./withUser";

// Obtener todas las preguntas frecuentes
export const getFaqs = query({
    args: {},
    handler: async (ctx) => {
        try {
            return await ctx.db
                .query("faqs")
                .withIndex("by_order", (q) => q)
                .collect();
        } catch (error) {
            console.error("Error in getFaqs query:", error);
            // Devolver array vacío en lugar de romper la app
            return [];
        }
    },
});

// Crear una nueva pregunta frecuente (solo Admin)
export const createFaq = mutation({
    args: {
        question: v.string(),
        answer: v.string(),
        order: v.number(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        return await ctx.db.insert("faqs", {
            question: args.question,
            answer: args.answer,
            order: args.order,
            category: args.category || "general",
            created_at: Date.now(),
        });
    },
});

// Actualizar una pregunta frecuente (solo Admin)
export const updateFaq = mutation({
    args: {
        id: v.id("faqs"),
        question: v.string(),
        answer: v.string(),
        order: v.number(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.id, {
            question: args.question,
            answer: args.answer,
            order: args.order,
            category: args.category,
        });
    },
});

// Eliminar una pregunta frecuente (solo Admin)
export const deleteFaq = mutation({
    args: { id: v.id("faqs") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.delete(args.id);
    },
});
