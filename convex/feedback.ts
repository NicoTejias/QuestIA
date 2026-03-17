import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./withUser";

export const sendFeedback = mutation({
  args: {
    content: v.string(),
    type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("opinion")),
    page_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    return await ctx.db.insert("feedback", {
      user_id: user._id,
      content: args.content,
      type: args.type,
      page_url: args.page_url,
      created_at: Date.now(),
    });
  },
});
