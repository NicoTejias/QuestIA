import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

// Función auxiliar para calcular distancia entre dos puntos (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metros
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // en metros
}

export const createSession = mutation({
    args: {
        course_id: v.id("courses"),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        radius: v.optional(v.number()),
        duration_minutes: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const course = await ctx.db.get(args.course_id);
        if (!course || course.teacher_id !== user._id) throw new Error("No autorizado");

        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const now = Date.now();
        const duration = args.duration_minutes || 10;
        const expires_at = now + (duration * 60 * 1000);

        // Desactivar sesiones anteriores del mismo curso
        const oldSessions = await ctx.db
            .query("attendance_sessions")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        for (const s of oldSessions) {
            await ctx.db.patch(s._id, { status: "expired" });
        }

        return await ctx.db.insert("attendance_sessions", {
            course_id: args.course_id,
            teacher_id: user._id,
            code,
            lat: args.lat,
            lng: args.lng,
            radius: args.radius || 100, // 100 metros por defecto para interiores
            expires_at,
            created_at: now,
            status: "active",
        });
    },
});

export const getActiveSession = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("attendance_sessions")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .order("desc")
            .first();

        if (!session) return null;
        if (Date.now() > session.expires_at) return null;

        return session;
    },
});

export const checkIn = mutation({
    args: {
        course_id: v.id("courses"),
        code: v.string(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        
        const session = await ctx.db
            .query("attendance_sessions")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .order("desc")
            .first();

        if (!session || Date.now() > session.expires_at) {
            throw new Error("No hay una sesión de asistencia activa.");
        }

        if (session.code !== args.code) {
            throw new Error("Código de asistencia incorrecto.");
        }

        // Verificar si ya marcó asistencia
        const existing = await ctx.db
            .query("attendance_logs")
            .withIndex("by_user_session", (q) => q.eq("user_id", user._id).eq("session_id", session._id))
            .unique();

        if (existing) throw new Error("Ya has registrado tu asistencia.");

        let distance: number | undefined;
        
        // Validación Geográfica (Geofencing)
        if (session.lat && session.lng && args.lat && args.lng) {
            distance = getDistance(session.lat, session.lng, args.lat, args.lng);
            if (distance > (session.radius || 100)) {
                throw new Error("Parece que no estás en el aula. Debes estar presente para marcar asistencia.");
            }
        } else if (session.lat && session.lng && (!args.lat || !args.lng)) {
            throw new Error("Se requiere activar el GPS para verificar tu ubicación en el aula.");
        }

        await ctx.db.insert("attendance_logs", {
            session_id: session._id,
            user_id: user._id,
            timestamp: Date.now(),
            lat: args.lat,
            lng: args.lng,
            distance,
        });


        // Recompensa: +2 puntos por asistir
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .unique();

        if (enrollment) {
            await ctx.db.patch(enrollment._id, {
                total_points: (enrollment.total_points || 0) + 2,
                ranking_points: (enrollment.ranking_points || 0) + 2,
                spendable_points: (enrollment.spendable_points || 0) + 2
            });
        }

        return { success: true, distance };
    },
});

export const getSessionLogs = query({
    args: { session_id: v.id("attendance_sessions") },
    handler: async (ctx, args) => {
        await requireTeacher(ctx);
        const logs = await ctx.db
            .query("attendance_logs")
            .withIndex("by_session", (q) => q.eq("session_id", args.session_id))
            .collect();

        return await Promise.all(logs.map(async (l) => {
            const student = await ctx.db.get(l.user_id);
            return {
                ...l,
                student_name: student?.name || "Desconocido",
                student_id: student?.student_id || "S/I"
            };
        }));
    },
});
