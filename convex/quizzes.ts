import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { api } from "./_generated/api";
import { checkRateLimit } from "./rateLimit";
import { getGeminiModel } from "./geminiClient";

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

        // Verificar que el usuario es el docente dueño del documento
        if (doc.teacher_id !== identity.subject && identity.subject) {
            // Comparar con clerkId — doc.teacher_id es un Convex user _id, buscar por clerkId
            const docOwner = await ctx.runQuery(api.users.getTeacherIdByClerkId, {
                clerkId: identity.subject,
            });
            if (!docOwner || doc.teacher_id !== docOwner) {
                throw new Error("No tienes permiso para generar un quiz de este documento");
            }
        }

        if (!doc.content_text || doc.content_text.length < 50) {
            throw new Error("El documento no tiene suficiente texto para generar un quiz.");
        }

        // Obtener documentos maestros (PDA, PIA, PA) para alineación pedagógica oficial de QuestIA
        const masterDocs = await ctx.runQuery(api.documents.getMasterDocuments, {
            course_id: doc.course_id,
        });

        let masterContext = "";
        if (masterDocs.length > 0) {
            masterContext = "\n\n=== CONTEXTO MAESTRO DE ASIGNATURA (QUESTIA) ===\n";
            masterDocs.forEach(m => {
                masterContext += `\nDocumento Ofical ${m.master_doc_type}:\n${m.content_text.substring(0, 4000)}\n`;
            });
            masterContext += "\nIMPORTANTE: Es obligatorio que las preguntas se alineen con los Resultados de Aprendizaje (RA) y los Indicadores de Logro (IL) definidos en estos documentos. Si el documento maestro pide 'analizar', no hagas preguntas de simple 'memoria'.\n";
        }

        // Truncar contenido a 15000 chars para el prompt
        const content = doc.content_text.substring(0, 15000);

        const model = await getGeminiModel();

        const difficultyMap: Record<string, string> = {
            facil: "fácil (conceptos básicos, definiciones directas)",
            medio: "medio (aplicación de conceptos, relaciones entre ideas)",
            dificil: "difícil (análisis, síntesis, problemas complejos)",
        };

        const type = args.quiz_type || "multiple_choice";
        let prompt = "";

        if (type === "multiple_choice") {
            prompt = `Eres un generador de quizzes educativos de nivel experto para QuestIA 
Genera EXACTAMENTE ${args.num_questions} preguntas de opción múltiple con ALTA CALIDAD PEDAGÓGICA basándote en el siguiente contenido académico. Considera los estándares de QuestIA.

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
        } else if (type === "match") {
            prompt = `Eres un generador de material educativo para educación superior en Chile. 
Extrae EXACTAMENTE ${args.num_questions} pares de conceptos y sus definiciones desde el siguiente contenido académico.
Esto se usará para un juego de relacionar columnas (Match).

REGLAS:
- El concepto de un lado debe ser corto (1 a 4 palabras).
- La definición del otro lado debe ser concisa y clara, fácil de leer.
- Nivel de profundidad: ${difficultyMap[args.difficulty] || "medio"}
- Escribe en español.

CONTENIDO DEL DOCUMENTO PARA EXTRAER CONCEPTOS:
${content}

${masterContext}

            RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, con esta estructura:
{
  "title": "Relacionar Conceptos: [nombre temático]",
  "questions": [
    {
      "front": "Nombre del Concepto Clave",
      "back": "Definición corta y precisa del concepto"
    }
  ]
}`;
        } else if (type === 'true_false') {
            prompt = `Eres un generador de preguntas de verdadero o falso para educación superior en Chile.
Genera EXACTAMENTE ${args.num_questions} afirmaciones basadas en el siguiente contenido académico.

REGLAS:
- Las afirmaciones deben ser verdaderas o falsas según el contenido.
- IMPORTANTE: Debe haber una mezcla equilibrada de verdaderas y falsas (aprox. 50/50). NO generes todas verdaderas ni todas falsas.
- Deben ser frases completas y claras.
- La propiedad "correct" indica si es verdadera (true) o falsa (false).
- Si es falsa, incluye "falsify" con la versión CORRECTA de la afirmación (la forma en que debería decir para ser verdadera).
- Si es verdadera, no incluyas "falsify".
- Incluye una "explanation" breve explicando por qué la afirmación es verdadera o falsa.
- Nivel: ${difficultyMap[args.difficulty] || "medio"}
- Idioma: Español chileno formal

CONTENIDO:
${content}

${masterContext}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
{
  "title": "Verdadero o Falso: [tema]",
  "questions": [
    {
      "statement": "Afirmación completa que debe evaluarse como verdadera o falsa",
      "correct": true,
      "explanation": "Breve explicación de por qué es verdadera o falsa",
      "falsify": "Versión corregida si fuera falsa (omitir si es verdadera)"
    }
  ]
}`;
        } else if (type === 'fill_blank') {
            prompt = `Eres un generador de ejercicios de completar oraciones para educación superior en Chile.
Genera EXACTAMENTE ${args.num_questions} oraciones con un espacio en blanco basadas en el siguiente contenido.

REGLAS:
- Cada oración debe tener UN espacio en blanco marcado con "__".
- La respuesta correcta va en "answer".
- Las opciones incorrectas deben ser plausibles.
- Debe haber exactamente 4 opciones (1 correcta + 3 incorrectas).
- Nivel: ${difficultyMap[args.difficulty] || "medio"}
- Idioma: Español chileno formal

CONTENIDO:
${content}

${masterContext}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
{
  "title": "Completar: [tema]",
  "questions": [
    {
      "question": "La fotosíntesis es el proceso por el cual las plantas convierten la luz en energía química.",
      "answer": "luz",
      "options": ["luz", "agua", "suelo", "dióxido de carbono"],
      "explanation": "La fotosíntesis utiliza luz solar para convertir CO2 y agua en glucosa."
    }
  ]
}`;
        } else if (type === 'order_steps') {
            prompt = `Eres un generador de ejercicios de ordenamiento de pasos para educación superior en Chile.
Genera EXACTAMENTE ${args.num_questions} secuencias de pasos ordenados basadas en el siguiente contenido.

REGLAS:
- Cada ejercicio debe tener entre 4 y 6 pasos en orden correcto.
- Los pasos deben ser claros y numerados en el texto original.
- La propiedad "correctOrder" debe tener los índices originales de los pasos en orden correcto (0-indexed).
- Nivel: ${difficultyMap[args.difficulty] || "medio"}
- Idioma: Español chileno formal

CONTENIDO:
${content}

${masterContext}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
{
  "title": "Ordenar Pasos: [tema]",
  "questions": [
    {
      "description": "Ordena los pasos del proceso de mitosis",
      "steps": ["La célula se divide en dos células hija", "Los cromosomas se alinean en el ecuador", "Los cromosomas se condensan", "La célula se prepara para dividirse"],
      "correctOrder": [2, 3, 1, 0]
    }
  ]
}`;
        } else if (type === 'trivia') {
            prompt = `Eres un generador de trivia relámpago para educación superior en Chile.
 Genera EXACTAMENTE ${args.num_questions} preguntas de respuesta rápida basadas en el siguiente contenido.

 REGLAS:
 - Preguntas cortas y directas (máximo 15 palabras).
 - Respuesta única y corta (máximo 5 palabras).
 - 4 opciones de respuesta (1 correcta, 3 incorrectas).
 - La respuesta correcta va en "correct".
 - Incluir "fun_fact" como dato curioso educativo.
 - Nivel: ${difficultyMap[args.difficulty] || "medio"}
 - Idioma: Español chileno formal

 CONTENIDO:
 ${content}

 ${masterContext}

 RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
 {
   "title": "Trivia Relámpago: [tema]",
   "questions": [
     {
       "question": "¿Cuántos protones tiene el hidrógeno?",
       "options": ["1", "2", "0", "3"],
       "correct": 0,
       "fun_fact": "El hidrógeno es el elemento más abundante del universo."
     }
   ]
 }`;
        } else if (type === 'word_search') {
            prompt = `Eres un generador de sopas de letras educativas para educación superior en Chile.
 Genera EXACTAMENTE ${args.num_questions} palabras clave basadas en el siguiente contenido académico.

 REGLAS:
 - Palabras entre 4 y 12 letras.
 - Incluir términos técnicos importantes del contenido.
 - La propiedad "size" define el tamaño de la grilla (recomendado 12-16).
 - Incluir las palabras en español formal.
 - Nivel: ${difficultyMap[args.difficulty] || "medio"}
 - Idioma: Español chileno formal

 CONTENIDO:
 ${content}

 ${masterContext}

 RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
 {
   "title": "Sopa de Letras: [tema]",
   "questions": [
     {
       "words": ["fotossíntesis", "clorofila", "glucosa", "oxígeno", "mitochondria", "ATP", "respiración", "célula", "enzima", "metabolismo"],
       "size": 14
     }
   ]
 }`;
        } else if (type === 'quiz_sprint') {
            prompt = `Eres un generador de quiz sprint (carrera de preguntas) para educación superior en Chile.
 Genera EXACTAMENTE ${args.num_questions} preguntas de respuesta rápida basadas en el siguiente contenido.

 REGLAS:
 - Preguntas muy cortas y directas (máximo 12 palabras).
 - 4 opciones por pregunta (1 correcta, 3 plausibles).
 - La respuesta correcta va en "correct".
 - "time_limit" en segundos (default 15 para nivel fácil, 10 para difícil).
 - Diseñadas para responderse muy rápido bajo presión de tiempo.
 - Nivel: ${difficultyMap[args.difficulty] || "medio"}
 - Idioma: Español chileno formal

 CONTENIDO:
 ${content}

 ${masterContext}

 RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
 {
   "title": "Quiz Sprint: [tema]",
   "questions": [
     {
       "question": "¿Qué gas liberan las plantas en la fotosíntesis?",
       "options": ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Hidrógeno"],
       "correct": 0,
       "time_limit": 15
     }
   ]
 }`;
        } else if (type === 'memory') {
            prompt = `Eres un generador de juegos de memoria (matching) para educación superior en Chile.
 Genera EXACTAMENTE ${args.num_questions} pares de términos y definiciones basadas en el siguiente contenido.

 REGLAS:
 - Cada par tiene un "term" (concepto breve, 1-5 palabras) y una "definition" (definición de 1-2 oraciones).
 - Los términos deben ser conceptos clave del contenido.
 - Diseñado para el juego de memoria donde el jugador debe encontrar la pareja.
 - Nivel: ${difficultyMap[args.difficulty] || "medio"}
 - Idioma: Español chileno formal

 CONTENIDO:
 ${content}

 ${masterContext}

 RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks:
 {
   "title": "Memory: [tema]",
   "questions": [
     {
       "pairs": [
         { "term": "Mitocondria", "definition": "Orgánulo que produce energía en la célula mediante respiración aeróbica." },
         { "term": "Ribosoma", "definition": "Estructura celular responsable de la síntesis de proteínas." }
       ]
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

        // Sanitizar preguntas: eliminar campos extra que Convex no acepta
        const sanitizedQuestions = quizData.questions.map((q: any) => {
            if (type === "word_search") {
                // La IA a veces devuelve un array de palabras en lugar de un objeto con words
                if (Array.isArray(q)) return { words: q.map(String), size: 14 };
                return { words: Array.isArray(q.words) ? q.words.map(String) : [], size: q.size ?? 14 };
            }
            if (type === "memory") return { pairs: Array.isArray(q.pairs) ? q.pairs.map((p: any) => ({ term: String(p.term ?? ''), definition: String(p.definition ?? '') })) : [] };
            if (type === "flashcard") return { front: String(q.front ?? ''), back: String(q.back ?? '') };
            if (type === "true_false") {
                // Use conditional spread to avoid passing `falsify: undefined` (invalid Convex value)
                const tfCorrect = q.correct === true || q.correct === 1 || String(q.correct).toLowerCase() === 'true';
                const tfBase: any = { statement: String(q.statement ?? q.question ?? ''), correct: tfCorrect };
                if (q.falsify && typeof q.falsify === 'string' && q.falsify.trim()) tfBase.falsify = q.falsify.trim();
                return tfBase;
            }
            if (type === "order_steps") return { description: String(q.description ?? ''), steps: Array.isArray(q.steps) ? q.steps.map(String) : [], correctOrder: Array.isArray(q.correctOrder) ? q.correctOrder : q.steps?.map((_: any, i: number) => i) ?? [] };
            if (type === "fill_blank") {
                const fb: any = { question: String(q.question ?? ''), answer: String(q.answer ?? ''), options: Array.isArray(q.options) ? q.options.map(String) : [] };
                if (q.explanation) fb.explanation = String(q.explanation);
                return fb;
            }
            if (type === "quiz_sprint") {
                const qs: any = { question: String(q.question ?? ''), options: Array.isArray(q.options) ? q.options.map(String) : [], correct: Number(q.correct ?? 0) };
                if (q.time_limit) qs.time_limit = Number(q.time_limit);
                return qs;
            }
            // match: the prompt generates {front, back} pairs (same format as flashcard)
            if (type === "match") return { front: String(q.front ?? q.term ?? ''), back: String(q.back ?? q.definition ?? '') };
            // trivia: only allows fun_fact (no explanation/bloom_level/dok_level)
            if (type === "trivia") {
                const t: any = { question: String(q.question ?? ''), options: Array.isArray(q.options) ? q.options.map(String) : [], correct: Number(q.correct ?? 0) };
                if (q.fun_fact) t.fun_fact = String(q.fun_fact);
                return t;
            }
            // multiple_choice: allows explanation, bloom_level, dok_level (no fun_fact/time_limit)
            const mc: any = {
                question: String(q.question ?? ''),
                options: Array.isArray(q.options) ? q.options.map(String) : [],
                correct: Number(q.correct ?? 0),
            };
            if (q.explanation) mc.explanation = String(q.explanation);
            if (q.bloom_level) mc.bloom_level = String(q.bloom_level);
            if (q.dok_level != null) mc.dok_level = Number(q.dok_level);
            return mc;
        });

        // Guardar el quiz en la BD
        const quizId: any = await ctx.runMutation(api.quizzes.saveQuiz, {
            course_id: doc.course_id,
            document_id: args.document_id,
            title: quizData.title || `Quiz de ${doc.file_name}`,
            quiz_type: type,
            questions: sanitizedQuestions,
            difficulty: args.difficulty,
            num_questions: sanitizedQuestions.length,
            max_attempts: args.max_attempts ?? 1,
        });

        return {
            quizId,
            title: quizData.title,
            numQuestions: sanitizedQuestions.length,
            questions: sanitizedQuestions,
            quiz_type: type,
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
                fun_fact: v.optional(v.string()),
                time_limit: v.optional(v.number()),
            }),
            v.object({
                front: v.string(),
                back: v.string()
            }),
            v.object({
                statement: v.string(),
                correct: v.boolean(),
                falsify: v.optional(v.string()),
            }),
            v.object({
                question: v.string(),
                answer: v.string(),
                options: v.array(v.string()),
                explanation: v.optional(v.string()),
            }),
            v.object({
                description: v.string(),
                steps: v.array(v.string()),
                correctOrder: v.array(v.number()),
            }),
            v.object({
                words: v.array(v.string()),
                size: v.optional(v.number()),
            }),
            v.object({
                pairs: v.array(v.object({
                    term: v.string(),
                    definition: v.string(),
                })),
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

        const quizType = (args.quiz_type || "multiple_choice") as "multiple_choice" | "match" | "flashcard" | "true_false" | "fill_blank" | "order_steps" | "trivia" | "word_search" | "quiz_sprint" | "memory";
        
        const quizId = await ctx.db.insert("quizzes", {
            course_id: args.course_id,
            document_id: args.document_id,
            teacher_id: user._id,
            title: args.title,
            quiz_type: quizType,
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
const GAME_TYPE_LABELS: Record<string, string> = {
    multiple_choice: "Quiz Clásico",
    match: "Pareamiento",
    true_false: "Verdadero o Falso",
    fill_blank: "Completar",
    order_steps: "Ordenar Pasos",
    trivia: "Trivia Flash",
    word_search: "Sopa de Letras",
    quiz_sprint: "Sprint",
    memory: "Memoria",
};

export const getQuizzesByCourse = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        const docs = await ctx.db.query("course_documents").withIndex("by_course", q => q.eq("course_id", args.course_id)).collect();
        const docMap = new Map(docs.map(d => [d._id, d.file_name]));

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
                    score: best_score,
                    source_file_name: docMap.get(quiz.document_id) || null,
                    game_type_label: GAME_TYPE_LABELS[quiz.quiz_type || "multiple_choice"] || quiz.quiz_type,
                };
            }));
        } catch {
            return quizzes.map(q => ({ ...q, can_take: false, source_file_name: docMap.get(q.document_id) || null, game_type_label: GAME_TYPE_LABELS[q.quiz_type || "multiple_choice"] || q.quiz_type }));
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
                const newSelected: any[] = new Array(numQuestions).fill(null);
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
        const selectedOptions: any[] = new Array(numQuestions).fill(null);
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
        selected_options: v.array(v.union(v.number(), v.null(), v.array(v.number()), v.array(v.string()))),
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
        time_penalty: v.optional(v.number()),
        final_answers: v.optional(v.array(v.union(v.number(), v.null(), v.array(v.number()), v.array(v.string())))),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Docentes/admin no tienen rate limit (es modo simulación)
        if (user.role !== "teacher" && user.role !== "admin") {
            await checkRateLimit(ctx, user._id, "quiz_submit");
        }

        const quiz = await ctx.db.get(args.quiz_id);
        if (!quiz) throw new Error("Quiz no encontrado");

        const attempts = await ctx.db
            .query("quiz_attempts")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .filter((q) => q.eq(q.field("status"), "in_progress"))
            .collect();

        const attempt = attempts.sort((a, b) => b.last_updated - a.last_updated)[0];
        if (!attempt) throw new Error("No hay un intento activo para este quiz");

        // Usar respuestas finales del cliente (evita race condition) o las del intento guardado
        const answersToScore = args.final_answers ?? attempt.selected_options;

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;
        const quizType = quiz.quiz_type || "multiple_choice";

        // Match: scoring especial — answers[0] contiene el array de pares correctamente emparejados
        if (quizType === "match") {
            const matched = Array.isArray(answersToScore[0]) ? (answersToScore[0] as number[]) : [];
            correctCount = matched.length;
        }

        quiz.questions.forEach((q: any, idx: number) => {
            if (quizType === "match") return; // ya calculado arriba
            const selected = answersToScore[idx];

            if (quizType === "order_steps") {
                if (Array.isArray(selected) && selected.length === (q.steps?.length || 0)) {
                    (selected as any[]).forEach((s: number, i: number) => {
                        if (s === q.correctOrder[i]) correctCount += 1 / totalQuestions;
                    });
                }
            } else if (quizType === "true_false") {
                if (selected !== null) {
                    const expected = q.correct === true ? 1 : 0;
                    if (selected === expected) correctCount++;
                }
            } else if (quizType === "word_search") {
                if (Array.isArray(selected)) {
                    const qWordsUpper = (q.words || []).map((w: string) => w.toUpperCase());
                    const found = (selected as any[]).filter((w: string) => qWordsUpper.includes(w.toUpperCase())).length;
                    correctCount += found / (q.words?.length || 1);
                }
            } else if (quizType === "memory") {
                if (Array.isArray(selected)) {
                    const pairs = q.pairs || [];
                    const correctPairs = pairs.filter((_: any, pi: number) => {
                        return (selected as number[]).includes(pi * 2) && (selected as number[]).includes(pi * 2 + 1);
                    }).length;
                    correctCount += correctPairs / (pairs.length || 1);
                }
            } else if (quizType === "quiz_sprint") {
                if (selected !== null && selected === (q.correct ?? q.correctAnswerIndex)) {
                    correctCount++;
                }
            } else if (quizType === "fill_blank") {
                // fill_blank: the answer is stored as text in q.answer, options are q.options
                // The user selects an index. The correct index is the position of q.answer in q.options.
                if (selected !== null) {
                    const correctIdx = q.options?.indexOf(q.answer) ?? -1;
                    if (selected === correctIdx) correctCount++;
                }
            } else {
                const correct = q.correct ?? q.correctAnswerIndex;
                if (selected !== null && selected === correct) correctCount++;
            }
        });

        const scorePct = Math.round((correctCount / totalQuestions) * 100);

        const submissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const currentAttemptsCount = submissions.length;
        const maxAttempts = quiz.max_attempts ?? 1;

        if (user.role === "teacher" || user.role === "admin") {
            await ctx.db.patch(attempt._id, { status: "completed", last_updated: Date.now() });
            let basePointsValue = (quiz.num_questions || 5) * (quiz.difficulty === 'dificil' ? 20 : quiz.difficulty === 'medio' ? 15 : 10);
            const qType = quiz.quiz_type || "multiple_choice";
            if (qType === "memory" || qType === "word_search") {
                const firstQ = quiz.questions[0] as any;
                const itemCount = qType === "memory" ? (firstQ.pairs?.length || 5) : (firstQ.words?.length || 5);
                basePointsValue = itemCount * 10;
            }
            const basePoints2 = basePointsValue;
            const rawEarned2 = Math.round((scorePct / 100) * basePoints2);
            const potentialEarned2 = Math.max(0, rawEarned2 - (args.time_penalty || 0));
            return {
                success: true, score: scorePct, earned: potentialEarned2,
                is_simulation: true, remaining_attempts: 999,
                message: `MODO PRUEBA: Hubieras ganado ${potentialEarned2} puntos. No se guardaron registros.`,
                selected_options: attempt.selected_options, attempts_used: currentAttemptsCount + 1
            };
        }

        // Verificar limite para alumnos (el teacher ya retorno arriba)
        if (maxAttempts !== 99 && currentAttemptsCount >= maxAttempts) {
            throw new Error(`Limite alcanzado (${maxAttempts} intento(s)).`);
        }

        await ctx.db.patch(attempt._id, { status: "completed", last_updated: Date.now() });














        let basePointsValueStu = (quiz.num_questions || 5) * (quiz.difficulty === 'dificil' ? 20 : quiz.difficulty === 'medio' ? 15 : 10);
        const qTypeStu = quiz.quiz_type || "multiple_choice";
        if (qTypeStu === "memory" || qTypeStu === "word_search") {
            const firstQ = quiz.questions[0] as any;
            const itemCount = qTypeStu === "memory" ? (firstQ.pairs?.length || 5) : (firstQ.words?.length || 5);
            basePointsValueStu = itemCount * 10;
        }
        const basePoints = basePointsValueStu;
        const rawEarnedThisAttempt = Math.round((scorePct / 100) * basePoints);
        const earnedPointsThisAttempt = Math.max(0, rawEarnedThisAttempt - (args.time_penalty || 0));

        await ctx.db.insert("quiz_submissions", {
            quiz_id: args.quiz_id,
            user_id: user._id,
            score: scorePct,
            earned_points: earnedPointsThisAttempt,
            completed_at: Date.now(),
        });

        const allSubmissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_quiz_user", (q) => q.eq("quiz_id", args.quiz_id).eq("user_id", user._id))
            .collect();

        const totalScore = allSubmissions.reduce((sum, s) => sum + s.score, 0);
        const averageScore = Math.round(totalScore / allSubmissions.length);
        const averageEarned = Math.round((averageScore / 100) * basePoints);

        const previouslyPaid = allSubmissions.slice(0, -1).reduce((sum, s) => sum + s.earned_points, 0);
        const pointsToAward = Math.max(0, averageEarned - previouslyPaid);

        const now = Date.now();
        const lastBonus = user.last_daily_bonus_at || 0;
        const currentStreak = user.daily_streak || 0;
        const currentIceCubes = user.ice_cubes || 0;
        const todayDateStr = new Date(now).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
        const lastBonusDateStr = lastBonus ? new Date(lastBonus).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) : "";
        const yesterdayDateStr = new Date(now - 1000 * 60 * 60 * 24).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

        let dailyBonus = 0;
        let newStreak = currentStreak;
        let usedFreeze = false;

        if (lastBonusDateStr !== todayDateStr) {
            if (lastBonusDateStr === yesterdayDateStr || lastBonus === 0) newStreak += 1;
            else if (currentIceCubes > 0) { newStreak += 1; usedFreeze = true; }
            else newStreak = 1;
            dailyBonus = Math.min(newStreak * 5, 50);
            await ctx.db.patch(user._id, {
                last_daily_bonus_at: now,
                daily_streak: newStreak,
                ice_cubes: usedFreeze ? currentIceCubes - 1 : currentIceCubes
            });
        }

        const finalPointsToAward = Math.max(0, pointsToAward) + dailyBonus;
        const remainingAttempts = maxAttempts === 99 ? 999 : Math.max(0, maxAttempts - allSubmissions.length);

        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), quiz.course_id))
            .first();

        if (!enrollment) throw new Error("No inscrito");

        if (finalPointsToAward > 0) {
            const newRankingPoints = (enrollment.ranking_points ?? 0) + finalPointsToAward;
            const newSpendablePoints = (enrollment.spendable_points ?? 0) + finalPointsToAward;
            await ctx.db.patch(enrollment._id, {
                ranking_points: newRankingPoints,
                spendable_points: newSpendablePoints,
                total_points: (enrollment.total_points ?? 0) + finalPointsToAward,
                active_multiplier: undefined,
            });
            return {
                success: true, score: scorePct, earned: finalPointsToAward,
                average_score: averageScore, attempts_used: allSubmissions.length,
                remaining_attempts: remainingAttempts, max_attempts: maxAttempts,
                is_final_attempt: remainingAttempts === 0 || maxAttempts === 99,
                daily_bonus_applied: dailyBonus > 0, daily_bonus: dailyBonus,
                new_streak: newStreak, new_rank: newRankingPoints,
                new_spendable: newSpendablePoints,
                selected_options: attempt.selected_options
            };
        }

        if (dailyBonus > 0) {
            const newPoints = (enrollment.ranking_points ?? 0) + dailyBonus;
            const newSpendable = (enrollment.spendable_points ?? 0) + dailyBonus;
            await ctx.db.patch(enrollment._id, {
                ranking_points: newPoints,
                spendable_points: newSpendable,
                total_points: (enrollment.total_points ?? 0) + dailyBonus,
                active_multiplier: undefined,
            });
            return {
                success: true, score: scorePct, earned: dailyBonus,
                average_score: averageScore, attempts_used: allSubmissions.length,
                remaining_attempts: remainingAttempts, max_attempts: maxAttempts,
                is_final_attempt: remainingAttempts === 0 || maxAttempts === 99,
                daily_bonus_applied: true, daily_bonus: dailyBonus,
                new_streak: newStreak, new_rank: newPoints,
                new_spendable: newSpendable,
                selected_options: attempt.selected_options
            };
        }

        return {
            success: true, score: scorePct, earned: 0,
            average_score: averageScore, attempts_used: allSubmissions.length,
            remaining_attempts: remainingAttempts, max_attempts: maxAttempts,
            is_final_attempt: remainingAttempts === 0 || maxAttempts === 99,
            new_streak: currentStreak,
            selected_options: attempt.selected_options
        };
    },
});



// Historial de quizzes completados por el alumno en un ramo
export const getMyQuizHistory = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q]));
        const quizIds = new Set(quizzes.map((q) => q._id.toString()));

        const submissions = await ctx.db
            .query("quiz_submissions")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect();

        return submissions
            .filter((s) => quizIds.has(s.quiz_id.toString()))
            .map((s) => ({
                ...s,
                quizTitle: quizMap.get(s.quiz_id.toString())?.title ?? "Quiz",
                quizType: quizMap.get(s.quiz_id.toString())?.quiz_type ?? "multiple_choice",
            }))
            .sort((a, b) => b.completed_at - a.completed_at);
    },
});
