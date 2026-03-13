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
                    totalStudents: 0, 
                    totalUniqueStudents: 0,
                    totalMissionsCompleted: 0, 
                    totalRedemptions: 0,
                    totalPoints: 0, 
                    totalCourses: 0, 
                    totalMissionsCreated: 0,
                    avgQuizScore: 0,
                    avgMissionsPerStudent: 0,
                    totalDocuments: 0,
                    belbinDistribution: {}, 
                    courseStats: []
                };
            }

            // Obtener TODOS los enrollments relevantes de una vez
            const allEnrollmentsPromises = courseIds.map((id: any) => ctx.db.query("enrollments").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allEnrollmentsArrays = await Promise.all(allEnrollmentsPromises);
            const enrollments = allEnrollmentsArrays.flat();

            const studentIds = [...new Set(enrollments.map(e => e.user_id))];

            // Obtener a todos los estudiantes de una sola vez
            const students = await Promise.all(studentIds.map((id: any) => ctx.db.get(id)));
            const studentMap = new Map(students.filter(s => s !== null).map((s: any) => [s!._id, s!]));

            // Obtener TODAS las misiones manuales de estos cursos
            const allMissionsPromises = courseIds.map((id: any) => ctx.db.query("missions").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allMissionsArrays = await Promise.all(allMissionsPromises);
            const missions = allMissionsArrays.flat();
            const missionIds = missions.map((m: any) => m._id);

            // Obtener TODOS los quizzes (misiones IA) de estos cursos
            const allQuizzesPromises = courseIds.map((id: any) => ctx.db.query("quizzes").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allQuizzesArrays = await Promise.all(allQuizzesPromises);
            const quizzes = allQuizzesArrays.flat();
            const quizIds = quizzes.map((q: any) => q._id);

            // Obtener TODAS las entregas (submissions) de todas las misiones relevantes
            const allSubmissionsPromises = missionIds.map((id: any) => ctx.db.query("mission_submissions").withIndex("by_mission", (q: any) => q.eq("mission_id", id)).collect());
            const allSubmissionsArrays = await Promise.all(allSubmissionsPromises);
            const submissions = allSubmissionsArrays.flat();

            // Obtener TODAS las entregas de quizzes
            const allQuizSubmissionsPromises = quizIds.map((id: any) => ctx.db.query("quiz_submissions").withIndex("by_quiz", (q: any) => q.eq("quiz_id", id)).collect());
            const allQuizSubmissionsArrays = await Promise.all(allQuizSubmissionsPromises);
            const quizSubmissions = allQuizSubmissionsArrays.flat();

            // Obtener TODOS los documentos
            const allDocsPromises = courseIds.map((id: any) => ctx.db.query("course_documents").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allDocsArrays = await Promise.all(allDocsPromises);
            const documents = allDocsArrays.flat();

            // Obtener TODAS las recompensas del docente para luego filtrar las redenciones
            const allRewardsPromises = courseIds.map((id: any) => ctx.db.query("rewards").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allRewardsArrays = await Promise.all(allRewardsPromises);
            const rewards = allRewardsArrays.flat();
            const rewardIds = new Set(rewards.map((r: any) => r._id));

            // Obtener TODAS las canjes (redemptions)
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
            const totalUniqueStudents = studentIds.length;
            let totalPoints = 0;
            const totalMissionsCompleted = submissions.length + quizSubmissions.length;
            const totalRedemptionsCount = teacherRedemptions.length;
            const totalMissionsCreated = missions.length + quizzes.length;
            const totalDocuments = documents.length;
            
            // Promedio de Quiz
            const avgQuizScore = quizSubmissions.length > 0
                ? quizSubmissions.reduce((sum, s) => sum + s.score, 0) / quizSubmissions.length
                : 0;

            // Promedio de Misiones por Alumno
            const avgMissionsPerStudent = totalStudents > 0
                ? totalMissionsCompleted / totalStudents
                : 0;

            const belbinDistribution: Record<string, number> = {};
            const uniqueStudentBelbins = new Set<string>();

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

            // Agrupar estadísticas por nombre de ramo (Fusión multicarreara)
            const statsByName = new Map<string, any>();

            for (const courseId of courseIds) {
                const course = courses.find((c: any) => c._id === courseId);
                if (!course) continue;

                const courseEnrollments = enrollments.filter((e: any) => e.course_id === courseId);
                const courseMissions = missions.filter((m: any) => m.course_id === courseId);
                const courseQuizzes = quizzes.filter((q: any) => q.course_id === courseId);
                
                const courseMissionIds = new Set(courseMissions.map((m: any) => m._id));
                const courseQuizIds = new Set(courseQuizzes.map((q: any) => q._id));
                
                const courseSubmissions = submissions.filter((s: any) => courseMissionIds.has(s.mission_id));
                const courseQuizSubmissions = quizSubmissions.filter((s: any) => courseQuizIds.has(s.quiz_id));
                
                const courseDocs = documents.filter((d: any) => d.course_id === courseId);
                const coursePoints = courseEnrollments.reduce((sum: number, e: any) => sum + (e.ranking_points ?? e.total_points ?? 0), 0);

                const existing = statsByName.get(course.name);
                if (existing) {
                    existing.students += courseEnrollments.length;
                    existing.missions += courseMissions.length + courseQuizzes.length;
                    existing.submissions += courseSubmissions.length + courseQuizSubmissions.length;
                    existing.documents += courseDocs.length;
                    existing.totalPoints += coursePoints;
                    // Mantenemos el código del primero o una lista? Un string concatenado es útil si son pocos
                    if (!existing.code.includes(course.code)) {
                        existing.code += ` / ${course.code}`;
                    }
                } else {
                    statsByName.set(course.name, {
                        name: course.name,
                        code: course.code,
                        students: courseEnrollments.length,
                        missions: courseMissions.length + courseQuizzes.length,
                        submissions: courseSubmissions.length + courseQuizSubmissions.length,
                        documents: courseDocs.length,
                        totalPoints: coursePoints,
                    });
                }
            }

            const courseStats = Array.from(statsByName.values());

            return {
                totalStudents,
                totalUniqueStudents,
                totalMissionsCompleted,
                totalRedemptions: totalRedemptionsCount,
                totalPoints,
                totalCourses: courses.length,
                totalMissionsCreated,
                avgQuizScore,
                avgMissionsPerStudent,
                totalDocuments,
                belbinDistribution,
                courseStats,
            };
        } catch (e) {
            console.error("Error in getTeacherStats:", e);
            return null;
        }
    },
});

