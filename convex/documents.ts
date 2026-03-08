import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generar URL de upload para Convex File Storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        // Verificar que es docente
        const user = await ctx.db.get(userId);
        if (user?.role !== "teacher") throw new Error("Solo docentes pueden subir archivos");

        return await ctx.storage.generateUploadUrl();
    },
});

// Guardar documento con su contenido extraído
export const saveDocument = mutation({
    args: {
        course_id: v.id("courses"),
        file_id: v.id("_storage"),
        file_name: v.string(),
        file_type: v.string(),
        file_size: v.number(),
        content_text: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (user?.role !== "teacher") throw new Error("Solo docentes pueden subir archivos");

        // Verificar que el curso pertenece al docente
        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== userId) {
            throw new Error("No tienes permiso para subir a este ramo");
        }

        // Limitar el content_text a 500KB para no exceder límites
        const maxTextLength = 500_000;
        const trimmedContent = args.content_text.length > maxTextLength
            ? args.content_text.substring(0, maxTextLength) + "\n\n[El documento fue truncado por exceder el límite de texto]"
            : args.content_text;

        return await ctx.db.insert("course_documents", {
            course_id: args.course_id,
            teacher_id: userId,
            file_id: args.file_id,
            file_name: args.file_name,
            file_type: args.file_type,
            file_size: args.file_size,
            content_text: trimmedContent,
            uploaded_at: Date.now(),
        });
    },
});

// Listar documentos de un ramo
export const getDocumentsByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("course_documents")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .order("desc")
            .collect();
    },
});

// Listar todos los documentos del docente (todos los ramos)
export const getMyDocuments = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("course_documents")
            .withIndex("by_teacher", (q) => q.eq("teacher_id", userId))
            .order("desc")
            .collect();
    },
});

// Eliminar documento
export const deleteDocument = mutation({
    args: { document_id: v.id("course_documents") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const doc = await ctx.db.get(args.document_id);
        if (!doc || doc.teacher_id !== userId) {
            throw new Error("No tienes permiso para eliminar este documento");
        }

        // Eliminar archivo del storage
        await ctx.storage.delete(doc.file_id);
        // Eliminar registro
        await ctx.db.delete(args.document_id);
    },
});

// Obtener un documento por ID (usado por el sistema de quizzes)
export const getDocumentById = query({
    args: { document_id: v.id("course_documents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.document_id);
    },
});
