import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireTeacher } from "./withUser";
import { normalizeRut } from "./rutUtils";

// Estadísticas generales de un docente
export const getTeacherStats = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireTeacher(ctx);
            const userId = user._id;

            // Obtener ramos del docente de una vez
            const courses = user.role === "admin"
                ? await ctx.db.query("courses").collect()
                : await ctx.db
                    .query("courses")
                    .withIndex("by_teacher", (q: any) => q.eq("teacher_id", userId))
                    .collect();

            const courseIds = courses.map((c) => c._id);
            if (courseIds.length === 0) {
                return {
                    totalStudents: 0, 
                    totalUniqueStudents: 0,
                    totalRegisteredUniqueUsers: 0,
                    totalMissionsCompleted: 0, 
                    totalQuizzesCompleted: 0,
                    totalRedemptions: 0,
                    totalPoints: 0, 
                    totalCourses: 0, 
                    totalMissionsCreated: 0,
                    avgQuizScore: 0,
                    avgMissionsPerStudent: 0,
                    totalDocuments: 0,
                    totalDocumentsUploaded: 0,
                    totalMasterDocs: 0,
                    belbinDistribution: {}, 
                    courseStats: [],
                    topStudents: [],
                    dailyActivity: []
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
            
            // Obtener TODOS los intentos de quizzes (actividad reciente incluso si no terminan)
            const allQuizAttemptsPromises = quizIds.map((id: any) => ctx.db.query("quiz_attempts").withIndex("by_quiz_user", (q: any) => q.eq("quiz_id", id)).collect());
            const allQuizAttemptsArrays = await Promise.all(allQuizAttemptsPromises);
            const quizAttempts = allQuizAttemptsArrays.flat();

            // Obtener TODAS las entradas de whitelist para un conteo preciso
            const allWhitelistPromises = courseIds.map((id: any) => ctx.db.query("whitelists").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allWhitelistArrays = await Promise.all(allWhitelistPromises);
            const allWhitelistEntries = allWhitelistArrays.flat();

            // (Restablecido para usar el nuevo índice by_reward)
            const allRewardsPromises = courseIds.map((id: any) => ctx.db.query("rewards").withIndex("by_course", (q: any) => q.eq("course_id", id)).collect());
            const allRewardsArrays = await Promise.all(allRewardsPromises);
            const rewards = allRewardsArrays.flat();
            const rewardIds = new Set(rewards.map((r: any) => r._id));

            const allRedemptionsPromises = Array.from(rewardIds).map(rid =>
                ctx.db
                    .query("redemptions")
                    .withIndex("by_reward", q => q.eq("reward_id", rid as any))
                    .collect()
            );
            const allRedemptionsArrays = await Promise.all(allRedemptionsPromises);
            const teacherRedemptions = allRedemptionsArrays.flat();

            const totalRedemptionsCount = teacherRedemptions.length;
            // Calcular Estadisticas Consolidadas
            // totalWhitelistEntries = todos los registros en whitelists
            // totalUniqueStudents = RUTs únicos en las whitelists (por si están en varios ramos)
            // totalRegistered = Alumnos que ya crearon cuenta (enrollments)
            const totalStudents = allWhitelistEntries.length; // Registros totales
            const totalRegistered = enrollments.length;
            
            const uniqueWhitelistIds = new Set(allWhitelistEntries.map(w => normalizeRut(w.student_identifier)));
            const totalUniqueStudents = uniqueWhitelistIds.size;

            const registeredUserIds = new Set(enrollments.map(e => e.user_id));
            const totalRegisteredUniqueUsers = registeredUserIds.size;
            let totalPoints = 0;
            const totalMissionsCompleted = submissions.length + quizSubmissions.length;
            const totalMissionsCreated = missions.length + quizzes.length;
            const totalDocuments = documents.length;
            const totalMasterDocs = documents.filter(d => d.is_master_doc).length;
            
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
                const courseWhitelist = allWhitelistEntries.filter((w: any) => w.course_id === courseId);
                
                const courseMissionIds = new Set(courseMissions.map((m: any) => m._id));
                const courseQuizIds = new Set(courseQuizzes.map((q: any) => q._id));
                const courseSubmissions = submissions.filter((s: any) => courseMissionIds.has(s.mission_id));
                const courseQuizSubmissions = quizSubmissions.filter((s: any) => courseQuizIds.has(s.quiz_id));
                const courseDocs = documents.filter((d: any) => d.course_id === courseId);
                const coursePoints = courseEnrollments.reduce((sum: number, e: any) => sum + (e.ranking_points ?? e.total_points ?? 0), 0);

                const existing = statsByName.get(course.name);
                if (existing) {
                    // Actualizar sets de unicidad
                    courseWhitelist.forEach(w => existing.uniqueWhitelistRuts.add(normalizeRut(w.student_identifier)));
                    courseEnrollments.forEach(en => existing.uniqueRegisteredUserIds.add(en.user_id));
                    
                    existing.missions += courseMissions.length + courseQuizzes.length;
                    existing.submissions += courseSubmissions.length + courseQuizSubmissions.length;
                    existing.documents += courseDocs.length;
                    existing.totalPoints += coursePoints;
                    
                    if (!existing.code.includes(course.code)) {
                        existing.code += ` / ${course.code}`;
                    }
                    
                    // Re-calcular contadores finales
                    existing.students = existing.uniqueWhitelistRuts.size;
                    existing.registered = existing.uniqueRegisteredUserIds.size;
                } else {
                    const uniqueWhitelistRuts = new Set(courseWhitelist.map(w => normalizeRut(w.student_identifier)));
                    const uniqueRegisteredUserIds = new Set(courseEnrollments.map(en => en.user_id));

                    statsByName.set(course.name, {
                        name: course.name,
                        code: course.code,
                        students: uniqueWhitelistRuts.size,
                        registered: uniqueRegisteredUserIds.size,
                        missions: courseMissions.length + courseQuizzes.length,
                        submissions: courseSubmissions.length + courseQuizSubmissions.length,
                        documents: courseDocs.length,
                        totalPoints: coursePoints,
                        // Guardamos los sets para seguir agregando en el próximo loop
                        uniqueWhitelistRuts,
                        uniqueRegisteredUserIds
                    });
                }
            }

            const courseStats = Array.from(statsByName.values()).map(s => {
                const { uniqueWhitelistRuts, uniqueRegisteredUserIds, ...rest } = s;
                return rest;
            });

            return {
                totalStudents: totalUniqueStudents,
                totalEnrollments: totalStudents,
                totalRegistered,
                totalUniqueStudents,
                totalRegisteredUniqueUsers,
                totalMissionsCompleted,
                totalQuizzesCompleted: quizSubmissions.length,
                totalRedemptions: totalRedemptionsCount,
                totalPoints,
                totalCourses: courses.length,
                totalMissionsCreated,
                avgQuizScore,
                avgMissionsPerStudent,
                totalDocuments,
                totalDocumentsUploaded: documents.length,
                totalMasterDocs,
                belbinDistribution,
                courseStats,
                topStudents: calculateTopStudents(enrollments, studentMap),
                dailyActivity: calculateDailyActivity(submissions, quizSubmissions, quizAttempts),
            };
        } catch (e) {
            console.error("Error in getTeacherStats:", e);
            return null;
        }
    },
});

