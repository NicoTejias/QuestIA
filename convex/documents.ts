import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

const ALLOWED_FILE_TYPES = ["pdf", "docx", "pptx", "xlsx"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_TEXT_LENGTH = 500_000; // 500KB de texto

function validateFileType(fileType: string): boolean {
    const normalized = fileType.toLowerCase().replace(".", "");
    return ALLOWED_FILE_TYPES.includes(normalized);
}

function validateFileSize(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= MAX_FILE_SIZE_BYTES;
}

// Generar URL de upload para Convex File Storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) throw new Error("No se detectó identidad de usuario. Por favor relogea.");

            await requireTeacher(ctx);

            return await ctx.storage.generateUploadUrl();
        } catch (err: any) {
            throw new Error(err.message || "Error interno del servidor al generar URL de subida");
        }
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
        is_master_doc: v.optional(v.boolean()),
        master_doc_type: v.optional(v.union(v.literal("PDA"), v.literal("PIA"), v.literal("PA"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Sesión expirada al intentar guardar el archivo.");

        const user = await requireTeacher(ctx);

        // Validar tipo de archivo
        if (!validateFileType(args.file_type)) {
            throw new Error(`Tipo de archivo no permitido. Formatos aceptados: ${ALLOWED_FILE_TYPES.join(", ")}`);
        }

        // Validar tamaño de archivo
        if (!validateFileSize(args.file_size)) {
            throw new Error(`El archivo excede el tamaño máximo permitido de 50MB`);
        }

        // Verificar que el curso pertenece al docente
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso para subir a este ramo");
        }

        // Limitar el content_text para no exceder límites
        const trimmedContent = args.content_text.length > MAX_TEXT_LENGTH
            ? args.content_text.substring(0, MAX_TEXT_LENGTH) + "\n\n[El documento fue truncado por exceder el límite de texto]"
            : args.content_text;

        const docId = await ctx.db.insert("course_documents", {
            course_id: args.course_id,
            teacher_id: user._id,
            file_id: args.file_id,
            file_name: args.file_name,
            file_type: args.file_type,
            file_size: args.file_size,
            content_text: trimmedContent,
            uploaded_at: Date.now(),
            is_master_doc: args.is_master_doc,
            master_doc_type: args.master_doc_type,
        });

        // AUTO-GENERACIÓN DE QUIZ IA (QuestIA Core)
        // Al subir un documento, disparamos la generación automática de un reto de 10 preguntas
        if (!args.is_master_doc) {
            await ctx.scheduler.runAfter(0, api.quizzes.generateQuiz, {
                document_id: docId,
                num_questions: 10,
                difficulty: "medio",
                max_attempts: 3
            });
        }

        return docId;

    },
});

// Listar documentos de un ramo
export const getDocumentsByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (!user) return [];

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
        const user = await requireAuth(ctx);
        if (!user) return [];

        const docs = user.role === "admin"
            ? await ctx.db.query("course_documents").collect()
            : await ctx.db
                .query("course_documents")
                .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
                .collect();
        
        return docs.sort((a, b) => b.uploaded_at - a.uploaded_at);
    },
});

// Eliminar documento
export const deleteDocument = mutation({
    args: { document_id: v.id("course_documents") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const doc = await ctx.db.get(args.document_id);
        if (!doc || (doc.teacher_id !== user._id && user.role !== "admin")) {
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

export const setAsMasterDoc = mutation({
    args: {
        document_id: v.id("course_documents"),
        master_type: v.union(v.literal("PDA"), v.literal("PIA"), v.literal("PA"), v.literal("none")),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const doc = await ctx.db.get(args.document_id);
        
        if (!doc || (doc.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso sobre este documento");
        }

        if (args.master_type === "none") {
            await ctx.db.patch(args.document_id, {
                is_master_doc: false,
                master_doc_type: undefined,
            });
        } else {
            // Desmarcar otros del mismo tipo en el mismo curso (Solo puede haber un PDA oficial, por ejemplo)
            const existing = await ctx.db
                .query("course_documents")
                .withIndex("by_course", q => q.eq("course_id", doc.course_id))
                .filter(q => q.eq(q.field("master_doc_type"), args.master_type))
                .collect();
            
            for (const old of existing) {
                await ctx.db.patch(old._id, { is_master_doc: false, master_doc_type: undefined });
            }

            await ctx.db.patch(args.document_id, {
                is_master_doc: true,
                master_doc_type: args.master_type,
            });
        }
        return { success: true };
    }
});

export const getMasterDocuments = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("course_documents")
            .withIndex("by_course", q => q.eq("course_id", args.course_id))
            .filter(q => q.eq(q.field("is_master_doc"), true))
            .collect();
    }
});
