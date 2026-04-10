import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { pushNotification } from "./notifications";

// Solicitar transferencia de puntos entre ramos
export const requestTransfer = mutation({
    args: {
        from_course_id: v.id("courses"),
        to_course_id: v.id("courses"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        if (args.from_course_id === args.to_course_id) {
            throw new Error("No puedes transferir puntos al mismo ramo");
        }

        // Verificar saldo en ramo origen
        const sourceEnrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("course_id"), args.from_course_id))
            .unique();

        if (!sourceEnrollment) throw new Error("No estás inscrito en el ramo de origen");

        const spendable = sourceEnrollment.spendable_points ?? sourceEnrollment.total_points ?? 0;
        if (spendable < args.amount) throw new Error("Saldo insuficiente en el ramo de origen");

        // Crear solicitud
        const requestId = await ctx.db.insert("point_transfer_requests", {
            user_id: userId,
            from_course_id: args.from_course_id,
            to_course_id: args.to_course_id,
            amount: args.amount,
            status: "pending",
            approval_source: false,
            approval_target: false,
            created_at: Date.now(),
        });

        // Notificar a los docentes involucrados
        const sourceCourse = await ctx.db.get(args.from_course_id);
        const targetCourse = await ctx.db.get(args.to_course_id);
        const user = await ctx.db.get(userId);

        if (sourceCourse) {
            await pushNotification(
                ctx,
                sourceCourse.teacher_id,
                "Solicitud de Transferencia (Origen)",
                `El alumno ${user?.name} desea transferir ${args.amount} puntos desde ${sourceCourse.name}.`,
                "transfer_request",
                requestId
            );
        }

        if (targetCourse && targetCourse.teacher_id !== sourceCourse?.teacher_id) {
            await pushNotification(
                ctx,
                targetCourse.teacher_id,
                "Solicitud de Transferencia (Destino)",
                `El alumno ${user?.name} desea recibir ${args.amount} puntos en ${targetCourse.name}.`,
                "transfer_request",
                requestId
            );
        }

        return requestId;
    },
});

// Obtener solicitudes pendientes para un docente
export const getPendingTransfersForTeacher = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const myCourses = await ctx.db
            .query("courses")
            .withIndex("by_teacher", (q) => q.eq("teacher_id", userId))
            .collect();
        const myCourseIds = myCourses.map(c => c._id);

        if (myCourseIds.length === 0) return [];

        // Esto es un poco ineficiente en Convex sin índices complejos, pero para pocos ramos está ok
        const allRequests = await ctx.db.query("point_transfer_requests").filter(q => q.eq(q.field("status"), "pending")).collect();

        const filtered = [];
        for (const req of allRequests) {
            const isSource = myCourseIds.includes(req.from_course_id);
            const isTarget = myCourseIds.includes(req.to_course_id);

            if (isSource || isTarget) {
                const student = await ctx.db.get(req.user_id);
                const fromCourse = await ctx.db.get(req.from_course_id);
                const toCourse = await ctx.db.get(req.to_course_id);

                filtered.push({
                    ...req,
                    student_name: student?.name,
                    from_course_name: fromCourse?.name,
                    to_course_name: toCourse?.name,
                    is_source_teacher: isSource,
                    is_target_teacher: isTarget
                });
            }
        }
        return filtered;
    },
});

// Aprobar solicitud
export const approveTransfer = mutation({
    args: { request_id: v.id("point_transfer_requests") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const req = await ctx.db.get(args.request_id);
        if (!req || req.status !== "pending") throw new Error("Solicitud no válida");

        const fromCourse = await ctx.db.get(req.from_course_id);
        const toCourse = await ctx.db.get(req.to_course_id);

        const isSourceTeacher = fromCourse?.teacher_id === userId;
        const isTargetTeacher = toCourse?.teacher_id === userId;

        if (!isSourceTeacher && !isTargetTeacher) throw new Error("No autorizado");

        let nextApprovalSource = req.approval_source || isSourceTeacher;
        let nextApprovalTarget = req.approval_target || isTargetTeacher;

        // Si el mismo docente es dueño de ambos ramos, se aprueba automáticamente de ambos lados
        if (fromCourse?.teacher_id === toCourse?.teacher_id) {
            nextApprovalSource = true;
            nextApprovalTarget = true;
        }

        if (nextApprovalSource && nextApprovalTarget) {
            // EJECUTAR TRANSFERENCIA
            const sourceEnroll = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", req.user_id))
                .filter((q) => q.eq(q.field("course_id"), req.from_course_id))
                .unique();

            const targetEnroll = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", req.user_id))
                .filter((q) => q.eq(q.field("course_id"), req.to_course_id))
                .unique();

            if (!sourceEnroll || !targetEnroll) throw new Error("Enrollments no encontrados");

            const currentSourceSpendable = sourceEnroll.spendable_points ?? sourceEnroll.total_points ?? 0;
            if (currentSourceSpendable < req.amount) throw new Error("El alumno ya no tiene puntos suficientes");

            // Restar de origen
            await ctx.db.patch(sourceEnroll._id, {
                spendable_points: currentSourceSpendable - req.amount,
                // NO restamos de ranking_points, el ranking de origen se mantiene
            });

            // Sumar a destino
            await ctx.db.patch(targetEnroll._id, {
                spendable_points: (targetEnroll.spendable_points ?? targetEnroll.total_points ?? 0) + req.amount,
                ranking_points: (targetEnroll.ranking_points ?? targetEnroll.total_points ?? 0) + req.amount,
                total_points: (targetEnroll.total_points || 0) + req.amount,
            });

            await ctx.db.patch(req._id, {
                status: "approved",
                approval_source: true,
                approval_target: true
            });

            // Notificar al alumno (DB + push FCM)
            await pushNotification(
                ctx,
                req.user_id,
                "Transferencia Aprobada",
                `Se han transferido ${req.amount} puntos de ${fromCourse?.name} a ${toCourse?.name}.`,
                "transfer_approved"
            );

        } else {
            await ctx.db.patch(req._id, {
                approval_source: nextApprovalSource,
                approval_target: nextApprovalTarget
            });
        }
    },
});

export const rejectTransfer = mutation({
    args: { request_id: v.id("point_transfer_requests") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("No autenticado");

        const req = await ctx.db.get(args.request_id);
        if (!req) throw new Error("No encontrada");

        const fromCourse = await ctx.db.get(req.from_course_id);
        const toCourse = await ctx.db.get(req.to_course_id);

        if (fromCourse?.teacher_id !== userId && toCourse?.teacher_id !== userId)
            throw new Error("No autorizado");

        await ctx.db.patch(req._id, { status: "rejected" });

        await pushNotification(
            ctx,
            req.user_id,
            "Transferencia Rechazada",
            `Tu solicitud de transferencia de ${req.amount} puntos fue rechazada por un docente.`,
            "transfer_rejected"
        );
    }
});
