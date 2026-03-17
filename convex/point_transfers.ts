import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";
import { pushNotification } from "./notifications";

// Obtener todas las solicitudes que el docente actual debe revisar
export const getPendingForTeacher = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireTeacher(ctx);
            const userId = user._id;

            // 1. Obtener los cursos del docente (o todos si es admin)
            const courses = user.role === "admin"
                ? await ctx.db.query("courses").collect()
                : await ctx.db
                    .query("courses")
                    .withIndex("by_teacher", (q) => q.eq("teacher_id", userId))
                    .collect();
            const courseIds = new Set(courses.map(c => c._id));

            // 2. Obtener todas las pendientes para estos cursos usando los nuevos índices
            const pendingPromises = courses.flatMap(c => [
                ctx.db.query("point_transfer_requests").withIndex("by_from_course_status", q => q.eq("from_course_id", c._id).eq("status", "pending")).collect(),
                ctx.db.query("point_transfer_requests").withIndex("by_to_course_status", q => q.eq("to_course_id", c._id).eq("status", "pending")).collect()
            ]);

            const resultsArrays = await Promise.all(pendingPromises);
            const allRawPending = resultsArrays.flat();

            // Deduplicar (una solicitud puede aparecer 2 veces si el mismo profe dicta ambos ramos)
            const seenIds = new Set();
            const uniquePending = allRawPending.filter(req => {
                if (seenIds.has(req._id)) return false;
                seenIds.add(req._id);
                return true;
            });

            // 3. Filtrar las que realmente requieren mi acción (yo soy el profe del ramo que falta aprobar)
            const pendingForMe = uniquePending.filter(req => {
                const isSourceTeacher = courseIds.has(req.from_course_id);
                const isTargetTeacher = courseIds.has(req.to_course_id);
                const missingSourceDocApproval = isSourceTeacher && !req.approval_source;
                const missingTargetDocApproval = isTargetTeacher && !req.approval_target;
                return missingSourceDocApproval || missingTargetDocApproval;
            });

            if (pendingForMe.length === 0) return [];

            // 4. Batch fetching de cursos y usuarios (N+1 Optimization)
            const relevantCourseIds = new Set([...pendingForMe.map(r => r.from_course_id), ...pendingForMe.map(r => r.to_course_id)]);
            const relevantUserIds = new Set(pendingForMe.map(r => r.user_id));

            const [coursesList, usersList] = await Promise.all([
                Promise.all(Array.from(relevantCourseIds).map(id => ctx.db.get(id))),
                Promise.all(Array.from(relevantUserIds).map(id => ctx.db.get(id)))
            ]);

            const courseMap = new Map(coursesList.filter(c => c !== null).map(c => [c._id, c]));
            const userMap = new Map(usersList.filter(u => u !== null).map(u => [u._id, u]));

            const result = pendingForMe.map(req => {
                const student = userMap.get(req.user_id);
                const fromCourse = courseMap.get(req.from_course_id);
                const toCourse = courseMap.get(req.to_course_id);

                return {
                    ...req,
                    student_name: student?.name || "Anónimo",
                    student_identifier: student?.student_id || "",
                    from_course_name: fromCourse?.name || "Desconocido",
                    to_course_name: toCourse?.name || "Desconocido",
                    isSourceTeacher: courseIds.has(req.from_course_id),
                    isTargetTeacher: courseIds.has(req.to_course_id)
                };
            });

            return result.sort((a, b) => b.created_at - a.created_at);
        } catch {
            return [];
        }
    },
});