function calculateDailyActivity(mSubs: any[], qSubs: any[], qAttempts: any[]) {
    const days = 7;
    const activity = [];
    const now = new Date();
    
    // Unificar todos los eventos de actividad con su usuario y timestamp
    const events = [
        ...mSubs.map(s => ({ userId: s.user_id, ts: s.completed_at || s._creationTime })),
        ...qSubs.map(s => ({ userId: s.user_id, ts: s.completed_at || s._creationTime })),
        ...qAttempts.map(a => ({ userId: a.user_id, ts: a.last_updated || a._creationTime }))
    ];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        
        // Alumnos únicos que tuvieron actividad este día
        const uniqueUsersOnDay = new Set(
            events
                .filter(e => new Date(e.ts).toISOString().split('T')[0] === dayStr)
                .map(e => e.userId)
        );
        
        activity.push({ day: dayStr, count: uniqueUsersOnDay.size });
    }
    return activity;
}

function calculateTopStudents(enrollments: any[], studentMap: Map<string, any>) {
    const studentStats = new Map<string, any>();

    for (const en of enrollments) {
        const student = studentMap.get(en.user_id);
        if (!student) continue;

        // Unificamos por student_id (RUT) si existe, si no por user_id
        const key = student.student_id || student._id;
        const pts = en.ranking_points ?? en.total_points ?? 0;

        if (studentStats.has(key)) {
            const s = studentStats.get(key);
            s.totalPoints += pts;
            if (!s.courses.includes(en.course_id)) {
                s.courses.push(en.course_id);
            }
        } else {
            studentStats.set(key, {
                id: student._id,
                name: student.name || "Alumno",
                studentId: student.student_id || "S/I",
                totalPoints: pts,
                courses: [en.course_id],
                belbin: student.belbin_profile?.role_dominant || "S/D"
            });
        }
    }

    return Array.from(studentStats.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10);
}

// Obtener datos detallados de alumnos para exportación
export const exportCourseData = query({
    args: { courseName: v.string() },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);
        const userId = user._id;

        // Buscar todos los cursos con ese nombre (para agregación multicarrera)
        const courses = user.role === "admin"
            ? await ctx.db.query("courses").collect()
            : await ctx.db
                .query("courses")
                .withIndex("by_teacher", (q: any) => q.eq("teacher_id", userId))
                .collect();
        
        const targetCourses = courses.filter(c => c.name === args.courseName);
        const courseIds = targetCourses.map(c => c._id);

        if (courseIds.length === 0) return [];

        // Enrollments
        const enrollments = [];
        for (const cid of courseIds) {
            const batch = await ctx.db
                .query("enrollments")
                .withIndex("by_course", q => q.eq("course_id", cid as any))
                .collect();
            enrollments.push(...batch);
        }

        // De-duplicate users across sections if necessary (keep highest points or sum?)
        // Usually, in Quest, one user per section. Sum is safer.
        const userMap = new Map<string, any>();

        for (const en of enrollments) {
            const student = await ctx.db.get(en.user_id);
            if (!student) continue;

            const existing = userMap.get(en.user_id);
            if (existing) {
                existing.points += (en.ranking_points ?? en.total_points ?? 0);
                existing.spendable += (en.spendable_points ?? en.total_points ?? 0);
                if (!existing.sections.includes(en.course_id)) {
                     // We could fetch the code if needed
                }
            } else {
                userMap.set(en.user_id, {
                    name: student.name,
                    id: student.student_id || "S/I",
                    email: student.email,
                    points: (en.ranking_points ?? en.total_points ?? 0),
                    spendable: (en.spendable_points ?? en.total_points ?? 0),
                    belbin: student.belbin_profile?.role_dominant || "No realizado",
                    missions: 0 // Mock for now or calculate
                });
            }
        }

        return Array.from(userMap.values());
    }
});

