/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as admin_fix from "../admin_fix.js";
import type * as ai_feedback from "../ai_feedback.js";
import type * as analytics from "../analytics.js";
import type * as app_config from "../app_config.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as backup_system from "../backup_system.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as debug_David from "../debug_David.js";
import type * as debug_attempts from "../debug_attempts.js";
import type * as debug_find_user from "../debug_find_user.js";
import type * as debug_student from "../debug_student.js";
import type * as documents from "../documents.js";
import type * as evaluator from "../evaluator.js";
import type * as fcm from "../fcm.js";
import type * as feedback from "../feedback.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as missions from "../missions.js";
import type * as notifications from "../notifications.js";
import type * as point_transfers from "../point_transfers.js";
import type * as quizzes from "../quizzes.js";
import type * as repair from "../repair.js";
import type * as rewards from "../rewards.js";
import type * as rutUtils from "../rutUtils.js";
import type * as streak_reminders from "../streak_reminders.js";
import type * as test_notification from "../test_notification.js";
import type * as transfers from "../transfers.js";
import type * as users from "../users.js";
import type * as withUser from "../withUser.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  admin_fix: typeof admin_fix;
  ai_feedback: typeof ai_feedback;
  analytics: typeof analytics;
  app_config: typeof app_config;
  attendance: typeof attendance;
  auth: typeof auth;
  backup_system: typeof backup_system;
  courses: typeof courses;
  crons: typeof crons;
  debug: typeof debug;
  debug_David: typeof debug_David;
  debug_attempts: typeof debug_attempts;
  debug_find_user: typeof debug_find_user;
  debug_student: typeof debug_student;
  documents: typeof documents;
  evaluator: typeof evaluator;
  fcm: typeof fcm;
  feedback: typeof feedback;
  groups: typeof groups;
  http: typeof http;
  messages: typeof messages;
  missions: typeof missions;
  notifications: typeof notifications;
  point_transfers: typeof point_transfers;
  quizzes: typeof quizzes;
  repair: typeof repair;
  rewards: typeof rewards;
  rutUtils: typeof rutUtils;
  streak_reminders: typeof streak_reminders;
  test_notification: typeof test_notification;
  transfers: typeof transfers;
  users: typeof users;
  withUser: typeof withUser;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
