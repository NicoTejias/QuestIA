import type { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("No autenticado por el proveedor externo");
    }

    // Buscar al usuario por su clerkId
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

    if (!user) {
        if (!identity.email) {
            throw new Error("El perfil de Clerk no contiene un correo electrónico válido.");
        }

        // Buscar por email
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email))
            .first();
        
        if (userByEmail) {
            // Intentar vincular clerkId si estamos en una mutación
            if ((ctx as any).db.patch) {
                try {
                    await (ctx as any).db.patch(userByEmail._id, { clerkId: identity.subject });
                } catch (e) { /* ignore */ }
            }
            return userByEmail;
        }
        
        throw new Error(`No se encontró registro para ${identity.email}. Verifica que estés registrado.`);
    }
    
    return user;
}

export async function requireTeacher(ctx: QueryCtx | MutationCtx) {
    const user = await requireAuth(ctx);
    if (user.role !== "teacher" && user.role !== "admin") {
        throw new Error("No tienes permisos de docente");
    }
    return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
    const user = await requireAuth(ctx);
    
    if (user.role === "admin") {
        return user;
    }
    
    const userEmail = user.email;
    if (userEmail) {
        const isInAdminsTable = await ctx.db
            .query("admins")
            .withIndex("by_email", (q) => q.eq("email", userEmail.toLowerCase()))
            .first();
            
        if (isInAdminsTable) {
            return user;
        }
    }
    
    throw new Error("Acceso denegado: Se requiere rol de Administrador");
}

export async function isAdmin(ctx: QueryCtx | MutationCtx) {
    try {
        const user = await requireAuth(ctx);
        if (user.role === "admin") return true;
        if (user.email) {
            const admin = await ctx.db
                .query("admins")
                .withIndex("by_email", (q) => q.eq("email", user.email!.toLowerCase()))
                .first();
            if (admin) return true;
        }
        return false;
    } catch {
        return false;
    }
}

