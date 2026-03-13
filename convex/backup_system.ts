import { query } from "./_generated/server";

/**
 * Realiza un respaldo de seguridad de todos los enrolamientos y puntos actuales
 * antes de proceder con la recarga de las listas de Blackboard.
 */
export const backupCurrentPoints = query({
    args: {},
    handler: async (ctx) => {
        const enrollments = await ctx.db.query("enrollments").collect();
        const users = await ctx.db.query("users").collect();
        const courses = await ctx.db.query("courses").collect();

        const userMap = new Map();
        users.forEach(u => userMap.set(u._id, { name: u.name, student_id: u.student_id, email: u.email }));

        const courseMap = new Map();
        courses.forEach(c => courseMap.set(c._id, { name: c.name, code: c.code }));

        const backup = enrollments.map(en => ({
            enrollment_id: en._id,
            user_id: en.user_id,
            student_name: userMap.get(en.user_id)?.name || "Desconocido",
            student_id: userMap.get(en.user_id)?.student_id || "S/R",
            course_name: courseMap.get(en.course_id)?.name || "Desconocido",
            course_id: en.course_id,
            points: {
                ranking: en.ranking_points || 0,
                spendable: en.spendable_points || 0,
                total: en.total_points || 0
            },
            section: en.section
        }));

        return {
            timestamp: new Date().toISOString(),
            total_records: backup.length,
            records: backup
        };
    }
});
