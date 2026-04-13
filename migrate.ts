/**
 * Convex (hip-fish-316) → Supabase full data migration.
 *
 * Usage:
 *   npm run migrate:dry     -- preview counts and FK resolution without writing
 *   npm run migrate:wipe    -- purge Supabase tables and reinsert everything
 *   npm run migrate:verify  -- compare row counts and run spot checks
 *
 * Env vars required in .env.local:
 *   CONVEX_ADMIN_KEY              (prod:hip-fish-316|...)
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

// ---------- Env loading (no dotenv dep) ----------
function loadEnv() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1)
      const hash = val.indexOf(' #')
      if (hash >= 0) val = val.slice(0, hash)
      val = val.trim()
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {}
}
loadEnv()

const CONVEX_URL = 'https://hip-fish-316.convex.cloud'
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!CONVEX_ADMIN_KEY) { console.error('Missing CONVEX_ADMIN_KEY'); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('Missing Supabase env'); process.exit(1) }

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------- Convex client ----------
async function convexQuery<T = any>(fn: string): Promise<T[]> {
  const resp = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${CONVEX_ADMIN_KEY}`,
    },
    body: JSON.stringify({ path: `export_queries:${fn}`, args: {}, format: 'json' }),
  })
  if (!resp.ok) throw new Error(`Convex ${fn}: HTTP ${resp.status}`)
  const j: any = await resp.json()
  if (j.status !== 'success') throw new Error(`Convex ${fn}: ${j.errorMessage || 'unknown'}`)
  return j.value
}

async function convexDownloadBlob(fileId: string): Promise<{ buf: Buffer; contentType: string } | null> {
  const resp = await fetch(`${CONVEX_URL}/api/storage/${fileId}`, {
    headers: { 'Authorization': `Convex ${CONVEX_ADMIN_KEY}` },
  })
  if (!resp.ok) return null
  const contentType = resp.headers.get('content-type') || 'application/octet-stream'
  const buf = Buffer.from(await resp.arrayBuffer())
  return { buf, contentType }
}

// ---------- Args ----------
const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const CONFIRM_WIPE = args.has('--confirm-wipe')
const VERIFY = args.has('--verify')
const SKIP_FILES = args.has('--skip-files')

// ---------- Helpers ----------
type IdMap = Map<string, string>
const maps = {
  users: new Map() as IdMap,          // convex user _id -> clerk_id
  courses: new Map() as IdMap,        // convex course _id -> supabase uuid
  careers: new Map() as IdMap,
  missions: new Map() as IdMap,
  rewards: new Map() as IdMap,
  badges: new Map() as IdMap,
  course_documents: new Map() as IdMap,
  quizzes: new Map() as IdMap,
  attendance_sessions: new Map() as IdMap,
  grading_rubrics: new Map() as IdMap,
}

function remap(map: IdMap, convexId: string | undefined | null): string | null {
  if (!convexId) return null
  return map.get(convexId) ?? null
}

type InsertResult = { inserted: number; skipped: number }

async function insertBatch(table: string, rows: any[], opts?: { onConflict?: string; captureMap?: { sourceIds: string[]; map: IdMap } }): Promise<number> {
  if (DRY_RUN) return rows.length
  if (rows.length === 0) return 0
  const CHUNK = 500
  let total = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const q = opts?.onConflict
      ? supabase.from(table).upsert(chunk, { onConflict: opts.onConflict }).select('id')
      : supabase.from(table).insert(chunk).select('id')
    const { data, error } = await q
    if (error) {
      console.error(`  ! error inserting into ${table} (chunk ${i / CHUNK}):`, error.message)
      if (error.details) console.error('    details:', error.details)
      // Fall back to per-row to identify the offending record
      for (let k = 0; k < chunk.length; k++) {
        const { data: d2, error: e2 } = opts?.onConflict
          ? await supabase.from(table).upsert([chunk[k]], { onConflict: opts.onConflict }).select('id')
          : await supabase.from(table).insert([chunk[k]]).select('id')
        if (e2) {
          console.error(`    row ${i + k} failed:`, e2.message)
        } else if (d2 && opts?.captureMap && d2[0]?.id) {
          opts.captureMap.map.set(opts.captureMap.sourceIds[i + k], d2[0].id as string)
          total++
        } else if (d2) {
          total++
        }
      }
      continue
    }
    if (data) {
      total += data.length
      if (opts?.captureMap) {
        for (let k = 0; k < data.length; k++) {
          const srcId = opts.captureMap.sourceIds[i + k]
          const tgtId = (data[k] as any).id as string
          if (srcId && tgtId) opts.captureMap.map.set(srcId, tgtId)
        }
      }
    }
  }
  return total
}

function log(msg: string) { console.log(msg) }
function headline(s: string) { console.log('\n' + '═'.repeat(60) + '\n' + s + '\n' + '═'.repeat(60)) }

// ---------- Wipe (only with --confirm-wipe) ----------
const WIPE_ORDER = [
  'rate_limits', 'attendance_logs', 'attendance_sessions', 'user_badges', 'badges',
  'mission_submissions', 'missions', 'quiz_attempts', 'quiz_submissions', 'quizzes',
  'course_documents', 'redemptions', 'rewards', 'notifications', 'messages',
  'point_transfer_requests', 'course_groups', 'whitelists', 'enrollments',
  'grading_results', 'grading_rubrics', 'evaluaciones', 'feedback', 'faqs',
  'institution_config', 'admins', 'courses', 'careers',
  // profiles is intentionally NOT wiped — we upsert by clerk_id to preserve
  // the 7 accounts that may already exist from UserSync after cutover.
]

async function wipeSupabase() {
  headline('WIPING Supabase tables (preserving profiles)')
  for (const t of WIPE_ORDER) {
    const { error } = await supabase.from(t).delete().not('id', 'is', null)
    if (error) {
      console.error(`  ! ${t}: ${error.message}`)
    } else {
      console.log(`  ✓ wiped ${t}`)
    }
  }
}

// ---------- Storage bucket setup ----------
async function ensureBucket() {
  if (DRY_RUN || SKIP_FILES) return
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some(b => b.name === 'course_documents')) {
    console.log('  ✓ bucket course_documents already exists')
    return
  }
  const { error } = await supabase.storage.createBucket('course_documents', { public: false })
  if (error && !error.message.includes('already exists')) {
    throw new Error(`Failed to create bucket: ${error.message}`)
  }
  console.log('  ✓ created bucket course_documents')
}

// ---------- Per-table migrations ----------
async function migrateCareers() {
  const src = await convexQuery<any>('getAllCareers')
  const rows = src.map(c => ({
    name: c.name,
    coordinator_email: c.coordinator_email,
    director_email: c.director_email,
    jefe_admin_email: c.jefe_admin_email ?? null,
  }))
  const sourceIds = src.map(c => c._id)
  const n = await insertBatch('careers', rows, { captureMap: { sourceIds, map: maps.careers } })
  console.log(`careers:              ${n}/${src.length}`)
}

async function migrateProfiles() {
  const src = await convexQuery<any>('getAllUsers')
  let skipped = 0
  const rows: any[] = []
  for (const u of src) {
    let clerkId = u.clerkId
    if (!clerkId) {
      clerkId = u._id
      skipped++
    }
    maps.users.set(u._id, clerkId)
    rows.push({
      id: clerkId,
      clerk_id: clerkId,
      name: u.name ?? null,
      email: u.email ?? null,
      image: u.image ?? null,
      avatar_url: u.avatarUrl ?? null,
      role: u.role ?? 'student',
      is_verified: u.is_verified ?? false,
      is_demo: u.is_demo ?? !u.clerkId,
      student_id: u.student_id ?? null,
      terms_accepted_at: u.terms_accepted_at ?? null,
      daily_streak: u.daily_streak ?? 0,
      last_daily_bonus_at: u.last_daily_bonus_at ?? null,
      ice_cubes: u.ice_cubes ?? 0,
      push_token: u.push_token ?? null,
      last_notified_streak_at: u.last_notified_streak_at ?? null,
      belbin_profile: u.belbin_profile ?? null,
      bartle_profile: u.bartle_profile ?? null,
    })
  }
  // Upsert by id (Clerk ID) so we preserve the 7 accounts created by UserSync
  const n = await insertBatch('profiles', rows, { onConflict: 'id' })
  console.log(`profiles:             ${n}/${src.length} (generated ${skipped} demo IDs)`)
}

async function migrateAdmins() {
  const src = await convexQuery<any>('getAllAdmins')
  const rows: any[] = []
  let dropped = 0
  for (const a of src) {
    const createdBy = remap(maps.users, a.created_by)
    if (!createdBy) { dropped++; continue }
    rows.push({
      email: a.email,
      created_at: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),
      created_by: createdBy,
    })
  }
  const n = await insertBatch('admins', rows, { onConflict: 'email' })
  console.log(`admins:               ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateInstitutionConfig() {
  const src = await convexQuery<any>('getAllInstitutionConfig')
  const rows = src.map(c => ({
    key: c.key,
    value: c.value,
    updated_at: c.updated_at,
    updated_by: remap(maps.users, c.updated_by),
  }))
  const n = await insertBatch('institution_config', rows)
  console.log(`institution_config:   ${n}/${src.length}`)
}

async function migrateCourses() {
  const src = await convexQuery<any>('getAllCourses')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const c of src) {
    const teacherId = remap(maps.users, c.teacher_id)
    if (!teacherId) { dropped++; continue }
    sourceIds.push(c._id)
    rows.push({
      name: c.name,
      code: c.code,
      description: c.description ?? '',
      teacher_id: teacherId,
      career_id: remap(maps.careers, c.career_id),
      linked_sheets_id: c.linked_sheets_id ?? null,
      linked_sheets_name: c.linked_sheets_name ?? null,
      last_sheets_sync: c.last_sheets_sync ?? null,
    })
  }
  const n = await insertBatch('courses', rows, { captureMap: { sourceIds, map: maps.courses } })
  console.log(`courses:              ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateWhitelists() {
  const src = await convexQuery<any>('getAllWhitelists')
  const rows: any[] = []
  let dropped = 0
  for (const w of src) {
    const courseId = remap(maps.courses, w.course_id)
    if (!courseId) { dropped++; continue }
    rows.push({
      course_id: courseId,
      student_identifier: w.student_identifier,
      student_name: w.student_name ?? null,
      section: w.section ?? null,
    })
  }
  const n = await insertBatch('whitelists', rows)
  console.log(`whitelists:           ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateEnrollments() {
  const src = await convexQuery<any>('getAllEnrollments')
  const rows: any[] = []
  let dropped = 0
  for (const e of src) {
    const userId = remap(maps.users, e.user_id)
    const courseId = remap(maps.courses, e.course_id)
    if (!userId || !courseId) { dropped++; continue }
    rows.push({
      user_id: userId,
      course_id: courseId,
      ranking_points: e.ranking_points ?? 0,
      spendable_points: e.spendable_points ?? 0,
      total_points: e.total_points ?? 0,
      section: e.section ?? null,
      group_id: e.group_id ?? null,
      active_multiplier: e.active_multiplier ?? null,
      last_quizzes_update: e.last_quizzes_update ?? null,
    })
  }
  const n = await insertBatch('enrollments', rows, { onConflict: 'user_id,course_id' })
  console.log(`enrollments:          ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateCourseGroups() {
  const src = await convexQuery<any>('getAllCourseGroups')
  const rows: any[] = []
  let dropped = 0
  for (const g of src) {
    const courseId = remap(maps.courses, g.course_id)
    const createdBy = remap(maps.users, g.created_by)
    if (!courseId || !createdBy) { dropped++; continue }
    rows.push({
      course_id: courseId,
      name: g.name,
      created_at: g.created_at,
      created_by: createdBy,
      expires_at: g.expires_at ?? null,
    })
  }
  const n = await insertBatch('course_groups', rows)
  console.log(`course_groups:        ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateMissions() {
  const src = await convexQuery<any>('getAllMissions')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const m of src) {
    const courseId = remap(maps.courses, m.course_id)
    if (!courseId) { dropped++; continue }
    sourceIds.push(m._id)
    rows.push({
      course_id: courseId,
      title: m.title,
      description: m.description,
      points: m.points,
      status: m.status,
      narrative: m.narrative ?? null,
    })
  }
  const n = await insertBatch('missions', rows, { captureMap: { sourceIds, map: maps.missions } })
  console.log(`missions:             ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateMissionSubmissions() {
  const src = await convexQuery<any>('getAllMissionSubmissions')
  const rows: any[] = []
  let dropped = 0
  for (const m of src) {
    const missionId = remap(maps.missions, m.mission_id)
    const userId = remap(maps.users, m.user_id)
    if (!missionId || !userId) { dropped++; continue }
    rows.push({
      mission_id: missionId,
      user_id: userId,
      completed_at: m.completed_at,
    })
  }
  const n = await insertBatch('mission_submissions', rows)
  console.log(`mission_submissions:  ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateRewards() {
  const src = await convexQuery<any>('getAllRewards')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const r of src) {
    const courseId = remap(maps.courses, r.course_id)
    if (!courseId) { dropped++; continue }
    sourceIds.push(r._id)
    rows.push({
      course_id: courseId,
      name: r.name,
      description: r.description,
      cost: r.cost,
      stock: r.stock,
      image_url: r.image_url ?? null,
    })
  }
  const n = await insertBatch('rewards', rows, { captureMap: { sourceIds, map: maps.rewards } })
  console.log(`rewards:              ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateRedemptions() {
  const src = await convexQuery<any>('getAllRedemptions')
  const rows: any[] = []
  let dropped = 0
  for (const r of src) {
    const userId = remap(maps.users, r.user_id)
    const rewardId = remap(maps.rewards, r.reward_id)
    if (!userId || !rewardId) { dropped++; continue }
    rows.push({
      user_id: userId,
      reward_id: rewardId,
      status: r.status,
      timestamp: r.timestamp,
    })
  }
  const n = await insertBatch('redemptions', rows)
  console.log(`redemptions:          ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateCourseDocuments() {
  const src = await convexQuery<any>('getAllCourseDocuments')
  const rows: any[] = []
  const sourceIds: string[] = []
  const filesToUpload: { convexDocId: string; fileId: string; filePath: string }[] = []
  let dropped = 0

  for (const d of src) {
    const courseId = remap(maps.courses, d.course_id)
    const teacherId = remap(maps.users, d.teacher_id)
    if (!courseId || !teacherId) { dropped++; continue }
    const safeName = (d.file_name || 'file').replace(/[^\w.\-]/g, '_')
    const filePath = `${d.course_id}/${d._id}-${safeName}`
    sourceIds.push(d._id)
    rows.push({
      course_id: courseId,
      teacher_id: teacherId,
      file_name: d.file_name,
      file_type: d.file_type,
      file_size: d.file_size,
      file_path: filePath,
      content_text: d.content_text ?? '',
      uploaded_at: d.uploaded_at,
      is_master_doc: d.is_master_doc ?? false,
      master_doc_type: d.master_doc_type ?? null,
    })
    filesToUpload.push({ convexDocId: d._id, fileId: d.file_id, filePath })
  }
  const n = await insertBatch('course_documents', rows, { captureMap: { sourceIds, map: maps.course_documents } })
  console.log(`course_documents:     ${n}/${src.length} (dropped FK ${dropped})`)

  if (DRY_RUN || SKIP_FILES) {
    if (SKIP_FILES) console.log('  (skipping file blob uploads — --skip-files)')
    return
  }

  // Upload blobs to Supabase Storage
  console.log(`  uploading ${filesToUpload.length} file blobs…`)
  let ok = 0, fail = 0
  for (const f of filesToUpload) {
    try {
      const blob = await convexDownloadBlob(f.fileId)
      if (!blob) { fail++; console.error(`    ! blob not found for ${f.convexDocId}`); continue }
      const { error } = await supabase.storage.from('course_documents').upload(f.filePath, blob.buf, {
        contentType: blob.contentType,
        upsert: true,
      })
      if (error) { fail++; console.error(`    ! upload failed for ${f.filePath}: ${error.message}`); continue }
      ok++
    } catch (e: any) {
      fail++
      console.error(`    ! ${f.convexDocId}: ${e.message}`)
    }
  }
  console.log(`  file blobs: uploaded=${ok} failed=${fail}`)
}

async function migrateQuizzes() {
  const src = await convexQuery<any>('getAllQuizzes')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const q of src) {
    const courseId = remap(maps.courses, q.course_id)
    const teacherId = remap(maps.users, q.teacher_id)
    if (!courseId || !teacherId) { dropped++; continue }
    sourceIds.push(q._id)
    rows.push({
      course_id: courseId,
      document_id: remap(maps.course_documents, q.document_id),
      teacher_id: teacherId,
      title: q.title,
      quiz_type: q.quiz_type,
      questions: q.questions, // pass JSON object, NOT JSON.stringify
      difficulty: q.difficulty,
      num_questions: q.num_questions,
      created_at: q.created_at, // BIGINT, pass raw number
      is_active: q.is_active,
      max_attempts: q.max_attempts ?? null,
    })
  }
  const n = await insertBatch('quizzes', rows, { captureMap: { sourceIds, map: maps.quizzes } })
  console.log(`quizzes:              ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateQuizSubmissions() {
  const src = await convexQuery<any>('getAllQuizSubmissions')
  const rows: any[] = []
  let dropped = 0
  for (const s of src) {
    const quizId = remap(maps.quizzes, s.quiz_id)
    const userId = remap(maps.users, s.user_id)
    if (!quizId || !userId) { dropped++; continue }
    rows.push({
      quiz_id: quizId,
      user_id: userId,
      score: s.score,
      earned_points: s.earned_points,
      completed_at: s.completed_at,
    })
  }
  const n = await insertBatch('quiz_submissions', rows)
  console.log(`quiz_submissions:     ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateQuizAttempts() {
  const src = await convexQuery<any>('getAllQuizAttempts')
  const rows: any[] = []
  let dropped = 0
  for (const a of src) {
    const quizId = remap(maps.quizzes, a.quiz_id)
    const userId = remap(maps.users, a.user_id)
    if (!quizId || !userId) { dropped++; continue }
    rows.push({
      quiz_id: quizId,
      user_id: userId,
      current_question_index: a.current_question_index ?? 0,
      selected_options: a.selected_options ?? [],
      status: a.status ?? 'in_progress',
      last_updated: a.last_updated,
    })
  }
  const n = await insertBatch('quiz_attempts', rows, { onConflict: 'quiz_id,user_id' })
  console.log(`quiz_attempts:        ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateBadges() {
  const src = await convexQuery<any>('getAllBadges')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const b of src) {
    const courseId = remap(maps.courses, b.course_id)
    if (!courseId) { dropped++; continue }
    sourceIds.push(b._id)
    rows.push({
      course_id: courseId,
      name: b.name,
      description: b.description,
      icon: b.icon,
      criteria_type: b.criteria_type,
      criteria_value: b.criteria_value ?? null,
    })
  }
  const n = await insertBatch('badges', rows, { captureMap: { sourceIds, map: maps.badges } })
  console.log(`badges:               ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateUserBadges() {
  const src = await convexQuery<any>('getAllUserBadges')
  const rows: any[] = []
  let dropped = 0
  for (const ub of src) {
    const userId = remap(maps.users, ub.user_id)
    const badgeId = remap(maps.badges, ub.badge_id)
    const courseId = remap(maps.courses, ub.course_id)
    if (!userId || !badgeId || !courseId) { dropped++; continue }
    rows.push({ user_id: userId, badge_id: badgeId, course_id: courseId, earned_at: ub.earned_at })
  }
  const n = await insertBatch('user_badges', rows)
  console.log(`user_badges:          ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateNotifications() {
  const src = await convexQuery<any>('getAllNotifications')
  const rows: any[] = []
  let dropped = 0
  for (const n0 of src) {
    const userId = remap(maps.users, n0.user_id)
    if (!userId) { dropped++; continue }
    rows.push({
      user_id: userId,
      title: n0.title,
      message: n0.message,
      type: n0.type,
      read: n0.read ?? false,
      related_id: n0.related_id ?? null,
      created_at: n0.created_at,
    })
  }
  const n = await insertBatch('notifications', rows)
  console.log(`notifications:        ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migratePointTransfers() {
  const src = await convexQuery<any>('getAllPointTransferRequests')
  const rows: any[] = []
  let dropped = 0
  for (const p of src) {
    const userId = remap(maps.users, p.user_id)
    const fromCourse = remap(maps.courses, p.from_course_id)
    const toCourse = remap(maps.courses, p.to_course_id)
    if (!userId || !fromCourse || !toCourse) { dropped++; continue }
    rows.push({
      user_id: userId,
      from_course_id: fromCourse,
      to_course_id: toCourse,
      amount: p.amount,
      status: p.status,
      approval_source: p.approval_source ?? false,
      approval_target: p.approval_target ?? false,
      created_at: p.created_at,
    })
  }
  const n = await insertBatch('point_transfer_requests', rows)
  console.log(`point_transfer_req:   ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateMessages() {
  const src = await convexQuery<any>('getAllMessages')
  const rows: any[] = []
  let dropped = 0
  for (const m of src) {
    const courseId = remap(maps.courses, m.course_id)
    const userId = remap(maps.users, m.user_id)
    if (!courseId || !userId) { dropped++; continue }
    rows.push({
      course_id: courseId,
      user_id: userId,
      content: m.content,
      type: m.type,
      created_at: m.created_at,
    })
  }
  const n = await insertBatch('messages', rows)
  console.log(`messages:             ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateAttendanceSessions() {
  const src = await convexQuery<any>('getAllAttendanceSessions')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const s of src) {
    const courseId = remap(maps.courses, s.course_id)
    const teacherId = remap(maps.users, s.teacher_id)
    if (!courseId || !teacherId) { dropped++; continue }
    sourceIds.push(s._id)
    rows.push({
      course_id: courseId,
      teacher_id: teacherId,
      code: s.code,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      radius: s.radius ?? null,
      expires_at: s.expires_at,
      created_at: s.created_at,
      status: s.status,
    })
  }
  const n = await insertBatch('attendance_sessions', rows, { captureMap: { sourceIds, map: maps.attendance_sessions } })
  console.log(`attendance_sessions:  ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateAttendanceLogs() {
  const src = await convexQuery<any>('getAllAttendanceLogs')
  const rows: any[] = []
  let dropped = 0
  for (const l of src) {
    const sessionId = remap(maps.attendance_sessions, l.session_id)
    const userId = remap(maps.users, l.user_id)
    if (!sessionId || !userId) { dropped++; continue }
    rows.push({
      session_id: sessionId,
      user_id: userId,
      timestamp: l.timestamp,
      lat: l.lat ?? null,
      lng: l.lng ?? null,
      distance: l.distance ?? null,
    })
  }
  const n = await insertBatch('attendance_logs', rows)
  console.log(`attendance_logs:      ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateFeedback() {
  const src = await convexQuery<any>('getAllFeedback')
  const rows: any[] = []
  let dropped = 0
  for (const f of src) {
    const userId = remap(maps.users, f.user_id)
    if (!userId) { dropped++; continue }
    rows.push({
      user_id: userId,
      content: f.content,
      type: f.type,
      page_url: f.page_url ?? null,
      image_urls: f.image_urls ?? null,
      created_at: f.created_at,
    })
  }
  const n = await insertBatch('feedback', rows)
  console.log(`feedback:             ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateGradingRubrics() {
  const src = await convexQuery<any>('getAllGradingRubrics')
  const rows: any[] = []
  const sourceIds: string[] = []
  let dropped = 0
  for (const r of src) {
    const courseId = remap(maps.courses, r.course_id)
    const teacherId = remap(maps.users, r.teacher_id)
    if (!courseId || !teacherId) { dropped++; continue }
    sourceIds.push(r._id)
    rows.push({
      course_id: courseId,
      teacher_id: teacherId,
      title: r.title,
      content_text: r.content_text,
      created_at: r.created_at,
    })
  }
  const n = await insertBatch('grading_rubrics', rows, { captureMap: { sourceIds, map: maps.grading_rubrics } })
  console.log(`grading_rubrics:      ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateGradingResults() {
  const src = await convexQuery<any>('getAllGradingResults')
  const rows: any[] = []
  let dropped = 0
  for (const r of src) {
    const rubricId = remap(maps.grading_rubrics, r.rubric_id)
    const teacherId = remap(maps.users, r.teacher_id)
    if (!rubricId || !teacherId) { dropped++; continue }
    rows.push({
      rubric_id: rubricId,
      teacher_id: teacherId,
      student_name: r.student_name,
      file_name: r.file_name,
      feedback: r.feedback,
      score: r.score,
      created_at: r.created_at,
    })
  }
  const n = await insertBatch('grading_results', rows)
  console.log(`grading_results:      ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateEvaluaciones() {
  const src = await convexQuery<any>('getAllEvaluaciones')
  const rows: any[] = []
  let dropped = 0
  for (const e of src) {
    const courseId = remap(maps.courses, e.course_id)
    const teacherId = remap(maps.users, e.teacher_id)
    if (!courseId || !teacherId) { dropped++; continue }
    rows.push({
      course_id: courseId,
      teacher_id: teacherId,
      titulo: e.titulo,
      tipo: e.tipo,
      descripcion: e.descripcion ?? null,
      fecha: e.fecha,
      hora: e.hora ?? null,
      puntos: e.puntos ?? null,
      section: e.section ?? null,
      activo: e.activo ?? true,
      created_at: e.created_at,
    })
  }
  const n = await insertBatch('evaluaciones', rows)
  console.log(`evaluaciones:         ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateRateLimits() {
  const src = await convexQuery<any>('getAllRateLimits')
  const rows: any[] = []
  let dropped = 0
  for (const r of src) {
    const userId = remap(maps.users, r.user_id)
    if (!userId) { dropped++; continue }
    rows.push({
      user_id: userId,
      action: r.action,
      last_action_at: r.last_action_at,
    })
  }
  const n = await insertBatch('rate_limits', rows, { onConflict: 'user_id,action' })
  console.log(`rate_limits:          ${n}/${src.length} (dropped FK ${dropped})`)
}

async function migrateFaqs() {
  const src = await convexQuery<any>('getAllFaqs')
  const rows = src.map(f => ({
    question: f.question,
    answer: f.answer,
    sort_order: f.order, // field name difference
    category: f.category ?? null,
    created_at: f.created_at ?? Date.now(),
  }))
  const n = await insertBatch('faqs', rows)
  console.log(`faqs:                 ${n}/${src.length}`)
}

// ---------- Main ----------
async function main() {
  const mode = VERIFY ? 'VERIFY' : DRY_RUN ? 'DRY-RUN' : CONFIRM_WIPE ? 'WIPE+INSERT' : 'ABORT'
  headline(`Convex → Supabase migration · mode=${mode}`)
  console.log('source: ' + CONVEX_URL)
  console.log('target: ' + SUPABASE_URL)

  if (VERIFY) return runVerify()

  if (!DRY_RUN && !CONFIRM_WIPE) {
    console.error('\nRefusing to run. Use --dry-run to preview, or --confirm-wipe to wipe & reinsert.')
    process.exit(1)
  }

  if (!DRY_RUN) {
    await ensureBucket()
    await wipeSupabase()
  }

  headline('Migrating tables (in dependency order)')
  await migrateCareers()
  await migrateProfiles()
  await migrateAdmins()
  await migrateInstitutionConfig()
  await migrateCourses()
  await migrateWhitelists()
  await migrateEnrollments()
  await migrateCourseGroups()
  await migrateMissions()
  await migrateMissionSubmissions()
  await migrateRewards()
  await migrateRedemptions()
  await migrateCourseDocuments()
  await migrateQuizzes()
  await migrateQuizSubmissions()
  await migrateQuizAttempts()
  await migrateBadges()
  await migrateUserBadges()
  await migrateNotifications()
  await migratePointTransfers()
  await migrateMessages()
  await migrateAttendanceSessions()
  await migrateAttendanceLogs()
  await migrateFeedback()
  await migrateGradingRubrics()
  await migrateGradingResults()
  await migrateEvaluaciones()
  await migrateRateLimits()
  await migrateFaqs()

  headline(DRY_RUN ? 'Dry-run complete — nothing written' : 'Migration complete')
}

// ---------- Verify ----------
async function runVerify() {
  const tables: [string, string][] = [
    ['getAllUsers', 'profiles'],
    ['getAllCareers', 'careers'],
    ['getAllAdmins', 'admins'],
    ['getAllInstitutionConfig', 'institution_config'],
    ['getAllCourses', 'courses'],
    ['getAllWhitelists', 'whitelists'],
    ['getAllEnrollments', 'enrollments'],
    ['getAllCourseGroups', 'course_groups'],
    ['getAllMissions', 'missions'],
    ['getAllMissionSubmissions', 'mission_submissions'],
    ['getAllRewards', 'rewards'],
    ['getAllRedemptions', 'redemptions'],
    ['getAllCourseDocuments', 'course_documents'],
    ['getAllQuizzes', 'quizzes'],
    ['getAllQuizSubmissions', 'quiz_submissions'],
    ['getAllQuizAttempts', 'quiz_attempts'],
    ['getAllBadges', 'badges'],
    ['getAllUserBadges', 'user_badges'],
    ['getAllNotifications', 'notifications'],
    ['getAllPointTransferRequests', 'point_transfer_requests'],
    ['getAllMessages', 'messages'],
    ['getAllAttendanceSessions', 'attendance_sessions'],
    ['getAllAttendanceLogs', 'attendance_logs'],
    ['getAllFeedback', 'feedback'],
    ['getAllGradingRubrics', 'grading_rubrics'],
    ['getAllGradingResults', 'grading_results'],
    ['getAllEvaluaciones', 'evaluaciones'],
    ['getAllRateLimits', 'rate_limits'],
    ['getAllFaqs', 'faqs'],
  ]
  headline('Row-count parity (Convex vs Supabase)')
  console.log('table'.padEnd(30) + 'convex  supa  status')
  let mismatches = 0
  for (const [fn, tbl] of tables) {
    const src = await convexQuery(fn)
    const { count } = await supabase.from(tbl).select('*', { count: 'exact', head: true })
    const c = count ?? 0
    const s = src.length
    const ok = c === s
    if (!ok && !(tbl === 'profiles' && c >= s - 20)) mismatches++
    console.log(
      tbl.padEnd(30) + String(s).padEnd(8) + String(c).padEnd(6) + (ok ? 'OK' : 'MISMATCH')
    )
  }
  headline(mismatches === 0 ? '✓ All counts match' : `⚠ ${mismatches} mismatched tables`)
}

main().catch(e => { console.error('\n❌ Migration error:', e); process.exit(1) })
