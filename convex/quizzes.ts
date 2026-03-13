import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api } from "./_generated/api";

// Generar quiz con IA a partir del contenido de un documento
export const generateQuiz = action({
    args: {
        document_id: v.id("course_documents"),
        num_questions: v.number(), // 5, 10, 15
        difficulty: v.string(), // "facil", "medio", "dificil"
        quiz_type: v.optional(v.string()), // "multiple_choice", "flashcard", "match"
        max_attempts: v.optional(v.number()),
    },
    handler: async (ctx: any, args: any) => {
        // action auth not supported with requireAuth context yet, leaving it as it was if possible:
        const userId = await ctx.auth.getUserIdentity();
        if (!userId) throw new Error("No autenticado");

        // Obtener el documento
        const doc: any = await ctx.runQuery(api.documents.getDocumentById, {
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
        // Usando Gemini 3 Flash según disponibilidad de la clave proveída
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const difficultyMap: Record<string, string> = {
            facil: "fácil (conceptos básicos, definiciones directas)",
            medio: "medio (aplicación de conceptos, relaciones entre ideas)",
            dificil: "difícil (análisis, síntesis, problemas complejos)",
        };

        const type = args.quiz_type || "multiple_choice";
        let prompt = "";

        if (type === "multiple_choice") {
            prompt = `Eres un generador de quizzes educativos para educación superior en Chile. 
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
        } else if (type === "flashcard" || type === "match") {
            const isMatch = type === "match";
            prompt = `Eres un generador de material educativo para educación superior en Chile. 
Extrae EXACTAMENTE ${args.num_questions} pares de conceptos y sus definiciones desde el siguiente contenido académico.
Esto se usará para un juego de ${isMatch ? 'relacionar columnas (Match)' : 'tarjetas de memoria (Flashcards)'}.

REGLAS:
- El concepto de frente ("front") debe ser corto (1 a 4 palabras).
- La definición ("back") debe ser concisa y clara, fácil de leer.
- Nivel de profundidad: ${difficultyMap[args.difficulty] || "medio"}
- Escribe en español.

CONTENIDO DEL DOCUMENTO:
${content}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, con esta estructura:
{
  "title": "${isMatch ? 'Relacionar Conceptos' : 'Flashcards'}: [nombre temático]",
  "questions": [
    {
      "front": "Nombre del Concepto Clave",
      "back": "Definición corta y precisa del concepto"
    }
  ]
}`;
        }

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
        const quizId: any = await ctx.runMutation(api.quizzes.saveQuiz, {
            course_id: doc.course_id,
            document_id: args.document_id,
            title: quizData.title || `Quiz de ${doc.file_name}`,
            quiz_type: type,
            questions: quizData.questions,
            difficulty: args.difficulty,
            num_questions: quizData.questions.length,
            max_attempts: args.max_attempts ?? 1,
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
        quiz_type: v.optional(v.string()),
        questions: v.array(v.union(
            v.object({
                question: v.string(),
                options: v.array(v.string()),
                correct: v.number(),
                explanation: v.optional(v.string())
            }),
            v.object({
                front: v.string(),
                back: v.string()
            }),
            v.object({
                concept: v.string(),
                definition: v.string()
            })
        )),
        difficulty: v.string(),
        num_questions: v.number(),
        max_attempts: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No tienes permiso para agregar quizzes a este curso");

        return await ctx.db.insert("quizzes", {
            course_id: args.course_id,
            document_id: args.document_id,
            teacher_id: user._id,
            title: args.title,
            quiz_type: args.quiz_type || "multiple_choice",
            questions: args.questions,
            difficulty: args.difficulty,
            num_questions: args.num_questions,
            created_at: Date.now(),
            is_active: true,
            max_attempts: args.max_attempts ?? 1,
        });
    },
});

// Obtener quizzes de un ramo con estado de completación
export const getQuizzesByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const quizzes = await ctx.db
            .query("quizzes")
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .collect();

        try {
            const user = await requireAuth(ctx);
            return await Promise.all(quizzes.map(async (quiz) => {
                const userSubmissions = await ctx.db
                    .query("quiz_submissions")
                    .withIndex("by_quiz_user", (q) => q.eq("quiz_id", quiz._id).eq("user_id", user._id))
                    .collect();

                const attempts_count = userSubmissions.length;
                const max_attempts = quiz.max_attempts ?? 1;
                const best_score = userSubmissions.length > 0
                    ? Math.max(...userSubmissions.map(s => s.score))
                    : null;

                return {
                    ...quiz,
                    completed: attempts_count > 0,
                    attempts_count,
                    max_attempts,
                    best_score,
                    can_take: attempts_count < max_attempts,
                    score: best_score // Para compatibilidad
                };
            }));
        } catch {
            return quizzes;
        }
    },
});

// Obtener quizzes de un documento específico
export const getQuizzesByDocument = query({
    args: { document_id: v.id("course_documents") },
    handler: async (ctx, args) => {
        const quizzes = await ctx.db
            .query("quizzes")
            .filter((q) => q.eq(q.field("document_id"), args.document_id))
            .collect();

        try {
            const user = await requireAuth(ctx);
            return await Promise.all(quizzes.map(async (quiz) => {
                const submission = await ctx.db
                    .query("quiz_submissions")
                    .withIndex("by_quiz_user", (q) => q.eq("quiz_id", quiz._id).eq("user_id", user._id))
                    .unique();
                return {
                    ...quiz,
                    completed: !!submission,
                    score: submission?.score
                };
            }));
        } catch {
            return quizzes;
        }
    },
});

// Eliminar un quiz
export const deleteQuiz = mutation({
    args: { quiz_id: v.id("quizzes") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        // Verificar que el curso del quiz pertenezca al docente
        const course = await ctx.db.get(quiz.course_id);
        if (!course || course.teacher_id !== user._id)
            throw new Error("No autorizado para eliminar este quiz");

        await ctx.db.delete(args.quiz_id);
    },
});

// Obtener todos los intentos de un quiz (para el docente)
export const getQuizSubmissions = query({
    args: { quiz_id: v.id("quizzes") },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        // Solo el docente del curso puede ver esto
        const course = await ctx.db.get(quiz.course_id);
        if (!course || course.teacher_id !== user._id) {
            throw new Error("No autorizado");
        }

        const submissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz", (q) => q.eq("quiz_id", args.quiz_id))
            .collect();

        // Enriquecer con nombres de alumnos
        const userIds = new Set(submissions.map(s => s.user_id));
        const users = await Promise.all(Array.from(userIds).map(id => ctx.db.get(id)));
        const userMap = new Map(users.filter(u => u !== null).map(u => [u._id, u]));

        return submissions.map((s) => {
            const user = userMap.get(s.user_id);
            return {
                ...s,
                student_name: user?.name || "Alumno desconocido",
            };
        });
    },
});

// Obtener el intento de un usuario para un quiz específico
export const getUserQuizAttempt = query({
    args: { quiz_id: v.id("quizzes") },
    handler: async (ctx, args) => {
        try {
            const user = await requireAuth(ctx);
            return await ctx.db
                .query("quiz_submissions")
                .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
                .unique();
        } catch {
            return null;
        }
    },
});

// Registrar finalización de un quiz y otorgar puntos
export const submitQuiz = mutation({
    args: {
        quiz_id: v.id("quizzes"),
        score: v.number(), // Puntuación de 0 a 100
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        // Obtener historial de intentos
        const submissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const currentAttempts = submissions.length;
        const maxAttempts = quiz.max_attempts ?? 1;

        if (currentAttempts >= maxAttempts) {
            throw new Error(`Has alcanzado el límite de ${maxAttempts} intentos permitido para este quiz.`);
        }

        // --- Lógica de Bono Diario por Racha ---
        const now = Date.now();
        const lastBonus = user.last_daily_bonus_at || 0;
        const currentStreak = user.daily_streak || 0;
        const currentIceCubes = user.ice_cubes || 0;

        // Validar rachas usando la zona horaria chilena
        const todayDateStr = new Date(now).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
        const lastBonusDateStr = lastBonus ? new Date(lastBonus).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) : "";
        const yesterdayDateStr = new Date(now - 1000 * 60 * 60 * 24).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

        let dailyBonus = 0;
        let newStreak = currentStreak;
        let usedFreeze = false;

        if (lastBonusDateStr !== todayDateStr) {
            if (lastBonusDateStr === yesterdayDateStr || lastBonus === 0) {
                // Continúa la racha o es la primera vez
                newStreak += 1;
            } else {
                // Se rompió la racha cronológicamente. 
                // ¿Tiene hielos para salvarla?
                if (currentIceCubes > 0) {
                    newStreak += 1; // Mantenemos la racha
                    usedFreeze = true;
                } else {
                    newStreak = 1; // Reinicia
                }
            }
            
            // 5pts por día de racha, tope de 50pts máximos diarios
            dailyBonus = Math.min(newStreak * 5, 50);
            
            await ctx.db.patch(user._id, { 
                last_daily_bonus_at: now,
                daily_streak: newStreak,
                ice_cubes: usedFreeze ? currentIceCubes - 1 : currentIceCubes
            });
        }
        // ----------------------------------------

        // Cálculo de puntos base según dificultad y número de preguntas.
        const basePoints = (quiz.num_questions || 5) * (quiz.difficulty === 'dificil' ? 20 : quiz.difficulty === 'medio' ? 15 : 10);
        const currentEarnedPoints = Math.round((args.score / 100) * basePoints);

        // Puntos previamente ganados (el mejor intento)
        const bestPreviousPoints = submissions.length > 0
            ? Math.max(...submissions.map(s => s.earned_points))
            : 0;

        // Solo otorgamos la diferencia si el nuevo intento es mejor
        // El bono diario se suma siempre si aplica, independiente de si el score mejora
        const pointsToAward = Math.max(0, currentEarnedPoints - bestPreviousPoints) + dailyBonus;

        // Buscar inscripcion
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), quiz.course_id))
            .unique();

        if (!enrollment) throw new Error("No inscrito");
        
        // Multiplicador activo (recompensa)
        const multiplier = enrollment.active_multiplier || 1;

        // Registrar el intento
        await ctx.db.insert("quiz_submissions", {
            quiz_id: args.quiz_id,
            user_id: user._id,
            score: args.score,
            earned_points: Math.round(currentEarnedPoints * multiplier),
            completed_at: Date.now(),
        });

        if (pointsToAward > 0) {
            const finalPointsToAward = Math.round(pointsToAward * multiplier);
            const newRankingPoints = (enrollment.ranking_points ?? enrollment.total_points ?? 0) + finalPointsToAward;
            const newSpendablePoints = (enrollment.spendable_points ?? enrollment.total_points ?? 0) + finalPointsToAward;

            await ctx.db.patch(enrollment._id, {
                ranking_points: newRankingPoints,
                spendable_points: newSpendablePoints,
                total_points: (enrollment.total_points ?? 0) + finalPointsToAward,
                active_multiplier: undefined, // Consumir el multiplicador
            });

            return {
                success: true,
                earned: finalPointsToAward,
                is_improvement: pointsToAward > dailyBonus,
                total_earned_now: Math.round(currentEarnedPoints * multiplier),
                new_rank: newRankingPoints,
                new_spendable: newSpendablePoints,
                daily_bonus_applied: dailyBonus > 0,
                daily_bonus: dailyBonus,
                new_streak: newStreak
            };
        }

        // Si no hubo mejora pero sí hubo bono diario, igual actualizamos los puntos y limpiamos multiplicador
        if (dailyBonus > 0 || multiplier > 1) {
            const newPoints = (enrollment.ranking_points ?? 0) + dailyBonus;
            const newSpendable = (enrollment.spendable_points ?? 0) + dailyBonus;
            await ctx.db.patch(enrollment._id, {
                ranking_points: newPoints,
                spendable_points: newSpendable,
                total_points: (enrollment.total_points ?? 0) + dailyBonus,
                active_multiplier: undefined, // Consumir el multiplicador incluso si no hubo mejora en este quiz
            });
            return {
                success: true,
                earned: dailyBonus,
                is_improvement: false,
                daily_bonus_applied: true,
                daily_bonus: dailyBonus,
                new_streak: newStreak,
                new_rank: newPoints,
                new_spendable: newSpendable
            };
        }

        return {
            success: true,
            earned: 0,
            is_improvement: false,
            total_earned_best: bestPreviousPoints,
            new_streak: currentStreak
        };
    },
});
