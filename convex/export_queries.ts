import { query } from "./_generated/server"

// Queries de solo lectura para exportar datos

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect()
  },
})

export const getAllCourses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect()
  },
})

export const getAllEnrollments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("enrollments").collect()
  },
})

export const getAllWhitelists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("whitelists").collect()
  },
})

export const getAllQuizzes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quizzes").collect()
  },
})

export const getAllRewards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rewards").collect()
  },
})

export const getAllMissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("missions").collect()
  },
})

export const getAllBadges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").collect()
  },
})

export const getAllFaqs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("faqs").collect()
  },
})

export const getAllQuizSubmissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quiz_submissions").collect()
  },
})

export const getAllRedemptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("redemptions").collect()
  },
})

export const getAllNotifications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notifications").collect()
  },
})

export const getAllMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect()
  },
})

export const getAllCourseGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("course_groups").collect()
  },
})

export const getAllQuizAttempts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quiz_attempts").collect()
  },
})

export const getAllMissionSubmissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mission_submissions").collect()
  },
})

export const getAllCourseDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("course_documents").collect()
  },
})

export const getAllUserBadges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("user_badges").collect()
  },
})

export const getAllPointTransferRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("point_transfer_requests").collect()
  },
})

export const getAllAttendanceSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance_sessions").collect()
  },
})

export const getAllAttendanceLogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance_logs").collect()
  },
})

export const getAllFeedback = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feedback").collect()
  },
})

export const getAllGradingRubrics = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("grading_rubrics").collect()
  },
})

export const getAllGradingResults = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("grading_results").collect()
  },
})

export const getAllEvaluaciones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("evaluaciones").collect()
  },
})

export const getAllAdmins = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admins").collect()
  },
})

export const getAllRateLimits = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rate_limits").collect()
  },
})

export const getAllInstitutionConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("institution_config").collect()
  },
})

export const getAllCareers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("careers").collect()
  },
})