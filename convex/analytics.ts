import { query } from "./_generated/server";
import { requireTeacher } from "./withUser";

// Estadísticas generales de un docente
export const getTeacherStats = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireTeacher(ctx);
            const userId = user._id;

            // Obtener ramos del docente de una vez
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_teacher", (q: any) => q.eq("teacher_id", userId))
                .collect();

            const courseIds = courses.map((c) => c._id);
            if (courseIds.length === 0) {
                return {
                    totalStudents: 0, totalMissionsCompleted: 0, totalRedemptions: 0,
                    totalPoints: 0, totalCourses: 0, belbinDistribution: {}, courseStats: []
                };
            }

            // Obtener TODOS los enrollments relevantes de una vez
            // Dado que Convex indexa por curso, podemos buscar para todos los IDs
            const allEnrollmentsPromises = courseIds.map((id: any) => ctx.db.query("enrollments").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allEnrollmentsArrays = await Promise.all(allEnrollmentsPromises);
            const enrollments = allEnrollmentsArrays.flat();

            const studentIds = [...new Set(enrollments.map(e => e.user_id))];

            // Obtener a todos los estudiantes de una sola vez
            const students = await Promise.all(studentIds.map((id: any) => ctx.db.get(id)));
            const studentMap = new Map(students.filter(s => s !== null).map((s: any) => [s._id, s]));

            // Obtener TODAS las misiones de estos cursos
            const allMissionsPromises = courseIds.map((id: any) => ctx.db.query("missions").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allMissionsArrays = await Promise.all(allMissionsPromises);
            const missions = allMissionsArrays.flat();
            const missionIds = missions.map((m: any) => m._id);

            // Obtener TODAS las entregas (submissions) de todas las misiones relevantes
            const allSubmissionsPromises = missionIds.map((id: any) => ctx.db.query("mission_submissions").withIndex("by_mission", (q: any) => q.eq("mission_id", id)).collect());
            const allSubmissionsArrays = await Promise.all(allSubmissionsPromises);
            const submissions = allSubmissionsArrays.flat();

            // Obtener TODOS los documentos
            const allDocsPromises = courseIds.map((id: any) => ctx.db.query("course_documents").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allDocsArrays = await Promise.all(allDocsPromises);
            const documents = allDocsArrays.flat();

            // Obtener TODAS las recompensas del docente para luego filtrar las redenciones
            const allRewardsPromises = courseIds.map((id: any) => ctx.db.query("rewards").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allRewardsArrays = await Promise.all(allRewardsPromises);
            const rewards = allRewardsArrays.flat();
            const rewardIds = new Set(rewards.map((r: any) => r._id));

            // Obtener TODAS las canjes (redemptions) de manera eficiente usando el nuevo índice
            const allRedemptionsPromises = Array.from(rewardIds).map(rid =>
                ctx.db
                    .query("redemptions")
                    .withIndex("by_reward", q => q.eq("reward_id", rid as any))
                    .collect()
            );
            const allRedemptionsArrays = await Promise.all(allRedemptionsPromises);
            const teacherRedemptions = allRedemptionsArrays.flat();

            // Calcular Estadisticas Consolidadas
            const totalStudents = enrollments.length;
            let totalPoints = 0;
            const totalMissionsCompleted = submissions.length;
            const totalRedemptionsCount = teacherRedemptions.length;
            const belbinDistribution: Record<string, number> = {};

            // Para agrupar estudiantes unicos evitando dobles sumas si un estudiante esta en 2 ramos del profe? 
            // Normalmente enrollments son por curso, para estadísticas globales contamos 'inscripciones totales' o 'personas unicas'?
            // 'totalStudents' típicamente representa volumen de audiencia (suma de enrollments).
            const uniqueStudentBelbins = new Set<string>(); // Para evitar contar el Belbin 2 veces si el estudiante tiene 2 ramos

            for (const en of enrollments) {
                const pts = en.ranking_points ?? en.total_points ?? 0;
                totalPoints += pts;

                const student = studentMap.get(en.user_id);
                if (student && student.belbin_profile?.role_dominant) {
                    if (!uniqueStudentBelbins.has(student._id)) {
                        uniqueStudentBelbins.add(student._id);
                        const role = student.belbin_profile.role_dominant;
                        belbinDistribution[role] = (belbinDistribution[role] || 0) + 1;
                    }
                }
            }

            const courseStats = courseIds.map((courseId: any) => {
                const course = courses.find((c: any) => c._id === courseId);
                const courseEnrollments = enrollments.filter((e: any) => e.course_id === courseId);
                const courseMissions = missions.filter((m: any) => m.course_id === courseId);
                const courseMissionIds = new Set(courseMissions.map((m: any) => m._id));
                const courseSubmissions = submissions.filter((s: any) => courseMissionIds.has(s.mission_id));
                const courseDocs = documents.filter((d: any) => d.course_id === courseId);

                const coursePoints = courseEnrollments.reduce((sum: number, e: any) => sum + (e.ranking_points ?? e.total_points ?? 0), 0);

                return {
                    name: course?.name || "",
                    code: course?.code || "",
                    students: courseEnrollments.length,
                    missions: courseMissions.length,
                    submissions: courseSubmissions.length,
                    documents: courseDocs.length,
                    totalPoints: coursePoints,
                }
            });

            return {
                totalStudents,
                totalMissionsCompleted,
                totalRedemptions: totalRedemptionsCount,
                totalPoints,
                totalCourses: courses.length,
                belbinDistribution,
                courseStats,
            };
        } catch {
            return null;
        }
    },
});
