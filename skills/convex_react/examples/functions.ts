import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Example Schema
// export default defineSchema({
//   tasks: defineTable({
//     text: v.string(),
//     isCompleted: v.boolean(),
//   }),
// });

export const getTasks = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tasks").collect();
    },
});

export const addTask = mutation({
    args: { text: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("tasks", { text: args.text, isCompleted: false });
    },
});
