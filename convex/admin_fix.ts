import { mutation } from "./_generated/server";
import { requireTeacher } from "./withUser";
import { normalizeRut } from "./rutUtils";

export const unifyUsersByRut = mutation({
    args: {},
    handler: async (ctx) => {
        const teacher = await requireTeacher(ctx);
        
        // 1. Obtener todos los alumnos del sistema (o al menos los vinculados a este docente)
        // Por ahora lo haremos global pero limitado a lo que el docente puede ver/gestionar
        const users = await ctx.db.query("users").collect();
        const students = users.filter(u => u.role === "student" && u.student_id);

        const rutGroups = new Map<string, any[]>();

        for (const s of students) {
            // Extraer solo números para el "Cuerpo" del RUT (sin DV)
            const body = s.student_id!.replace(/[^\d]/g, '');
            // Si el RUT es corto (ej. < 6 dígitos) lo ignoramos para evitar falsos positivos
            if (body.length < 6) continue;

            if (!rutGroups.has(body)) {
                rutGroups.set(body, []);
            }
            rutGroups.get(body)!.push(s);
        }

        let unifiedCount = 0;
        let pointsTransferred = 0;

        for (const [body, group] of rutGroups.entries()) {
            if (group.length > 1) {
                // Hay duplicados por RUT
                // Prioridad: 1. El que tenga clerkId (el usuario real que se logueó)
                // 2. El que tenga nombre más completo
                // 3. El más antiguo
                
                group.sort((a, b) => {
                    if (a.clerkId && !b.clerkId) return -1;
                    if (!a.clerkId && b.clerkId) return 1;
                    return (a._creationTime || 0) - (b._creationTime || 0);
                });

                const primary = group[0];
                const duplicates = group.slice(1);

                for (const dupe of duplicates) {
                    // Transferir inscripciones del duplicado al primario
                    const dupeEnrollments = await ctx.db
                        .query("enrollments")
                        .withIndex("by_user", q => q.eq("user_id", dupe._id))
                        .collect();

                    for (const en of dupeEnrollments) {
                        // Verificar si el primario ya está en ese curso
                        const existing = await ctx.db
                            .query("enrollments")
                            .withIndex("by_user", q => q.eq("user_id", primary._id))
                            .filter(q => q.eq(q.field("course_id"), en.course_id))
                            .unique();

                        if (existing) {
                            // Sumar puntos y borrar el duplicado
                            const newRanking = (existing.ranking_points || 0) + (en.ranking_points || 0);
                            const newSpendable = (existing.spendable_points || 0) + (en.spendable_points || 0);
                            const newTotal = (existing.total_points || 0) + (en.total_points || 0);
                            
                            await ctx.db.patch(existing._id, {
                                ranking_points: newRanking,
                                spendable_points: newSpendable,
                                total_points: newTotal
                            });
                            pointsTransferred += (en.total_points || 0);
                        } else {
                            // Mover la inscripción al primario
                            await ctx.db.patch(en._id, { user_id: primary._id });
                        }
                    }

                    // Después de mover todo, podemos borrar el duplicado si no tiene clerkId
                    if (!dupe.clerkId) {
                        await ctx.db.delete(dupe._id);
                    }
                    unifiedCount++;
                }
            }
        }

        return { unifiedCount, pointsTransferred };
    }
});
