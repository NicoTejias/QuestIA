import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Crear un nuevo ramo
export const createCourse = mutation({
    args: { name: v.string(), code: v.string(), description: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (!user || user.role !== "teacher")
            throw new Error("Solo docentes pueden crear ramos");

        return await ctx.db.insert("courses", {
            name: args.name,
            code: args.code,
            description: args.description,
            teacher_id: userId,
        });
    },
});

// Subir lista blanca de alumnos
export const batchUploadWhitelist = mutation({
    args: { course_id: v.id("courses"), identifiers: v.array(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const user = await ctx.db.get(userId);
        if (!user || user.role !== "teacher")
            throw new Error("Solo docentes pueden cargar whitelists");

        // Verificar que el curso pertenezca al docente
        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== userId)
            throw new Error("No autorizado para este ramo");

        let added = 0;
        for (const iden of args.identifiers) {
            const sanitized = iden.trim();
            if (!sanitized || sanitized.length < 3) continue;

            const existing = await ctx.db
                .query("whitelists")
                .withIndex("by_identifier", (q) => q.eq("student_identifier", sanitized))
                .filter((q) => q.eq(q.field("course_id"), args.course_id))
                .unique();

            if (!existing) {
                await ctx.db.insert("whitelists", {
                    course_id: args.course_id,
                    student_identifier: sanitized,
                });
                added++;
            }
        }

        return { added };
    },
});

// Obtener ramos de un alumno con puntos
export const getMyCourses = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (!user) return [];

        // Si es docente, devolver sus propios ramos
        if (user.role === "teacher") {
            return await ctx.db
                .query("courses")
                .withIndex("by_teacher", (q) => q.eq("teacher_id", userId))
                .collect();
        }

        // Si es alumno, devolver ramos en los que está inscrito
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .collect();

        const courses = [];
        for (const en of enrollments) {
            const course = await ctx.db.get(en.course_id);
            if (course) courses.push({ ...course, total_points: en.total_points });
        }
        return courses;
    },
});

// Obtener estado de inscripción de un alumno en un ramo
export const getEnrollmentStatus = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .unique();
    },
});

// Obtener alumnos de un ramo (para docentes)
export const getCourseStudents = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        const students = [];
        for (const en of enrollments) {
            const user = await ctx.db.get(en.user_id);
            if (user) {
                students.push({
                    _id: user._id,
                    name: user.name || "Sin nombre",
                    email: user.email,
                    student_id: user.student_id,
                    total_points: en.total_points,
                    belbin: user.belbin_profile?.role_dominant || "Sin determinar",
                });
            }
        }
        return students;
    },
});
