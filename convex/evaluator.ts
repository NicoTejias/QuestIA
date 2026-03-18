import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { requireTeacher, requireAuth } from "./withUser";
import { api } from "./_generated/api";

// --- Rubrics ---

export const createRubric = mutation({
  args: {
    course_id: v.id("courses"),
    title: v.string(),
    content_text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireTeacher(ctx);
    const course = await ctx.db.get(args.course_id);
    if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
        throw new Error("No tienes permiso para crear rúbricas en este ramo");
    }
    return await ctx.db.insert("grading_rubrics", {
      course_id: args.course_id,
      teacher_id: user._id,
      title: args.title,
      content_text: args.content_text,
      created_at: Date.now(),
    });
  },
});

export const getRubrics = query({
  args: { course_id: v.id("courses") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("grading_rubrics")
      .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
      .order("desc")
      .collect();
  },
});

export const deleteRubric = mutation({
    args: { rubric_id: v.id("grading_rubrics") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const rubric = await ctx.db.get(args.rubric_id);
        if (!rubric || (rubric.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No tienes permiso sobre esta rúbrica");
        }
        
        // También borrar resultados asociados
        const results = await ctx.db.query("grading_results").withIndex("by_rubric", q => q.eq("rubric_id", args.rubric_id)).collect();
        for (const r of results) {
            await ctx.db.delete(r._id);
        }
        await ctx.db.delete(args.rubric_id);
    }
});

// --- Results ---

export const getGradingResults = query({
  args: { rubric_id: v.id("grading_rubrics") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("grading_results")
      .withIndex("by_rubric", (q) => q.eq("rubric_id", args.rubric_id))
      .order("desc")
      .collect();
  },
});

// --- AI Action ---

export const evaluateSubmission = action({
  args: {
    rubric_id: v.id("grading_rubrics"),
    student_name: v.string(),
    file_name: v.string(),
    submission_text: v.string(),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada");

    // Obtener la rúbrica (necesitamos usar runQuery porque estamos en un action)
    const rubric = await ctx.runQuery(api.evaluator.getRubricInternal, { id: args.rubric_id });
    if (!rubric) throw new Error("Rúbrica no encontrada");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const prompt = `
Eres un asistente de evaluación académica de alto nivel. 
Tu tarea es evaluar el trabajo de un estudiante basado en una pauta de evaluación (rúbrica) proporcionada.

PAUTA DE EVALUACIÓN:
"""
${rubric.content_text}
"""

TRABAJO DEL ESTUDIANTE (${args.file_name}):
"""
${args.submission_text}
"""

INSTRUCCIONES:
1. Analiza cuidadosamente el trabajo frente a cada criterio de la pauta.
2. Genera un feedback detallado, constructivo y profesional dirigido al profesor.
3. Sugiere una calificación final. IMPORTANTE: La escala es de 1.0 a 7.0 (donde 4.0 es el mínimo para aprobar). Si la pauta especifica otra escala, adáptate, pero entrega un número final representativo.
4. Formato de respuesta esperado (JSON exacto):
{
  "feedback": "Texto detallado con fortalezas y debilidades...",
  "suggested_score": 5.5
}
Responde SOLO con el objeto JSON, sin formato markdown ni explicaciones externas.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpiar posible formato markdown si la IA lo incluyó
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    try {
        const parsed = JSON.parse(cleanJson);
        
        // Guardar resultado (usando runMutation)
        await ctx.runMutation(api.evaluator.saveGradingResultInternal, {
            rubric_id: args.rubric_id,
            student_name: args.student_name,
            file_name: args.file_name,
            feedback: parsed.feedback,
            score: parsed.suggested_score
        });

        return parsed;
    } catch (e) {
        console.error("Error parseando JSON de Gemini:", responseText);
        throw new Error("La IA no devolvió un formato válido. Intenta de nuevo.");
    }
  },
});

// Auxiliares internos para el action
export const getRubricInternal = query({
    args: { id: v.id("grading_rubrics") },
    handler: async (ctx, args) => await ctx.db.get(args.id)
});

export const saveGradingResultInternal = mutation({
    args: {
        rubric_id: v.id("grading_rubrics"),
        student_name: v.string(),
        file_name: v.string(),
        feedback: v.string(),
        score: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        return await ctx.db.insert("grading_results", {
            ...args,
            teacher_id: user._id,
            created_at: Date.now(),
        });
    }
});
