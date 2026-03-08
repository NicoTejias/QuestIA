import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Generar quiz con IA a partir del contenido de un documento
export const generateQuiz = action({
    args: {
        document_id: v.id("course_documents"),
        num_questions: v.number(), // 5, 10, 15
        difficulty: v.string(), // "facil", "medio", "dificil"
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        // Obtener el documento
        const doc = await ctx.runQuery(api.documents.getDocumentById, {
            document_id: args.document_id,
        });

        if (!doc) throw new Error("Documento no encontrado");
        if (!doc.content_text || doc.content_text.length < 50) {
            throw new Error("El documento no tiene suficiente texto para generar un quiz.");
        }

        // Truncar contenido a 15000 chars para el prompt
        const content = doc.content_text.substring(0, 15000);

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API key de Gemini no configurada. Agrega GEMINI_API_KEY en las variables de entorno de Convex.");
        }

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const difficultyMap: Record<string, string> = {
            facil: "fácil (conceptos básicos, definiciones directas)",
            medio: "medio (aplicación de conceptos, relaciones entre ideas)",
            dificil: "difícil (análisis, síntesis, problemas complejos)",
        };

        const prompt = `Eres un generador de quizzes educativos para educación superior en Chile. 
Genera EXACTAMENTE ${args.num_questions} preguntas de opción múltiple basándote en el siguiente contenido académico.

REGLAS:
- Cada pregunta tiene EXACTAMENTE 4 opciones (A, B, C, D)
- Solo UNA opción es correcta
- Las opciones incorrectas deben ser plausibles pero claramente distinguibles
- Nivel de dificultad: ${difficultyMap[args.difficulty] || "medio"}
- Las preguntas deben cubrir diferentes temas del contenido
- Escribe en español chileno formal
- Incluye una breve explicación de por qué la respuesta es correcta

CONTENIDO DEL DOCUMENTO:
${content}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, con esta estructura:
{
  "title": "Quiz: [nombre descriptivo basado en el contenido]",
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct": 0,
      "explanation": "Explicación breve de la respuesta correcta"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parsear el JSON de la respuesta
        let quizData;
        try {
            // Intentar extraer JSON del response (puede venir con backticks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta");
            quizData = JSON.parse(jsonMatch[0]);
        } catch {
            throw new Error("Error al parsear la respuesta de la IA. Intenta de nuevo.");
        }

        // Validar estructura
        if (!quizData.questions || !Array.isArray(quizData.questions)) {
            throw new Error("La IA no generó un quiz válido. Intenta de nuevo.");
        }

        // Guardar el quiz en la BD
        const quizId = await ctx.runMutation(api.quizzes.saveQuiz, {
            course_id: doc.course_id,
            document_id: args.document_id,
            title: quizData.title || `Quiz de ${doc.file_name}`,
            questions: quizData.questions,
            difficulty: args.difficulty,
            num_questions: quizData.questions.length,
        });

        return {
            quizId,
            title: quizData.title,
            numQuestions: quizData.questions.length,
            questions: quizData.questions,
        };
    },
});

// Guardar un quiz generado
export const saveQuiz = mutation({
    args: {
        course_id: v.id("courses"),
        document_id: v.id("course_documents"),
        title: v.string(),
        questions: v.any(),
        difficulty: v.string(),
        num_questions: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        return await ctx.db.insert("quizzes", {
            course_id: args.course_id,
            document_id: args.document_id,
            teacher_id: userId,
            title: args.title,
            questions: args.questions,
            difficulty: args.difficulty,
            num_questions: args.num_questions,
            created_at: Date.now(),
            is_active: true,
        });
    },
});

// Obtener quizzes de un ramo
export const getQuizzesByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quizzes")
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .collect();
    },
});

// Obtener quizzes de un documento específico
export const getQuizzesByDocument = query({
    args: { document_id: v.id("course_documents") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quizzes")
            .filter((q) => q.eq(q.field("document_id"), args.document_id))
            .collect();
    },
});
