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
import type * as admins from "../admins.js";
import type * as ai_feedback from "../ai_feedback.js";
import type * as analytics from "../analytics.js";
import type * as app_config from "../app_config.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as backup_system from "../backup_system.js";
import type * as badges from "../badges.js";
import type * as careers from "../careers.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as demo from "../demo.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as evaluaciones from "../evaluaciones.js";
import type * as evaluator from "../evaluator.js";
import type * as faq from "../faq.js";
import type * as fcm from "../fcm.js";
import type * as feedback from "../feedback.js";
import type * as geminiClient from "../geminiClient.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as missions from "../missions.js";
import type * as notifications from "../notifications.js";
import type * as point_transfers from "../point_transfers.js";
import type * as quizzes from "../quizzes.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as rewards from "../rewards.js";
import type * as rutUtils from "../rutUtils.js";
import type * as streak_reminders from "../streak_reminders.js";
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
  admins: typeof admins;
  ai_feedback: typeof ai_feedback;
  analytics: typeof analytics;
  app_config: typeof app_config;
  attendance: typeof attendance;
  auth: typeof auth;
  backup_system: typeof backup_system;
  badges: typeof badges;
  careers: typeof careers;
  courses: typeof courses;
  crons: typeof crons;
  demo: typeof demo;
  documents: typeof documents;
  email: typeof email;
  evaluaciones: typeof evaluaciones;
  evaluator: typeof evaluator;
  faq: typeof faq;
  fcm: typeof fcm;
  feedback: typeof feedback;
  geminiClient: typeof geminiClient;
  groups: typeof groups;
  http: typeof http;
  messages: typeof messages;
  missions: typeof missions;
  notifications: typeof notifications;
  point_transfers: typeof point_transfers;
  quizzes: typeof quizzes;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  rewards: typeof rewards;
  rutUtils: typeof rutUtils;
  streak_reminders: typeof streak_reminders;
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
