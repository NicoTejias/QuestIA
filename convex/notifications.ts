import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAuth } from "./withUser";
import { api } from "./_generated/api";

export const getNotifications = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        try {
            const user = await requireAuth(ctx);
            return await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .order("desc")
                .paginate(args.paginationOpts);
        } catch {
            return { page: [], isDone: true, continueCursor: "" };
        }
    },
});

export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireAuth(ctx);
            const unread = await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .filter((q) => q.eq(q.field("read"), false))
                .collect();
            return unread.length;
        } catch {
            return 0;
        }
    },
});

export const markAsRead = mutation({
    args: { notification_id: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const notification = await ctx.db.get(args.notification_id);
        if (!notification || notification.user_id !== user._id) {
            throw new Error("No autorizado");
        }

        await ctx.db.patch(args.notification_id, { read: true });
    },
});

export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("read"), false))
            .collect();

        for (const notif of unread) {
            await ctx.db.patch(notif._id, { read: true });
        }
    },
});

// Helper interno usado por mutations para crear notificaciones + push FCM
export const pushNotification = async (
    ctx: any,
    userId: any,
    title: string,
    message: string,
    type: string,
    relatedId?: string
) => {
    await ctx.db.insert("notifications", {
        user_id: userId,
        title,
        message,
        type,
        read: false,
        related_id: relatedId,
        created_at: Date.now(),
    });

    // Enviar push FCM si el usuario tiene token registrado
    try {
        const user = await ctx.db.get(userId);
        if (user?.push_token) {
            await ctx.scheduler.runAfter(0, api.fcm.sendPushNotification, {
                token: user.push_token,
                title,
                body: message,
            });
        }
    } catch (e) {
        console.error("Error enviando push FCM:", e);
    }
};
