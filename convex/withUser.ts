import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
        throw new Error("No autenticado");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
        throw new Error("Usuario no encontrado");
    }
    return user;
}

export async function requireTeacher(ctx: QueryCtx | MutationCtx) {
    const user = await requireAuth(ctx);
    if (user.role !== "teacher") {
        throw new Error("No tienes permisos de docente");
    }
    return user;
}
