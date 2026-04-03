import { mutation } from "./_generated/server";
import { requireAuth } from "./withUser";

// Crea el curso demo y quizzes de ejemplo para usuarios en modo prueba
export const setupDemoData = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        // Si ya tiene cursos, solo asegurar que esté inscrito en alguno
        const existingCourses = await ctx.db
            .query("courses")
            .withIndex("by_teacher", (q) => q.eq("teacher_id", user._id))
            .collect();

        if (existingCourses.length > 0) {
            const existing = existingCourses[0];
            const enrolled = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .filter((q) => q.eq(q.field("course_id"), existing._id))
                .first();
            if (!enrolled) {
                await ctx.db.insert("enrollments", {
                    user_id: user._id,
                    course_id: existing._id,
                    ranking_points: 150,
                    spendable_points: 150,
                    total_points: 150,
                });
            }
            return { already_setup: true };
        }

        const now = Date.now();

        // 1. Crear curso demo
        const courseId = await ctx.db.insert("courses", {
            name: "🚀 Fundamentos de Programación",
            code: "FP-DEMO",
            teacher_id: user._id,
            description: "Curso de demostración de QuestIA. Explora todos los tipos de desafíos disponibles.",
        });

        // 2. Inscribir al usuario como alumno en su propio curso demo
        await ctx.db.insert("enrollments", {
            user_id: user._id,
            course_id: courseId,
            ranking_points: 150,
            spendable_points: 150,
            total_points: 150,
        });

        // 3. Trivia (opción múltiple)
        await ctx.db.insert("quizzes", {
            course_id: courseId,
            teacher_id: user._id,
            title: "🧠 Trivia: Conceptos de Programación",
            quiz_type: "trivia",
            questions: [
                {
                    question: "¿Qué es un algoritmo?",
                    options: [
                        "Un tipo de dato en Python",
                        "Una secuencia de pasos ordenados para resolver un problema",
                        "Un lenguaje de programación",
                        "Un tipo de error de compilación",
                    ],
                    correct: 1,
                    fun_fact: "La palabra 'algoritmo' viene del matemático persa Al-Juarismi, del siglo IX."
                },
                {
                    question: "¿Qué significa 'bug' en programación?",
                    options: [
                        "Una nueva funcionalidad",
                        "Un comentario en el código",
                        "Un error en el programa",
                        "Un tipo de bucle",
                    ],
                    correct: 2,
                    fun_fact: "El primer bug documentado fue una polilla real atrapada en un relay de una computadora en 1947."
                },
                {
                    question: "¿Cuál de estas estructuras permite repetir un bloque de código?",
                    options: ["Condicional", "Variable", "Función", "Bucle"],
                    correct: 3,
                    fun_fact: "Los bucles for y while son los más usados. Algunos lenguajes también tienen do-while."
                },
                {
                    question: "¿Qué es una variable?",
                    options: [
                        "Un número fijo que no cambia",
                        "Un espacio en memoria para almacenar datos",
                        "Una función matemática",
                        "Un tipo especial de bucle",
                    ],
                    correct: 1,
                    fun_fact: "El nombre 'variable' refleja que su valor puede variar durante la ejecución del programa."
                },
            ],
            difficulty: "medium",
            num_questions: 4,
            created_at: now,
            is_active: true,
        });

        // 4. Verdadero/Falso
        await ctx.db.insert("quizzes", {
            course_id: courseId,
            teacher_id: user._id,
            title: "✅ Verdadero o Falso: ¿Cuánto sabes?",
            quiz_type: "true_false",
            questions: [
                {
                    statement: "Python es un lenguaje de programación interpretado.",
                    correct: true,
                },
                {
                    statement: "En todos los lenguajes, los índices de los arreglos comienzan en 1.",
                    correct: false,
                    falsify: "En la mayoría (Python, C, Java), los índices comienzan en 0.",
                },
                {
                    statement: "Una función puede llamarse a sí misma. Esto se llama recursión.",
                    correct: true,
                },
                {
                    statement: "Los comentarios en el código son ejecutados por el computador.",
                    correct: false,
                    falsify: "Los comentarios son ignorados completamente por el compilador o intérprete.",
                },
                {
                    statement: "HTML es un lenguaje de programación.",
                    correct: false,
                    falsify: "HTML es un lenguaje de marcado, no de programación. No tiene lógica ni variables.",
                },
            ],
            difficulty: "easy",
            num_questions: 5,
            created_at: now,
            is_active: true,
        });

        // 5. Sopa de letras
        await ctx.db.insert("quizzes", {
            course_id: courseId,
            teacher_id: user._id,
            title: "🔤 Sopa de Letras: Vocabulario Tech",
            quiz_type: "word_search",
            questions: [
                {
                    words: ["PYTHON", "CODIGO", "FUNCION", "BUCLE", "VARIABLE", "ARRAY", "CLASE", "OBJETO", "METODO", "DEBUG"],
                    size: 12,
                },
            ],
            difficulty: "medium",
            num_questions: 1,
            created_at: now,
            is_active: true,
        });

        // 6. Memoria (pares de conceptos)
        await ctx.db.insert("quizzes", {
            course_id: courseId,
            teacher_id: user._id,
            title: "🃏 Memoria: Conceptos y Definiciones",
            quiz_type: "memory",
            questions: [
                { front: "Variable", back: "Almacena datos en memoria" },
                { front: "Función", back: "Bloque de código reutilizable" },
                { front: "Bucle", back: "Repite instrucciones" },
                { front: "Array", back: "Colección ordenada de datos" },
                { front: "Clase", back: "Plantilla para crear objetos" },
                { front: "Bug", back: "Error en el código" },
            ],
            difficulty: "easy",
            num_questions: 6,
            created_at: now,
            is_active: true,
        });

        // 7. Emparejamiento (match)
        await ctx.db.insert("quizzes", {
            course_id: courseId,
            teacher_id: user._id,
            title: "🔗 Emparejamiento: Términos y Siglas",
            quiz_type: "match",
            questions: [
                {
                    pairs: [
                        { term: "CPU", definition: "Unidad Central de Procesamiento" },
                        { term: "RAM", definition: "Memoria de Acceso Aleatorio" },
                        { term: "IDE", definition: "Entorno de Desarrollo Integrado" },
                        { term: "API", definition: "Interfaz de Programación de Apps" },
                        { term: "SQL", definition: "Lenguaje de Consulta Estructurado" },
                    ],
                },
            ],
            difficulty: "medium",
            num_questions: 1,
            created_at: now,
            is_active: true,
        });

        // 8. Recompensas demo
        await ctx.db.insert("rewards", {
            course_id: courseId,
            name: "🧊 Congelar Racha",
            description: "Protege tu racha de puntos si un día no puedes jugar.",
            cost: 50,
            stock: 10,
        });

        await ctx.db.insert("rewards", {
            course_id: courseId,
            name: "⚡ Multiplicador x2",
            description: "Tu próximo quiz te dará el doble de puntos.",
            cost: 100,
            stock: 5,
        });

        // 9. Misión demo
        await ctx.db.insert("missions", {
            course_id: courseId,
            title: "🎯 Primera Semana",
            description: "Completa los 5 desafíos del curso para ganar puntos extra.",
            points: 200,
            status: "active",
            narrative: "El mundo del código te espera. ¡Demuestra tus habilidades completando todos los desafíos disponibles!",
        });

        return { success: true };
    },
});
