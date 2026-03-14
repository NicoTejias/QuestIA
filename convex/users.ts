import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeRut } from "./rutUtils";
import { requireAuth } from "./withUser";

// Sincroniza el usuario de Clerk con nuestra tabla de users
export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Llamada a storeUser sin identidad autenticada");
        }

        // 1. Intentar buscar por clerkId
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (user !== null) {
            // Usuario ya existe y está vinculado
            return user._id;
        }

        // 2. Si no existe por clerkId, buscar por email (Migración/Vinculación)
        const userByEmail = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email))
            .first();

        if (userByEmail !== null) {
            // Vincular cuenta existente con Clerk
            await ctx.db.patch(userByEmail._id, {
                clerkId: identity.subject,
                image: identity.pictureUrl,
                name: identity.name,
            });
            return userByEmail._id;
        }

        // 3. Si no existe nada, crear nuevo usuario
        // Validar dominios institucionales aquí también por seguridad
        const email = identity.email?.toLowerCase() || "";
        const allowedDomains = ["@duocuc.cl", "@profesor.duoc.cl", "@duoc.cl"];
        const isAllowed = allowedDomains.some(domain => email.endsWith(domain));

        if (!isAllowed) {
            throw new Error("Solo se permiten correos institucionales de Duoc UC.");
        }

        const isTeacherEmail = email.includes("@profesor.duoc.cl") || email.includes("@duoc.cl");

        return await ctx.db.insert("users", {
            name: identity.name,
            email: identity.email,
            image: identity.pictureUrl,
            clerkId: identity.subject,
            role: isTeacherEmail ? "teacher" : "student",
            is_verified: true,
        });
    },
});

// Obtener el perfil del usuario actual autenticado
export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireAuth(ctx);
            if (!user) return null;

            return {
                ...user,
                is_verified: !!(user.is_verified || (user as any).emailVerificationTime)
            };
        } catch (e) {
            // Si requireAuth falla, devolvemos null en vez de error para que el frontend maneje el estado de carga
            return null;
        }
    },
});

export const getProfileByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();
    },
});

export const saveBelbinProfile = mutation({

    args: {
        role_dominant: v.string(),
        category: v.string(),
        scores: v.object({
            Cerebro: v.optional(v.number()),
            Evaluador: v.optional(v.number()),
            Especialista: v.optional(v.number()),
            Impulsor: v.optional(v.number()),
            Implementador: v.optional(v.number()),
            Finalizador: v.optional(v.number()),
            Coordinador: v.optional(v.number()),
            Investigador: v.optional(v.number()),
            Cohesionador: v.optional(v.number())
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        await ctx.db.patch(user._id, {
            belbin_profile: {
                role_dominant: args.role_dominant,
                category: args.category,
                scores: args.scores,
            },
        });

        return { success: true };
    },
});

// Auto-enrollment: cruza el student_id con las whitelists activas
// Normaliza el RUT del alumno antes de comparar para evitar problemas de formato
export const autoEnroll = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);
        if (!user || !user.student_id) return { enrolled: 0 };

        // Normalizar el RUT del alumno para que matchee con la whitelist
        const normalizedId = normalizeRut(user.student_id);
        const bodyOnly = user.student_id.replace(/[^\d]/g, '');

        // Obtener TODAS las whitelists del sistema (si crecemos mucho habría que filtrar por índices, pero por ahora está bien)
        // O mejor: buscar por el identificador normalizado y por una búsqueda de prefijo si es posible.
        const byNormalized = normalizedId
            ? await ctx.db
                .query("whitelists")
                .withIndex("by_identifier", (q) =>
                    q.eq("student_identifier", normalizedId)
                )
                .collect()
            : [];

        // Buscar por RUT limpio (solo números)
        const byBody = await ctx.db
            .query("whitelists")
            .withIndex("by_identifier", (q) =>
                q.eq("student_identifier", bodyOnly)
            )
            .collect();

        // Combinar
        const seen = new Set<string>();
        const matchingWhitelists = [];
        for (const item of [...byNormalized, ...byBody]) {
            if (!seen.has(item._id)) {
                seen.add(item._id);
                matchingWhitelists.push(item);
            }
        }

        // Inscribir también por email
        const userEmail = user.email?.toLowerCase();
        if (userEmail) {
            const byEmail = await ctx.db
                .query("whitelists")
                .withIndex("by_identifier", (q) => q.eq("student_identifier", userEmail))
                .collect();
            
            for (const item of byEmail) {
                if (!seen.has(item._id)) {
                    seen.add(item._id);
                    matchingWhitelists.push(item);
                }
            }
        }

        // Búsqueda profunda de fallback: Si no encontramos nada después de RUT e Email, buscar por coincidencia de cuerpo
        if (matchingWhitelists.length === 0 && bodyOnly.length >= 7) {
            const allWhitelists = await ctx.db.query("whitelists").collect();
            for (const w of allWhitelists) {
                const wId = w.student_identifier.toLowerCase();
                
                // Fallback por email manual (por si no matchó exacto antes por mayúsculas/minúsculas)
                if (userEmail && wId === userEmail) {
                    if (!seen.has(w._id)) {
                        seen.add(w._id);
                        matchingWhitelists.push(w);
                        continue;
                    }
                }

                const wBody = wId.replace(/[^\d]/g, '');
                if (wBody && (wBody === bodyOnly || wBody.includes(bodyOnly) || bodyOnly.includes(wBody) || wBody.startsWith(bodyOnly) || bodyOnly.startsWith(wBody) || wBody.endsWith(bodyOnly) || bodyOnly.endsWith(wBody))) {
                    if (!seen.has(w._id)) {
                        seen.add(w._id);
                        matchingWhitelists.push(w);
                    }
                }
            }
        }

        let enrolled = 0;
        for (const item of matchingWhitelists) {
            // Verificar que no exista ya la inscripción
            const existing = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .filter((q) => q.eq(q.field("course_id"), item.course_id))
                .unique();

            if (!existing) {
                await ctx.db.insert("enrollments", {
                    user_id: user._id,
                    course_id: item.course_id,
                    ranking_points: 0,
                    spendable_points: 0,
                    total_points: 0,
                    section: item.section || undefined,
                });
                enrolled++;
            }
        }

        return { enrolled };
    },
});