// Estudiante crea solicitud de traspaso
export const requestTransfer = mutation({
    args: {
        from_course_id: v.id("courses"),
        to_course_id: v.id("courses"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        if (args.amount <= 0) throw new Error("El monto debe ser numérico y positivo");
        if (args.from_course_id === args.to_course_id) throw new Error("Los cursos origen y destino deben ser distintos");

        // Validar que el estudiante tenga suficientes puntos disponibles
        const sourceEnrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", q => q.eq("user_id", user._id))
            .filter(q => q.eq(q.field("course_id"), args.from_course_id))
            .unique();

        if (!sourceEnrollment) throw new Error("No estás inscrito en el curso origen");
        const available = sourceEnrollment.spendable_points || sourceEnrollment.total_points || 0;

        if (available < args.amount) {
            throw new Error(`Puntos insuficientes. Tienes ${available} disponibles.`);
        }

        // Validar que esté inscrito en el curso destino
        const targetEnrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", q => q.eq("user_id", user._id))
            .filter(q => q.eq(q.field("course_id"), args.to_course_id))
            .unique();

        if (!targetEnrollment) throw new Error("No estás inscrito en el curso destino");

        // Crear solicitud
        const requestId = await ctx.db.insert("point_transfer_requests", {
            user_id: user._id,
            from_course_id: args.from_course_id,
            to_course_id: args.to_course_id,
            amount: args.amount,
            status: "pending",
            approval_source: false,
            approval_target: false,
            created_at: Date.now(),
        });

        // Descontar puntos preventivamente (en "escrow")
        await ctx.db.patch(sourceEnrollment._id, {
            spendable_points: available - args.amount,
            // no modificamos total_points ni ranking_points porque esos no bajan
        });

        // Notificar a los docentes
        const sourceCourse = await ctx.db.get(args.from_course_id);
        const targetCourse = await ctx.db.get(args.to_course_id);

        if (sourceCourse && sourceCourse.teacher_id) {
            await pushNotification(ctx, sourceCourse.teacher_id, "Nueva Solicitud de Traspaso", `Un alumno desea traspasar ${args.amount} puntos desde tu ramo ${sourceCourse.name}.`, "transfer_request", requestId);
        }
        if (targetCourse && targetCourse.teacher_id && targetCourse.teacher_id !== sourceCourse?.teacher_id) {
            await pushNotification(ctx, targetCourse.teacher_id, "Nueva Solicitud de Traspaso", `Un alumno desea traspasar ${args.amount} puntos hacia tu ramo ${targetCourse.name}.`, "transfer_request", requestId);
        }

        return requestId;
    },
});

// Docente procesa solicitud
export const processTransfer = mutation({
    args: {
        request_id: v.id("point_transfer_requests"),
        approve: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const userId = user._id;

        const req = await ctx.db.get(args.request_id);
        if (!req || req.status !== "pending") throw new Error("Solicitud no válida o ya procesada");

        const sourceCourse = await ctx.db.get(req.from_course_id);
        const targetCourse = await ctx.db.get(req.to_course_id);

        const isSourceTeacher = sourceCourse?.teacher_id === userId || user.role === "admin";
        const isTargetTeacher = targetCourse?.teacher_id === userId || user.role === "admin";

        if (!isSourceTeacher && !isTargetTeacher) {
            throw new Error("No autorizado para aprobar esta solicitud");
        }

        let newSourceApproval = req.approval_source;
        let newTargetApproval = req.approval_target;

        if (args.approve) {
            if (isSourceTeacher) newSourceApproval = true;
            if (isTargetTeacher) newTargetApproval = true;

            await ctx.db.patch(req._id, {
                approval_source: newSourceApproval,
                approval_target: newTargetApproval
            });

            // Re-check si ambos aprobaron
            if (newSourceApproval && newTargetApproval) {
                await ctx.db.patch(req._id, { status: "approved" });

                // Ejecutar transferencia real
                const targetEnrollment = await ctx.db
                    .query("enrollments")
                    .withIndex("by_user", q => q.eq("user_id", req.user_id))
                    .filter(q => q.eq(q.field("course_id"), req.to_course_id))
                    .unique();

                if (targetEnrollment) {
                    await ctx.db.patch(targetEnrollment._id, {
                        spendable_points: (targetEnrollment.spendable_points || 0) + req.amount,
                    });
                }

                await pushNotification(ctx, req.user_id, "Traspaso Aprobado", `Tus ${req.amount} puntos han sido transferidos exitosamente.`, "system");
            }
        } else {
            // Rechazo
            await ctx.db.patch(req._id, { status: "rejected" });

            // Devolver los puntos retenidos
            const sourceEnrollment = await ctx.db
                .query("enrollments")
                .withIndex("by_user", q => q.eq("user_id", req.user_id))
                .filter(q => q.eq(q.field("course_id"), req.from_course_id))
                .unique();

            if (sourceEnrollment) {
                await ctx.db.patch(sourceEnrollment._id, {
                    spendable_points: (sourceEnrollment.spendable_points || 0) + req.amount,
                });
            }

            await pushNotification(ctx, req.user_id, "Traspaso Rechazado", `Tu solicitud de ${req.amount} puntos fue rechazada. Los puntos han sido devueltos a tu cuenta original.`, "system");
        }
    },
});

import { paginationOptsValidator } from "convex/server";

export const getStudentTransfers = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        try {
            const user = await requireAuth(ctx);

            const rawReqsPaged = await ctx.db
                .query("point_transfer_requests")
                .withIndex("by_user", q => q.eq("user_id", user._id))
                .order("desc")
                .paginate(args.paginationOpts);

            const relevantCourseIds = new Set([
                ...rawReqsPaged.page.map(r => r.from_course_id),
                ...rawReqsPaged.page.map(r => r.to_course_id)
            ]);

            const coursesList = await Promise.all(
                Array.from(relevantCourseIds).map(id => ctx.db.get(id))
            );
            const courseMap = new Map(coursesList.filter(c => c !== null).map(c => [c._id, c]));

            const page = rawReqsPaged.page.map((r) => {
                const fromC = courseMap.get(r.from_course_id);
                const toC = courseMap.get(r.to_course_id);
                return {
                    ...r,
                    from_course_name: fromC?.name || "Desconocido",
                    to_course_name: toC?.name || "Desconocido",
                };
            });

            return { ...rawReqsPaged, page };
        } catch {
            return { page: [], isDone: true, continueCursor: "" };
        }
    }
});
