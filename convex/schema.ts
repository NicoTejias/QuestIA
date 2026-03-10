import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,
    // Override the users table to include our custom fields
    users: defineTable({
        // Campos requeridos por Convex Auth
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        // Campos personalizados de GestiónDocente
        role: v.optional(v.string()),  // "student" | "teacher" | "admin"
        is_verified: v.optional(v.boolean()),
        student_id: v.optional(v.string()), // RUT o Matrícula
        last_daily_bonus_at: v.optional(v.number()), // Timestamp del último bono diario
        belbin_profile: v.optional(v.object({
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
                Cohesionador: v.optional(v.number()),
                Monitor: v.optional(v.number())
            }),
        })),
    })
        .index("email", ["email"])
        .index("by_student_id", ["student_id"]),

    courses: defineTable({
        name: v.string(),
        code: v.string(),
        teacher_id: v.id("users"),
        description: v.string(),
    }).index("by_teacher", ["teacher_id"]),

    whitelists: defineTable({
        course_id: v.id("courses"),
        student_identifier: v.string(), // RUT o Correo
        student_name: v.optional(v.string()), // Nombre (opcional, para visualización antes de registro)
    })
        .index("by_course", ["course_id"])
        .index("by_identifier", ["student_identifier"]),

    enrollments: defineTable({
        user_id: v.id("users"),
        course_id: v.id("courses"),
        ranking_points: v.number(),   // Puntos totales acumulados (para el ranking, nunca bajan)
        spendable_points: v.number(), // Puntos disponibles para canjear
        total_points: v.optional(v.number()), // Legacy (compatibilidad)
        group_id: v.optional(v.string()),
    })
        .index("by_user", ["user_id"])
        .index("by_course", ["course_id"])
        .index("by_ranking", ["course_id", "ranking_points"]),

    missions: defineTable({
        course_id: v.id("courses"),
        title: v.string(),
        description: v.string(),
        points: v.number(),
        status: v.union(v.literal("active"), v.literal("archived")),
    }).index("by_course", ["course_id"]),

    mission_submissions: defineTable({
        mission_id: v.id("missions"),
        user_id: v.id("users"),
        completed_at: v.number(),
    })
        .index("by_mission", ["mission_id"])
        .index("by_user", ["user_id"]),

    rewards: defineTable({
        course_id: v.id("courses"),
        name: v.string(),
        description: v.string(),
        cost: v.number(),
        stock: v.number(),
        image_url: v.optional(v.string()),
    }).index("by_course", ["course_id"]),

    redemptions: defineTable({
        user_id: v.id("users"),
        reward_id: v.id("rewards"),
        status: v.union(v.literal("pending"), v.literal("completed")),
        timestamp: v.number(),
    })
        .index("by_user", ["user_id"])
        .index("by_reward", ["reward_id"]),

    course_documents: defineTable({
        course_id: v.id("courses"),
        teacher_id: v.id("users"),
        file_id: v.id("_storage"),
        file_name: v.string(),
        file_type: v.string(), // "pdf" | "docx" | "pptx" | "xlsx"
        file_size: v.number(), // bytes
        content_text: v.string(), // Texto extraído del documento
        uploaded_at: v.number(),
    })
        .index("by_course", ["course_id"])
        .index("by_teacher", ["teacher_id"]),

    quizzes: defineTable({
        course_id: v.id("courses"),
        document_id: v.id("course_documents"),
        teacher_id: v.id("users"),
        title: v.string(),
        quiz_type: v.optional(v.string()), // "multiple_choice" | "flashcard" | "match"
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
        )), // Array de { question... } o { front, back } o { concept, definition }
        difficulty: v.string(), // "facil" | "medio" | "dificil"
        num_questions: v.number(),
        created_at: v.number(),
        is_active: v.boolean(),
        max_attempts: v.optional(v.number()), // Si es null o no existe, asumimos ilimitado o 1. Por defecto pondremos 1.
    })
        .index("by_course", ["course_id"])
        .index("by_document", ["document_id"]),

    notifications: defineTable({
        user_id: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.string(), // "transfer_request", "achievement", "system"
        read: v.boolean(),
        related_id: v.optional(v.string()), // ID de la solicitud u otro objeto
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    point_transfer_requests: defineTable({
        user_id: v.id("users"),
        from_course_id: v.id("courses"),
        to_course_id: v.id("courses"),
        amount: v.number(),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
        approval_source: v.boolean(), // Aprobado por el docente de origen
        approval_target: v.boolean(), // Aprobado por el docente de destino
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_from_course_status", ["from_course_id", "status"])
        .index("by_to_course_status", ["to_course_id", "status"]),

    quiz_submissions: defineTable({
        quiz_id: v.id("quizzes"),
        user_id: v.id("users"),
        score: v.number(),
        earned_points: v.number(),
        completed_at: v.number(),
    })
        .index("by_quiz", ["quiz_id"])
        .index("by_user", ["user_id"])
        .index("by_quiz_user", ["quiz_id", "user_id"]),
});