// Verifica si un RUT o el Email actual está en alguna whitelist para permitir el registro
export const checkWhitelist = query({
    args: { student_id: v.string() },
    handler: async (ctx, args) => {
        if (!args.student_id || args.student_id.length < 3) return { allowed: false };

        // 1. Obtener identidad del usuario actual
        const identity = await ctx.auth.getUserIdentity();
        const userEmail = identity?.email?.toLowerCase() || "";

        // 2. Si el email está en la whitelist, permitir registro de inmediato
        if (userEmail) {
            const matchByEmail = await ctx.db
                .query("whitelists")
                .withIndex("by_identifier", (q) => q.eq("student_identifier", userEmail))
                .first();
            if (matchByEmail) return { allowed: true };
        }

        const inputRaw = args.student_id.trim();
        const inputClean = inputRaw.replace(/[^\dkK]/g, '').toUpperCase();
        const inputNumbersOnly = inputRaw.replace(/[^\d]/g, '');

        // 1. Intento Rápido: Coincidencia exacta con el input limpio (XY)
        const fastMatch = await ctx.db
            .query("whitelists")
            .withIndex("by_identifier", (q) => q.eq("student_identifier", inputClean))
            .first();
        if (fastMatch) return { allowed: true };

        // 2. Búsqueda Exhaustiva (Fallback Final): Comparar cuerpos numéricos
        const allWhitelists = await ctx.db.query("whitelists").collect();
        const match = allWhitelists.find(w => {
            const dbId = w.student_identifier.toUpperCase().replace(/[^\dkK]/g, '');
            const dbNumbersOnly = w.student_identifier.replace(/[^\d]/g, '');
            
            // Match exacto de lo que está limpio en DB
            if (dbId === inputClean) return true;

            // Comparar solo números (saltándose el DV o prefijos)
            if (inputNumbersOnly.length >= 7 && dbNumbersOnly.length >= 7) {
                if (inputNumbersOnly.includes(dbNumbersOnly) || dbNumbersOnly.includes(inputNumbersOnly)) return true;
                if (inputNumbersOnly.startsWith(dbNumbersOnly) || dbNumbersOnly.startsWith(inputNumbersOnly)) return true;
                if (inputNumbersOnly.endsWith(dbNumbersOnly) || dbNumbersOnly.endsWith(inputNumbersOnly)) return true;
            }

            // Comparar email si existe
            if (userEmail && dbId.toLowerCase() === userEmail.toLowerCase()) return true;
            
            return false;
        });

        if (match) return { allowed: true };

        return { allowed: false };
    },
});

