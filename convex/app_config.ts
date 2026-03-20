import { query, mutation } from "./_generated/server";
import { requireAuth, requireAdmin } from "./withUser";
import { v } from "convex/values";

const CONFIG_KEYS = {
    ALLOWED_EMAIL_DOMAINS: "allowed_email_domains",
    INSTITUTION_NAME: "institution_name",
    REQUIRE_EMAIL_VERIFICATION: "require_email_verification",
} as const;

const DEFAULT_ALLOWED_DOMAINS = "@duocuc.cl,@profesor.duoc.cl,@duoc.cl,@gmail.com,@outlook.com";

export const getLatestConfig = query({
    args: {},
    handler: async (_ctx) => {
        return {
            latestVersion: "1.0.12",
            downloadUrl: "https://github.com/NicoTejias/QuestIA/releases/download/v.1.0.12/QuestIA.1.0.12.apk", 
            isMandatory: true,
            message: "Versión 1.0.12: Optimizaciones de sistema y correcciones menores."
        };
    },
});

export const getAllowedDomainsList = query({
    args: {},
    handler: async (ctx) => {
        try {
            const config = await ctx.db
                .query("institution_config")
                .withIndex("by_key", (q) => q.eq("key", CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS))
                .first();
            
            if (!config?.value) {
                return DEFAULT_ALLOWED_DOMAINS.split(",");
            }
            return config.value.split(",").filter(d => d.trim().length > 0);
        } catch (error) {
            return DEFAULT_ALLOWED_DOMAINS.split(",");
        }
    },
});

export const getAllowedEmailDomains = query({
    args: {},
    handler: async (ctx) => {
        try {
            const config = await ctx.db
                .query("institution_config")
                .withIndex("by_key", (q) => q.eq("key", CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS))
                .first();
            
            if (!config?.value) {
                return DEFAULT_ALLOWED_DOMAINS.split(",");
            }
            return config.value.split(",").filter(d => d.trim().length > 0);
        } catch (error) {
            return DEFAULT_ALLOWED_DOMAINS.split(",");
        }
    },
});

export const getInstitutionConfig = query({
    args: {},
    handler: async (ctx) => {
        await requireAuth(ctx);
        
        let allowedDomains = DEFAULT_ALLOWED_DOMAINS;
        let institutionName = "QuestIA";
        let requireVerification = false;

        try {
            const configList = await ctx.db.query("institution_config").collect();
            
            for (const config of configList) {
                if (config.key === CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS) {
                    allowedDomains = config.value;
                } else if (config.key === CONFIG_KEYS.INSTITUTION_NAME) {
                    institutionName = config.value;
                } else if (config.key === CONFIG_KEYS.REQUIRE_EMAIL_VERIFICATION) {
                    requireVerification = config.value === "true";
                }
            }
        } catch (error) {
            // Si falla, usar valores por defecto
        }

        return {
            allowedDomains: allowedDomains.split(",").filter(d => d.trim().length > 0),
            institutionName,
            requireEmailVerification: requireVerification,
        };
    },
});

export const updateAllowedDomains = mutation({
    args: {
        domains: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAdmin(ctx);
        
        if (args.domains.length === 0) {
            throw new Error("Debe haber al menos un dominio permitido");
        }

        const normalizedDomains = args.domains.map(d => {
            let domain = d.trim().toLowerCase();
            if (!domain.startsWith("@")) {
                domain = "@" + domain;
            }
            return domain;
        });

        try {
            const existing = await ctx.db
                .query("institution_config")
                .withIndex("by_key", (q) => q.eq("key", CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    value: normalizedDomains.join(","),
                    updated_at: Date.now(),
                    updated_by: user._id,
                });
            } else {
                await ctx.db.insert("institution_config", {
                    key: CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS,
                    value: normalizedDomains.join(","),
                    updated_at: Date.now(),
                    updated_by: user._id,
                });
            }
        } catch (error) {
            await ctx.db.insert("institution_config", {
                key: CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS,
                value: normalizedDomains.join(","),
                updated_at: Date.now(),
                updated_by: user._id,
            });
        }
        
        return { success: true, domains: normalizedDomains };
    },
});

export const updateInstitutionName = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAdmin(ctx);
        
        try {
            const existing = await ctx.db
                .query("institution_config")
                .withIndex("by_key", (q) => q.eq("key", CONFIG_KEYS.INSTITUTION_NAME))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    value: args.name.trim(),
                    updated_at: Date.now(),
                    updated_by: user._id,
                });
            } else {
                await ctx.db.insert("institution_config", {
                    key: CONFIG_KEYS.INSTITUTION_NAME,
                    value: args.name.trim(),
                    updated_at: Date.now(),
                    updated_by: user._id,
                });
            }
        } catch (error) {
            await ctx.db.insert("institution_config", {
                key: CONFIG_KEYS.INSTITUTION_NAME,
                value: args.name.trim(),
                updated_at: Date.now(),
                updated_by: user._id,
            });
        }
        
        return { success: true };
    },
});

export const checkEmailAllowed = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        try {
            const config = await ctx.db
                .query("institution_config")
                .withIndex("by_key", (q) => q.eq("key", CONFIG_KEYS.ALLOWED_EMAIL_DOMAINS))
                .first();
            
            const allowedList = config?.value 
                ? config.value.split(",").filter(d => d.trim().length > 0)
                : DEFAULT_ALLOWED_DOMAINS.split(",");
            
            const emailLower = args.email.toLowerCase();
            const isAllowed = allowedList.some(domain => emailLower.endsWith(domain.toLowerCase()));
            
            return { isAllowed, allowedDomains: allowedList };
        } catch (error) {
            return { 
                isAllowed: true, 
                allowedDomains: DEFAULT_ALLOWED_DOMAINS.split(","),
                fallback: true 
            };
        }
    },
});
