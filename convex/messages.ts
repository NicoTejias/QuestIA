import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./withUser";

export const send = mutation({
    args: {
        course_id: v.id("courses"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .filter((q) => q.eq(q.field("course_id"), args.course_id))
            .unique();

        const course = await ctx.db.get(args.course_id);
        const isTeacher = course?.teacher_id === user._id;

        if (!enrollment && !isTeacher) {
            throw new Error("No estás inscrito en este ramo");
        }

        const messageId = await ctx.db.insert("messages", {
            course_id: args.course_id,
            user_id: user._id,
            content: args.content,
            type: "text",
            created_at: Date.now(),
        });

        return messageId;
    },
});

export const getByCourse = query({
    args: {
        course_id: v.id("courses"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireAuth(ctx);
        
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_course_time", (q) => q.eq("course_id", args.course_id))
            .order("desc")
            .take(args.limit || 50);

        const messagesWithUsers = await Promise.all(
            messages.map(async (msg) => {
                const user = await ctx.db.get(msg.user_id);
                return {
                    ...msg,
                    userName: user?.name || "Usuario",
                    userRole: user?.role || "student",
                    belbinRole: user?.belbin_profile?.role_dominant || "Sin determinar",
                };
            })
        );

        return messagesWithUsers.reverse();
    },
});
