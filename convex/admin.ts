import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const fixData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Corregir inscripciones con puntos excedidos globalmente
    // El usuario menciona que algunos tienen 70 puntos (50 base + 20 bono viejo)
    const allEnrollments = await ctx.db.query("enrollments").collect();

    let fixedPointsCount = 0;
    for (const en of allEnrollments) {
      if (en.ranking_points === 70) {
        await ctx.db.patch(en._id, {
          ranking_points: 55, // 50 base + 5 bono nuevo
          spendable_points: Math.min(en.spendable_points, 55),
          total_points: 55,
        });
        fixedPointsCount++;
      }
    }

    // 3. Asegurar que la racha (daily_streak) sea al menos 1 para quienes hicieron el quiz hoy
    const users = await ctx.db.query("users").collect();
    let fixedStreaks = 0;
    
    // Rango de "hoy" en Chile
    const now = Date.now();
    const todayDateStr = new Date(now).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    for (const user of users) {
      const lastBonusDateStr = user.last_daily_bonus_at 
        ? new Date(user.last_daily_bonus_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) 
        : "";
      
      if (lastBonusDateStr === todayDateStr && (user.daily_streak === undefined || user.daily_streak === 0)) {
        await ctx.db.patch(user._id, {
          daily_streak: 1
        });
        fixedStreaks++;
      }
    }

    return { fixedPointsCount, fixedStreaks };
  },
});
