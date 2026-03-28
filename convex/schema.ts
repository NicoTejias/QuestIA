import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,
    
    admins: defineTable({
        email: v.string(),
        created_at: v.number(),
        created_by: v.id("users"),
    })
        .index("by_email", ["email"]),
        
    course_groups: defineTable({
        course_id: v.id("courses"),
        name: v.string(),
        created_at: v.number(),
        created_by: v.id("users"),
        expires_at: v.optional(v.number()),
    })
        .index("by_course", ["course_id"]),
        
    rate_limits: defineTable({
        user_id: v.id("users"),
        action: v.string(), // "quiz_submit", "auto_enroll", "feedback_submit"
        last_action_at: v.number(),
    })
        .index("by_user_action", ["user_id", "action"]),
        
    // Override the users table to include our custom fields
    users: defineTable({
        // Campos requeridos por Convex Auth / Clerk Sync
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        
        // ID de Clerk para vinculación
        clerkId: v.optional(v.string()), 

        // Campos personalizados de GestiónDocente
        role: v.optional(v.string()),  // "student" | "teacher" | "admin"
        is_verified: v.optional(v.boolean()),
        student_id: v.optional(v.string()), // RUT o Matrícula
        last_daily_bonus_at: v.optional(v.number()), // Timestamp del último bono diario
        daily_streak: v.optional(v.number()), // Días de racha de quizzes diarios
        ice_cubes: v.optional(v.number()), // Cantidad de "Congelar Racha" disponibles
        push_token: v.optional(v.string()), // Token para notificaciones push (FCM/WebPush)
        last_notified_streak_at: v.optional(v.number()), // Evita duplicar avisos de racha
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
        // Perfil de jugador (Bartle)
        bartle_profile: v.optional(v.union(
            v.literal("achiever"), 
            v.literal("socializer"), 
            v.literal("explorer"), 
            v.literal("competidor"),
            v.literal("killer")
        )),
        avatarUrl: v.optional(v.string()),
    })
        .index("email", ["email"])
        .index("by_student_id", ["student_id"])
        .index("by_clerk_id", ["clerkId"]),

    courses: defineTable({
        name: v.string(),
        code: v.string(),
        teacher_id: v.id("users"),
        career_id: v.optional(v.id("careers")),
        description: v.string(),
    })
        .index("by_teacher", ["teacher_id"])
        .index("by_code", ["code"])
        .index("by_name", ["name"]),

    whitelists: defineTable({
        course_id: v.id("courses"),
        student_identifier: v.string(), // RUT o Correo
        student_name: v.optional(v.string()), // Nombre (opcional, para visualización antes de registro)
        section: v.optional(v.string()), // Sección del ramo (ej. "Sección 1")
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
        section: v.optional(v.string()), // Sección del ramo (copiado desde whitelist al registrarse)
        active_multiplier: v.optional(v.number()), // Multiplicador para el próximo quiz
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
        narrative: v.optional(v.string()), // Contexto inmersivo de la misión
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
        is_master_doc: v.optional(v.boolean()), // Indicar si es un documento maestro (PDA, PIA, PA)
        master_doc_type: v.optional(v.union(
            v.literal("PDA"), 
            v.literal("PIA"), 
            v.literal("PA")
        )),
    })
        .index("by_course", ["course_id"])
        .index("by_teacher", ["teacher_id"]),

    quizzes: defineTable({
        course_id: v.id("courses"),
        document_id: v.id("course_documents"),
        teacher_id: v.id("users"),
        title: v.string(),
        quiz_type: v.union(v.literal("multiple_choice"), v.literal("match"), v.literal("flashcard"), v.literal("true_false"), v.literal("fill_blank"), v.literal("order_steps"), v.literal("trivia"), v.literal("word_search"), v.literal("quiz_sprint"), v.literal("memory")),
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
                question: v.string(),
                options: v.array(v.string()),
                correct: v.number(),
                fun_fact: v.optional(v.string()),
            }),
            v.object({
                words: v.array(v.string()),
                size: v.optional(v.number()),
            }),
            v.object({
                question: v.string(),
                options: v.array(v.string()),
                correct: v.number(),
                time_limit: v.optional(v.number()),
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
        created_at: v.number(),
        is_active: v.boolean(),
        max_attempts: v.optional(v.number()),
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

    messages: defineTable({
        course_id: v.id("courses"),
        user_id: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("system")),
        created_at: v.number(),
    })
        .index("by_course", ["course_id"])
        .index("by_course_time", ["course_id", "created_at"]),

    attendance_sessions: defineTable({
        course_id: v.id("courses"),
        teacher_id: v.id("users"),
        code: v.string(), // Código de 6 dígitos
        lat: v.optional(v.number()), // Ubicación del aula
        lng: v.optional(v.number()),
        radius: v.optional(v.number()), // Radio permitido en metros
        expires_at: v.number(),
        created_at: v.number(),
        status: v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled")),
    }).index("by_course", ["course_id"]),

    attendance_logs: defineTable({
        session_id: v.id("attendance_sessions"),
        user_id: v.id("users"),
        timestamp: v.number(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        distance: v.optional(v.number()),
    }).index("by_session", ["session_id"])
      .index("by_user_session", ["user_id", "session_id"]),

    badges: defineTable({
        course_id: v.id("courses"),
        name: v.string(),
        description: v.string(),
        icon: v.string(), // Emoji o ID de asset
        criteria_type: v.string(), // "attendance", "improvement", "social", "mastery"
        criteria_value: v.optional(v.number()),
    }).index("by_course", ["course_id"]),

    user_badges: defineTable({
        user_id: v.id("users"),
        badge_id: v.id("badges"),
        course_id: v.id("courses"),
        earned_at: v.number(),
    }).index("by_user_course", ["user_id", "course_id"])
      .index("by_badge", ["badge_id"]),

    quiz_attempts: defineTable({
        quiz_id: v.id("quizzes"),
        user_id: v.id("users"),
        current_question_index: v.number(),
        selected_options: v.array(v.union(v.number(), v.null(), v.array(v.number()), v.array(v.string()))),
        status: v.union(v.literal("in_progress"), v.literal("completed")),
        last_updated: v.number(),
    })
    .index("by_quiz_user", ["quiz_id", "user_id"])
    .index("by_user_status", ["user_id", "status"]),

    feedback: defineTable({
        user_id: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("opinion")),
        created_at: v.number(),
        page_url: v.optional(v.string()),
    }).index("by_user", ["user_id"]),

    grading_rubrics: defineTable({
        course_id: v.id("courses"),
        teacher_id: v.id("users"),
        title: v.string(),
        content_text: v.string(), // Texto de la pauta/rúbrica
        created_at: v.number(),
    }).index("by_course", ["course_id"]),

    grading_results: defineTable({
        rubric_id: v.id("grading_rubrics"),
        teacher_id: v.id("users"),
        student_name: v.string(),
        file_name: v.string(),
        feedback: v.string(), // Feedback de la IA
        score: v.number(), // Nota sugerida (1-7 o 0-100)
        created_at: v.number(),
    }).index("by_rubric", ["rubric_id"]),

faqs: defineTable({
        question: v.string(),
        answer: v.string(),
        order: v.number(),
        category: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_order", ["order"]),

    evaluaciones: defineTable({
        course_id: v.id("courses"),
        teacher_id: v.id("users"),
        titulo: v.string(),
        tipo: v.union(v.literal("prueba"), v.literal("trabajo"), v.literal("informe")),
        descripcion: v.optional(v.string()),
        fecha: v.number(),
        hora: v.optional(v.string()),
        puntos: v.optional(v.number()),
        section: v.optional(v.string()),
        activo: v.boolean(),
        created_at: v.number(),
    })
        .index("by_course", ["course_id"])
        .index("by_fecha", ["fecha"])
        .index("by_teacher", ["teacher_id"]),

    institution_config: defineTable({
        key: v.string(),
        value: v.string(),
        updated_at: v.number(),
        updated_by: v.optional(v.id("users")),
    })
        .index("by_key", ["key"]),

    careers: defineTable({
        name: v.string(),
        coordinator_email: v.string(),
        director_email: v.string(),
        jefe_admin_email: v.optional(v.string()), // Puede ser compartido entre carreras
        created_at: v.number(),
    })
        .index("by_name", ["name"]),
});
