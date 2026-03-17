import { query } from "./_generated/server";

export const databaseCheck = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { error: "No identity" };

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
            .unique();
        
        if (!user) return { error: "User not found" };

        const courses = await ctx.db
            .query("courses")
            .withIndex("by_teacher", q => q.eq("teacher_id", user._id))
            .collect();

        const courseIds = courses.map(c => c._id);

        const whitelists = await ctx.db
            .query("whitelists")
            .collect();
        
        const myWhitelists = whitelists.filter(w => courseIds.includes(w.course_id));
        const uniqueWhitelistStudents = [...new Set(myWhitelists.map(w => w.student_identifier))];

        const documents = await ctx.db
            .query("course_documents")
            .withIndex("by_teacher", q => q.eq("teacher_id", user._id))
            .collect();

        return {
            userName: user.name,
            role: user.role,
            courses: courses.map(c => ({ id: c._id, name: c.name, code: c.code })),
            whitelistCount: myWhitelists.length,
            uniqueWhitelistStudents: uniqueWhitelistStudents.length,
            duplicateCheck: myWhitelists.length > 0 ? (myWhitelists.length / uniqueWhitelistStudents.length).toFixed(2) : 0,
            documents: documents.map(d => ({ 
                id: d._id, 
                name: d.file_name, 
                course: d.course_id, 
                isMaster: d.is_master_doc, 
                type: d.master_doc_type 
            }))
        };
    }
});
