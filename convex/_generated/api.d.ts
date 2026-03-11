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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as courses from "../courses.js";
import type * as documents from "../documents.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as missions from "../missions.js";
import type * as notifications from "../notifications.js";
import type * as point_transfers from "../point_transfers.js";
import type * as quizzes from "../quizzes.js";
import type * as rewards from "../rewards.js";
import type * as rutUtils from "../rutUtils.js";
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
  analytics: typeof analytics;
  auth: typeof auth;
  courses: typeof courses;
  documents: typeof documents;
  groups: typeof groups;
  http: typeof http;
  missions: typeof missions;
  notifications: typeof notifications;
  point_transfers: typeof point_transfers;
  quizzes: typeof quizzes;
  rewards: typeof rewards;
  rutUtils: typeof rutUtils;
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
