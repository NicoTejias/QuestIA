import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./withUser";

// Verifica si el usuario es Admin
export const isAdmin = query({
  handler: async (ctx) => {
    try {
      const user = await requireAuth(ctx);
      return user.role === "admin";
    } catch {
      return false;
    }
  },
});

// Obtener estadísticas globales del sistema
export const getGlobalStats = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") throw new Error("Acceso denegado");

    const users = await ctx.db.query("users").collect();
    const courses = await ctx.db.query("courses").collect();
    const feedBacks = await ctx.db.query("feedback").collect();
    const quizzes = await ctx.db.query("quizzes").collect();
    const missions = await ctx.db.query("missions").collect();

    return {
      totalUsers: users.length,
      students: users.filter(u => u.role === "student").length,
      teachers: users.filter(u => u.role === "teacher" || u.role === "admin").length,
      totalCourses: courses.length,
      totalFeedback: feedBacks.length,
      totalQuizzes: quizzes.length,
      totalMissions: missions.length,
    };
  },
});

// Listar todos los feedbacks
export const listAllFeedback = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") throw new Error("Acceso denegado");

    const feedbacks = await ctx.db.query("feedback").order("desc").collect();
    
    return await Promise.all(feedbacks.map(async (f) => {
      const userData = await ctx.db.get(f.user_id);
      return {
        ...f,
        userName: userData?.name || "Desconocido",
        userEmail: userData?.email || "Sin email",
      };
    }));
  },
});

// Listar usuarios registrados
export const listAllUsers = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") throw new Error("Acceso denegado");

    return await ctx.db.query("users").order("desc").take(args.limit);
  },
});

// Convertir a un usuario en Docente/Admin (Útil para control manual)
export const updateUserRole = mutation({
  args: { targetUserId: v.id("users"), newRole: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") throw new Error("Acceso denegado");

    await ctx.db.patch(args.targetUserId, { role: args.newRole });
  },
});
