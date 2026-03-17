import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTeacher } from "./withUser";

// Generar grupos inteligentes basados en perfiles Belbin
export const generateGroups = mutation({
    args: {
        course_id: v.id("courses"),
        group_size: v.number(), // Tamaño deseado por grupo (3-6)
    },
    handler: async (ctx, args) => {
        const user = await requireTeacher(ctx);

        // Verificar que el curso pertenezca al docente
        const course = await ctx.db.get(args.course_id);
        if (!course || (course.teacher_id !== user._id && user.role !== "admin")) {
            throw new Error("No autorizado para este ramo");
        }

        if (args.group_size < 2 || args.group_size > 8) {
            throw new Error("El tamaño del grupo debe ser entre 2 y 8");
        }

        // Obtener todos los alumnos inscritos en el ramo
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
            .collect();

        if (enrollments.length < 2) {
            throw new Error("Se necesitan al menos 2 alumnos inscritos para generar grupos");
        }

        // Obtener datos completos de los alumnos (con Belbin)
        const userIds = new Set(enrollments.map(e => e.user_id));
        const users = await Promise.all(Array.from(userIds).map(id => ctx.db.get(id)));
        const userMap = new Map(users.filter(u => u !== null).map(u => [u._id, u]));

        const students = [];
        for (const en of enrollments) {
            const student = userMap.get(en.user_id);
            if (student) {
                students.push({
                    userId: student._id,
                    name: student.name || "Sin nombre",
                    belbinRole: student.belbin_profile?.role_dominant || "Sin determinar",
                    belbinCategory: student.belbin_profile?.category || "Sin categoría",
                    enrollmentId: en._id,
                });
            }
        }

        // === ALGORITMO DE BALANCEO BELBIN ===
        // Categorías: Mental (Cerebro, Monitor), Social (Coordinador, Investigador, Cohesionador), Acción (Impulsor, Implementador, Finalizador)

        // Separar por categoría
        const mental = students.filter(s => s.belbinCategory === "Mental");
        const social = students.filter(s => s.belbinCategory === "Social");
        const accion = students.filter(s => s.belbinCategory === "Acción");
        const sinCategoria = students.filter(s => s.belbinCategory === "Sin categoría");

        // Shuffle cada grupo para aleatoriedad
        const shuffle = <T,>(arr: T[]): T[] => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        const shuffledMental = shuffle(mental);
        const shuffledSocial = shuffle(social);
        const shuffledAccion = shuffle(accion);
        const shuffledSin = shuffle(sinCategoria);

        // Pool combinado con round-robin por categoría
        const pool: typeof students = [];
        const maxLen = Math.max(shuffledMental.length, shuffledSocial.length, shuffledAccion.length, shuffledSin.length);

        for (let i = 0; i < maxLen; i++) {
            if (i < shuffledMental.length) pool.push(shuffledMental[i]);
            if (i < shuffledSocial.length) pool.push(shuffledSocial[i]);
            if (i < shuffledAccion.length) pool.push(shuffledAccion[i]);
            if (i < shuffledSin.length) pool.push(shuffledSin[i]);
        }

        // Dividir en grupos
        const numGroups = Math.ceil(pool.length / args.group_size);
        const groups: (typeof students)[] = Array.from({ length: numGroups }, () => []);

        pool.forEach((student, index) => {
            groups[index % numGroups].push(student);
        });

        // Guardar la asignación en los enrollments
        for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
            const groupName = `Grupo ${groupIdx + 1}`;
            for (const student of groups[groupIdx]) {
                await ctx.db.patch(student.enrollmentId, {
                    group_id: groupName,
                });
            }
        }

        // Retornar los grupos generados
        return {
            total_students: students.length,
            total_groups: groups.length,
            groups: groups.map((members, i) => ({
                name: `Grupo ${i + 1}`,
                members: members.map(m => ({
                    name: m.name,
                    belbinRole: m.belbinRole,
                    belbinCategory: m.belbinCategory,
                })),
                stats: {
                    mental: members.filter(m => m.belbinCategory === "Mental").length,
                    social: members.filter(m => m.belbinCategory === "Social").length,
                    accion: members.filter(m => m.belbinCategory === "Acción").length,
                    sinCategoria: members.filter(m => m.belbinCategory === "Sin categoría").length,
                },
            })),
        };
    },
});

// Obtener los grupos de un ramo
export const getGroups = query({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            await requireAuth(ctx);

            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_course", (q) => q.eq("course_id", args.course_id))
                .collect();

            // Agrupar por group_id
            const groups: Record<string, { name: string; belbinRole: string; belbinCategory: string; points: number }[]> = {};

            const userIds = new Set(enrollments.map(e => e.user_id));
            const users = await Promise.all(Array.from(userIds).map(id => ctx.db.get(id)));
            const userMap = new Map(users.filter(u => u !== null).map(u => [u._id, u]));

            for (const en of enrollments) {
                const groupName = en.group_id || "Sin grupo";
                if (!groups[groupName]) groups[groupName] = [];

                const student = userMap.get(en.user_id);
                if (student) {
                    groups[groupName].push({
                        name: student.name || "Sin nombre",
                        belbinRole: student.belbin_profile?.role_dominant || "Sin determinar",
                        belbinCategory: student.belbin_profile?.category || "Sin categoría",
                        points: en.ranking_points ?? en.total_points ?? 0,
                    });
                }
            }

            return Object.entries(groups).map(([name, members]) => ({
                name,
                members,
                stats: {
                    mental: members.filter(m => m.belbinCategory === "Mental").length,
                    social: members.filter(m => m.belbinCategory === "Social").length,
                    accion: members.filter(m => m.belbinCategory === "Acción").length,
                    total: members.length,
                },
            }));
        } catch {
            return [];
        }
    },
});
