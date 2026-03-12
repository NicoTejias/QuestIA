import { mutation } from "./_generated/server";

export const fixData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Obtener bases
    const allEnrollments = await ctx.db.query("enrollments").collect();
    const allUsers = await ctx.db.query("users").collect();
    const whitelists = await ctx.db.query("whitelists").collect();
    const allCourses = await ctx.db.query("courses").collect();

    let syncedUsers = 0;
    let syncedEnrollments = 0;

    // 2. Sincronizar por nombre para GESTION DE PROYECTOS I
    // Esta es la causa de que los puntajes "desaparezcan": el ID del usuario no coincide con el de la whitelist
    const targetCourse = allCourses.find(c => c.name.includes("GESTION DE PROYECTOS I"));
    if (targetCourse) {
      const courseWhitelist = whitelists.filter(w => w.course_id === targetCourse._id);
      
      for (const wl of courseWhitelist) {
        // Normalizar nombres para comparación
        const wlTokens = wl.student_name ? wl.student_name.toUpperCase().split(' ') : [];
        if (wlTokens.length < 1) continue;

        const match = allUsers.find(u => {
          if (!u.name) return false;
          const uName = u.name.toUpperCase();
          // Coincidencia si los dos primeros términos del nombre están presentes
          return uName.includes(wlTokens[0]) && (wlTokens.length < 2 || uName.includes(wlTokens[1]));
        });

        if (match) {
          // A. Corregir student_id del usuario para que coincida con whitelist
          if (match.student_id !== wl.student_identifier) {
            await ctx.db.patch(match._id, { student_id: wl.student_identifier });
            syncedUsers++;
          }

          // B. Corregir enrollment (asegurar que tenga puntos y sección correcta)
          const en = allEnrollments.find(e => e.user_id === match._id && e.course_id === targetCourse._id);
          if (en) {
            if (en.section !== wl.section) {
              await ctx.db.patch(en._id, { section: wl.section });
              syncedEnrollments++;
            }
          }
        }
      }
    }

    return { syncedUsers, syncedEnrollments };
  },
});
