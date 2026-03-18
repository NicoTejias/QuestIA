import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Generar quiz con IA a partir del contenido de un documento
export const generateQuiz = action({
    args: {
        document_id: v.id("course_documents"),
        num_questions: v.number(), // 5, 10, 15
        difficulty: v.string(), // "facil", "medio", "dificil"
        quiz_type: v.optional(v.string()), // "multiple_choice", "flashcard", "match"
        max_attempts: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // action auth not supported with requireAuth context yet, leaving it as it was if possible:
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("No autenticado");

        // Obtener el documento
        const doc = await ctx.runQuery(api.documents.getDocumentById, {
            document_id: args.document_id,
        });

        if (!doc) throw new Error("Documento no encontrado");
        if (!doc.content_text || doc.content_text.length < 50) {
            throw new Error("El documento no tiene suficiente texto para generar un quiz.");
        }

        // Obtener documentos maestros (PDA, PIA, PA) para alineación pedagógica oficial de Duoc UC
        const masterDocs = await ctx.runQuery(api.documents.getMasterDocuments, {
            course_id: doc.course_id,
        });

        let masterContext = "";
        if (masterDocs.length > 0) {
            masterContext = "\n\n=== CONTEXTO MAESTRO DE ASIGNATURA (DUOC UC) ===\n";
            masterDocs.forEach(m => {
                masterContext += `\nDocumento Ofical ${m.master_doc_type}:\n${m.content_text.substring(0, 4000)}\n`;
            });
            masterContext += "\nIMPORTANTE: Es obligatorio que las preguntas se alineen con los Resultados de Aprendizaje (RA) y los Indicadores de Logro (IL) definidos en estos documentos. Si el documento maestro pide 'analizar', no hagas preguntas de simple 'memoria'.\n";
        }

        // Truncar contenido a 15000 chars para el prompt
        const content = doc.content_text.substring(0, 15000);

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API key de Gemini no configurada. Agrega GEMINI_API_KEY en las variables de entorno de Convex.");
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });

        const difficultyMap: Record<string, string> = {
            facil: "fácil (conceptos básicos, definiciones directas)",
            medio: "medio (aplicación de conceptos, relaciones entre ideas)",
            dificil: "difícil (análisis, síntesis, problemas complejos)",
        };

        const type = args.quiz_type || "multiple_choice";
        let prompt = "";

        if (type === "multiple_choice") {
            prompt = `Eres un generador de quizzes educativos de nivel experto para Duoc UC en Chile. 
Genera EXACTAMENTE ${args.num_questions} preguntas de opción múltiple con ALTA CALIDAD PEDAGÓGICA basándote en el siguiente contenido académico. Considera los estándares institucionales.

REGLAS:
- Cada pregunta tiene EXACTAMENTE 4 opciones (A, B, C, D)
- Solo UNA opción es correcta
- Las opciones incorrectas deben ser plausibles pero claramente distinguibles
- Nivel de dificultad: ${difficultyMap[args.difficulty] || "medio"}
- Clasificación Bloom: Asigna a cada pregunta uno de estos niveles: "Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear".
- Clasificación DOK: Asigna un Nivel DOK del 1 al 4 según la complejidad.
- Idioma: Español chileno formal
- Incluye una breve explicación pedagógica de la respuesta correcta.

CONTENIDO DEL DOCUMENTO PARA EXTRAER PREGUNTAS:
${content}

${masterContext}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, con esta estructura:
{
  "title": "Misión: [nombre descriptivo inmersivo basado en el contenido]",
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct": 0,
      "explanation": "Explicación breve de la respuesta correcta",
      "bloom_level": "Nivel de Bloom",
      "dok_level": 1
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

CONTENIDO DEL DOCUMENTO PARA EXTRAER CONCEPTOS:
${content}

${masterContext}

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
                explanation: v.optional(v.string()),
                bloom_level: v.optional(v.string()),
                dok_level: v.optional(v.number()),
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
            throw new Error("No tienes permiso para agregar quizzes a este curso");

        const quizId = await ctx.db.insert("quizzes", {
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
                    title: `¡Nuevo Quiz: ${course.name}! 📝`,
                    body: `Se ha publicado "${args.title}". ¡Entra y demuestra lo que sabes!`,
                });
            }
        }

        return quizId;

    },
});

// Obtener quizzes de un ramo con estado de completación
export const getQuizzesByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
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
                const num_questions = quiz.questions?.length || 0;
                
                const best_score = userSubmissions.length > 0
                    ? Math.max(...userSubmissions.map(s => s.score))
                    : null;

                return {
                    ...quiz,
                    completed: attempts_count > 0,
                    attempts_count,
                    max_attempts,
                    best_score,
                    can_take: attempts_count < max_attempts && num_questions > 0,
                    score: best_score // Para compatibilidad
                };
            }));
        } catch {
            return quizzes.map(q => ({ ...q, can_take: false }));
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
                    .first(); // Usar first() para mayor resiliencia
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin"))
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
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
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

// Obtener o crear un intento para un quiz
export const getOrCreateAttempt = mutation({
    args: { quiz_id: v.id("quizzes") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        const questions = quiz.questions || [];
        const numQuestions = questions.length;

        if (numQuestions === 0) {
            throw new Error("Este quiz no tiene preguntas asignadas.");
        }

        // 1) Buscar intentos del usuario para este quiz
        const allAttempts = await ctx.db
            .query("quiz_attempts")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const inProgressAttempts = allAttempts.filter(a => a.status === "in_progress");

        // 2) Si hay un intento en progreso, devolverlo
        if (inProgressAttempts.length > 0) {
            inProgressAttempts.sort((a, b) => b.last_updated - a.last_updated);
            const attempt = inProgressAttempts[0];

            // Limpiar duplicados si existen
            for (let i = 1; i < inProgressAttempts.length; i++) {
                await ctx.db.patch(inProgressAttempts[i]._id, { status: "completed", last_updated: Date.now() });
            }

            // Validar que las opciones seleccionadas coincidan con el número de preguntas actual
            if (!attempt.selected_options || attempt.selected_options.length !== numQuestions) {
                const newSelected: (number | null)[] = new Array(numQuestions).fill(null);
                if (attempt.selected_options) {
                    for (let i = 0; i < Math.min(attempt.selected_options.length, numQuestions); i++) {
                        newSelected[i] = attempt.selected_options[i];
                    }
                }
                
                await ctx.db.patch(attempt._id, { 
                    selected_options: newSelected,
                    current_question_index: Math.min(attempt.current_question_index, numQuestions - 1),
                    last_updated: Date.now()
                });
                
                return { 
                    ...attempt, 
                    selected_options: newSelected,
                    current_question_index: Math.min(attempt.current_question_index, numQuestions - 1)
                };
            }

            return attempt;
        }

        // 3) No hay intento en progreso: verificar límite de intentos
        const completedSubmissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const maxAttempts = quiz.max_attempts ?? 1;
        if (completedSubmissions.length >= maxAttempts) {
            throw new Error(`Limite alcanzado (${maxAttempts} intento(s)).`);
        }

        // 4) Crear nuevo intento
        const selectedOptions: (number | null)[] = new Array(numQuestions).fill(null);
        const attemptId = await ctx.db.insert("quiz_attempts", {
            quiz_id: args.quiz_id,
            user_id: user._id,
            current_question_index: 0,
            selected_options: selectedOptions,
            status: "in_progress",
            last_updated: Date.now(),
        });

        const newAttempt = await ctx.db.get(attemptId);
        if (!newAttempt) throw new Error("Error al crear la sesión de quiz");
        
        return newAttempt;
    },
});

// Guardar progreso del intento
export const updateAttemptProgress = mutation({
    args: {
        attempt_id: v.id("quiz_attempts"),
        current_question_index: v.number(),
        selected_options: v.array(v.union(v.number(), v.null())),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const attempt = await ctx.db.get(args.attempt_id);
        
        if (!attempt || attempt.user_id !== user._id) {
            throw new Error("Intento no válido");
        }

        if (attempt.status !== "in_progress") {
            throw new Error("Este intento ya ha sido finalizado");
        }

        await ctx.db.patch(args.attempt_id, {
            current_question_index: args.current_question_index,
            selected_options: args.selected_options,
            last_updated: Date.now(),
        });
    },
});

// Registrar finalización de un quiz y otorgar puntos
export const submitQuiz = mutation({
    args: {
        quiz_id: v.id("quizzes"),
        // El score ya no se envía desde el frontend para evitar trampas
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        // Buscar el intento en progreso
        const attempts = await ctx.db
            .query("quiz_attempts")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .filter((q) => q.eq(q.field("status"), "in_progress"))
            .collect();

        const attempt = attempts.sort((a, b) => b.last_updated - a.last_updated)[0];

        if (!attempt) throw new Error("No hay un intento activo para este quiz");

        // Calcular puntaje
        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        quiz.questions.forEach((q: any, idx: number) => {
            const selected = attempt.selected_options[idx];
            const correct = q.correct ?? q.correctAnswerIndex;
            if (selected !== null && selected === correct) {
                correctCount++;
            }
            // Para flashcards y match, la lógica de guardado de selected_options 
            // puede variar, pero por ahora asumimos que el frontend marca 
            // correctamente lo que se considere "acierto".
        });

        const scorePct = Math.round((correctCount / totalQuestions) * 100);

        // Obtener historial de intentos previos (excluyendo este que vamos a cerrar)
        const submissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const currentAttemptsCount = submissions.length;
        const maxAttempts = quiz.max_attempts ?? 1;

        if (currentAttemptsCount >= maxAttempts) {
            throw new Error(`Has alcanzado el límite de ${maxAttempts} intentos permitido para este quiz.`);
        }

        // Marcar intento como completado
        await ctx.db.patch(attempt._id, {
            status: "completed",
            last_updated: Date.now(),
        });

        // --- MODO SIMULACIÓN (DOCENTE/ADMIN) ---
        // Si el usuario es docente o admin, devolvemos el resultado pero NO guardamos nada más
        // ni afectamos rachas ni puntos reales.
        if (user.role === "teacher" || user.role === "admin") {
            const basePoints = (quiz.num_questions || 5) * (quiz.difficulty === 'dificil' ? 20 : quiz.difficulty === 'medio' ? 15 : 10);
            const potentialEarned = Math.round((scorePct / 100) * basePoints);
            
            return {
                success: true,
                score: scorePct,
                earned: potentialEarned,
                is_simulation: true,
                message: `MODO PRUEBA: Hubieras ganado ${potentialEarned} puntos. No se han guardado registros.`,
                selected_options: attempt.selected_options
            };
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
                newStreak += 1;
            } else {
                if (currentIceCubes > 0) {
                    newStreak += 1;
                    usedFreeze = true;
                } else {
                    newStreak = 1;
                }
            }
            
            dailyBonus = Math.min(newStreak * 5, 50);
            
            await ctx.db.patch(user._id, { 
                last_daily_bonus_at: now,
                daily_streak: newStreak,
                ice_cubes: usedFreeze ? currentIceCubes - 1 : currentIceCubes
            });
        }
        // ----------------------------------------

        // Cálculo de puntos base según dificultad
        const basePoints = (quiz.num_questions || 5) * (quiz.difficulty === 'dificil' ? 20 : quiz.difficulty === 'medio' ? 15 : 10);
        const currentEarnedPoints = Math.round((scorePct / 100) * basePoints);

        const bestPreviousPoints = submissions.length > 0
            ? Math.max(...submissions.map(s => s.earned_points))
            : 0;

        const pointsToAward = Math.max(0, currentEarnedPoints - bestPreviousPoints) + dailyBonus;

        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), quiz.course_id))
            .first();

        if (!enrollment) throw new Error("No inscrito");
        
        const multiplier = enrollment.active_multiplier || 1;

        // Registrar el intento en submissions
        await ctx.db.insert("quiz_submissions", {
            quiz_id: args.quiz_id,
            user_id: user._id,
            score: scorePct,
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
                active_multiplier: undefined,
            });

            return {
                success: true,
                score: scorePct,
                earned: finalPointsToAward,
                is_improvement: pointsToAward > dailyBonus,
                total_earned_now: Math.round(currentEarnedPoints * multiplier),
                new_rank: newRankingPoints,
                new_spendable: newSpendablePoints,
                daily_bonus_applied: dailyBonus > 0,
                daily_bonus: dailyBonus,
                new_streak: newStreak,
                selected_options: attempt.selected_options // Devolvemos esto para que el frontend muestre revisión
            };
        }

        if (dailyBonus > 0 || multiplier > 1) {
            const newPoints = (enrollment.ranking_points ?? 0) + dailyBonus;
            const newSpendable = (enrollment.spendable_points ?? 0) + dailyBonus;
            await ctx.db.patch(enrollment._id, {
                ranking_points: newPoints,
                spendable_points: newSpendable,
                total_points: (enrollment.total_points ?? 0) + dailyBonus,
                active_multiplier: undefined,
            });
            return {
                success: true,
                score: scorePct,
                earned: dailyBonus,
                is_improvement: false,
                daily_bonus_applied: true,
                daily_bonus: dailyBonus,
                new_streak: newStreak,
                new_rank: newPoints,
                new_spendable: newSpendable,
                selected_options: attempt.selected_options
            };
        }

        return {
            success: true,
            score: scorePct,
            earned: 0,
            is_improvement: false,
            total_earned_best: bestPreviousPoints,
            new_streak: currentStreak,
            selected_options: attempt.selected_options
        };
    },
});
