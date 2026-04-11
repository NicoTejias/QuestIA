import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { pushNotification } from "./notifications";

// ─── Job: Alertas de retención (Lunes 08:00 AM CL) ──────────────────────────
// Detecta alumnos inactivos y notifica tanto al alumno como dispara el
// reporte semanal a los coordinadores de carrera vía email.

export const checkRetentionAlerts = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const FiveDaysMs = 5 * 24 * 60 * 60 * 1000;
        const TenDaysMs = 10 * 24 * 60 * 60 * 1000;
        const FourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

        // Notificar a alumnos en riesgo (incentivo de regreso)
        const students = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "student"))
            .collect();

        for (const student of students) {
            const lastActivity = student.last_daily_bonus_at || 0;
            const inactivityMs = now - lastActivity;

            let riskLevel: "low" | "medium" | "high" | null = null;
            if (inactivityMs >= FourteenDaysMs) riskLevel = "high";
            else if (inactivityMs >= TenDaysMs) riskLevel = "medium";
            else if (inactivityMs >= FiveDaysMs) riskLevel = "low";

            if (riskLevel) {
                await pushNotification(
                    ctx,
                    student._id,
                    "🚨 ¡Te extrañamos en QuestIA!",
                    "Llevas varios días sin actividad. ¡Vuelve hoy para mantener tu racha!",
                    "system"
                );
            }
        }

        // Disparar reporte semanal a coordinadores por email
        await ctx.scheduler.runAfter(0, internal.reports.sendWeeklyCoordinatorReports, {});

        return { success: true, studentsChecked: students.length };
    },
});

// ─── Job: Reporte mensual a jefes de carrera (1° día del mes, 08:00 AM CL) ──

export const sendMonthlyReports = internalMutation({
    args: {},
    handler: async (ctx) => {
        await ctx.scheduler.runAfter(0, internal.reports.sendMonthlyDirectorReports, {});
        return { triggered: true };
    },
});

// ─── Job: Recordatorio diario a docentes para subir documentos (08:30 AM CL) ─

export const sendDocumentUploadReminder = internalMutation({
    args: {},
    handler: async (ctx) => {
        const teachers = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "teacher"))
            .collect();

        for (const teacher of teachers) {
            await pushNotification(
                ctx,
                teacher._id,
                "📄 Recordatorio: Sube tus documentos",
                "Recuerda subir los documentos de la semana a tus ramos. ¡Mantén todo al día!",
                "document_reminder"
            );
        }

        return { success: true, teachersNotified: teachers.length };
    },
});

// ─── Definición de crons ─────────────────────────────────────────────────────

const crons = cronJobs();

// Cada lunes 08:00 AM CL: alertas de retención + reporte semanal coordinadores
crons.weekly(
    "weekly-retention-and-coordinator-report",
    { dayOfWeek: "monday", hourUTC: 12, minuteUTC: 0 },
    internal.crons.checkRetentionAlerts
);

// 1° de cada mes 08:00 AM CL: reporte mensual a jefes de carrera
crons.monthly(
    "monthly-director-report",
    { day: 1, hourUTC: 12, minuteUTC: 0 },
    internal.crons.sendMonthlyReports
);

// Diariamente 09:00 AM CL: recordatorios de evaluaciones próximas
crons.daily(
    "daily-evaluation-reminders",
    { hourUTC: 13, minuteUTC: 0 },
    internal.evaluaciones.sendEvaluationReminders
);

// Diariamente 07:00 AM CL: sincronizar whitelists desde Google Sheets vinculados
crons.daily(
    "daily-sheets-whitelist-sync",
    { hourUTC: 11, minuteUTC: 0 },
    internal.sheets_sync.syncAllLinkedCourses
);

// Diariamente 08:30 AM CL: recordatorio a docentes para subir documentos
crons.daily(
    "daily-document-upload-reminder",
    { hourUTC: 12, minuteUTC: 30 },
    internal.crons.sendDocumentUploadReminder
);

// Diariamente limpieza de demos
crons.daily(
    "daily-demo-cleanup",
    { hourUTC: 8, minuteUTC: 0 },
    internal.users.deleteExpiredDemos
);

export default crons;