export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        student_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const patch: any = {};
        if (args.name !== undefined) patch.name = args.name;

        if (args.student_id !== undefined) {
            // Normalizar si es alumno
            patch.student_id = (user.role === "student")
                ? normalizeRut(args.student_id)
                : args.student_id;
        }

        if (Object.keys(patch).length > 0) {
            await ctx.db.patch(user._id, patch);
        }
        return { success: true };
    },
});

export const verifyAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);
        await ctx.db.patch(user._id, { is_verified: true });
        return { success: true };
    },
});

// Mutación de utilidad para corregir IDs no normalizados y sincronizar inscripciones
export const fixAllStudentIds = mutation({
    args: {},
    handler: async (ctx) => {
        // Obtenemos todos los usuarios y whitelists
        const users = await ctx.db.query("users").collect();
        const whitelists = await ctx.db.query("whitelists").collect();

        let fixed = 0;
        let enrolled = 0;

        for (const u of users) {
            // Solo normalizamos e inscribimos si es alumno y tiene ID
            if (u.role === "student" && u.student_id) {
                let currentId = u.student_id;
                const normalized = normalizeRut(u.student_id);

                // 1. Corregir formato del ID
                if (normalized && normalized !== u.student_id) {
                    await ctx.db.patch(u._id, { student_id: normalized });
                    currentId = normalized;
                    fixed++;
                }

                // 2. Sincronizar con Whitelist
                const cleanId = currentId.replace(/[^\dkK]/g, '').toUpperCase();

                for (const w of whitelists) {
                    const wNormalized = w.student_identifier ? normalizeRut(w.student_identifier) : null;
                    const wClean = w.student_identifier ? w.student_identifier.replace(/[^\dkK]/g, '').toUpperCase() : "";

                    if (
                        (wNormalized && wNormalized === currentId) ||
                        (wClean && wClean === cleanId) ||
                        (w.student_identifier === currentId)
                    ) {
                        // Coinciden los IDs. Verificar si ya existe inscripción (enrollment)
                        const existing = await ctx.db
                            .query("enrollments")
                            .withIndex("by_user", (q) => q.eq("user_id", u._id))
                            .filter((q) => q.eq(q.field("course_id"), w.course_id))
                            .unique();

                        if (!existing) {
                            await ctx.db.insert("enrollments", {
                                user_id: u._id,
                                course_id: w.course_id,
                                ranking_points: 0,
                                spendable_points: 0,
                                total_points: 0,
                                section: w.section || undefined,
                            });
                            enrolled++;
                        }
                    }
                }
            }
        }
        return { fixed, enrolled };
    }
});

// Compra de "Congelar Racha" (Ice Cube)
export const buyIceCube = mutation({
    args: { course_id: v.id("courses") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const COST = 200;

        // 1. Verificar inscripción y puntos disponibles en ese ramo
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .unique();

        if (!enrollment) throw new Error("No estás inscrito en este ramo");
        
        const currentPoints = enrollment.spendable_points ?? 0;
        if (currentPoints < COST) {
            throw new Error(`Puntos insuficientes. Necesitas ${COST} puntos y tienes ${currentPoints}.`);
        }

        // 2. Descontar puntos
        await ctx.db.patch(enrollment._id, {
            spendable_points: currentPoints - COST,
            // total_points se mantiene igual ya que es el acumulado histórico
        });

        // 3. Otorgar el "Cubo de Hielo"
        const currentCubes = user.ice_cubes || 0;
        await ctx.db.patch(user._id, {
            ice_cubes: currentCubes + 1
        });

        return { success: true, new_cubes: currentCubes + 1 };
    },
});

export const savePushToken = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return;

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (user) {
                await ctx.db.patch(user._id, { push_token: args.token });
            }
        } catch (err) {
            console.error("Silent error in savePushToken:", err);
        }
    },
});
