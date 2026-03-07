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
        belbin_profile: v.optional(v.object({
            role_dominant: v.string(),
            category: v.string(),
            scores: v.any(),
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
        student_identifier: v.string(),
    })
        .index("by_course", ["course_id"])
        .index("by_identifier", ["student_identifier"]),

    enrollments: defineTable({
        user_id: v.id("users"),
        course_id: v.id("courses"),
        total_points: v.number(),
        group_id: v.optional(v.string()),
    })
        .index("by_user", ["user_id"])
        .index("by_course", ["course_id"]),

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
    }).index("by_user", ["user_id"]),
});
