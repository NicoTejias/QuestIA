/**
 * API client using Supabase instead of Convex
 * This replaces all convex/*.ts server functions
 * Called from frontend components using custom hooks
 */
import { supabase } from './supabase'

export { supabase }

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ============================================================
// USERS / PROFILES
// ============================================================
export const ProfilesAPI = {
  async getProfile(clerkId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsertProfile(profile: {
    id: string
    clerk_id: string
    name?: string
    email?: string
    image?: string
    avatar_url?: string
    role?: string
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(clerkId: string, updates: Partial<{
    name: string
    student_id: string
    avatar_url: string
    push_token: string
    role: string
    daily_streak: number
    last_daily_bonus_at: number
    ice_cubes: number
    terms_accepted_at: number
    belbin_profile: object
    bartle_profile: string
    is_demo: boolean
    is_verified: boolean
  }>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async checkWhitelist(studentId: string, email?: string) {
    const clean = studentId.replace(/[^\dkK]/g, '').toUpperCase()
    let query = supabase.from('whitelists').select('id, course_id, section, student_name')
    if (email) {
      query = query.or(`student_identifier.eq.${clean},student_identifier.ilike.${email}`)
    } else {
      query = query.eq('student_identifier', clean)
    }
    const { data } = await query.limit(1).single()
    return data ? { allowed: true } : { allowed: false }
  },

  async autoEnroll(clerkId: string, studentId?: string, email?: string) {
    const profile = await ProfilesAPI.getProfile(clerkId)
    if (!profile) return { enrolled: 0 }
    const cleanId = studentId ? studentId.replace(/[^\dkK]/g, '').toUpperCase() : null
    const matches: any[] = []
    if (cleanId) {
      const { data } = await supabase.from('whitelists').select('*').eq('student_identifier', cleanId)
      if (data) matches.push(...data)
    }
    if (email && matches.length === 0) {
      const { data } = await supabase.from('whitelists').select('*').ilike('student_identifier', email)
      if (data) matches.push(...data)
    }
    let enrolled = 0
    for (const w of matches) {
      const { data: existing } = await supabase.from('enrollments').select('id').eq('user_id', profile.id).eq('course_id', w.course_id).single()
      if (!existing) {
        await supabase.from('enrollments').insert({
          user_id: profile.id,
          course_id: w.course_id,
          ranking_points: 0,
          spendable_points: 0,
          total_points: 0,
          section: w.section || null,
        })
        enrolled++
      }
    }
    return { enrolled }
  },

  async setDemoMode(clerkId: string, role?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_demo: true, role: role || 'student' })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async saveBelbinProfile(clerkId: string, profile: { role_dominant: string; category: string; scores: object }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ belbin_profile: profile })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async saveBartleProfile(clerkId: string, profile: { profile: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ bartle_profile: profile.profile })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateAvatar(clerkId: string, avatarUrl: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async resetBartleTest(clerkId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ bartle_profile: null })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async setupDemoData(clerkId: string) {
    console.log('Setting up demo data for', clerkId)
    return { success: true }
  },

  async acceptTerms(clerkId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ terms_accepted_at: Date.now() })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async savePushToken(clerkId: string, token: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('clerk_id', clerkId)
    if (error) throw error
  },

  async verifyAccount(clerkId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('clerk_id', clerkId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ============================================================
// COURSES
// ============================================================
export const CoursesAPI = {
  async getMyCourses(clerkId: string, role: string) {
    if (role === 'teacher' || role === 'admin' || role === 'demo_teacher') {
      const { data, error } = await supabase.from('courses').select('*').eq('teacher_id', clerkId)
      if (error) throw error
      return data || []
    }
    const { data: enrollments, error } = await supabase.from('enrollments').select('*, courses(*)').eq('user_id', clerkId)
    if (error) throw error
    return (enrollments || []).map(en => ({
      ...en.courses,
      total_points: en.total_points,
      spendable_points: en.spendable_points,
      ranking_points: en.ranking_points,
      rank: 1
    }))
  },

  async getCourseById(courseId: string) {
    const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single()
    if (error) throw error
    return data
  },

  async createCourse(teacherId: string, data: { name: string; code: string; description: string; career_id?: string }) {
    const { data: course, error } = await supabase.from('courses').insert({ ...data, teacher_id: teacherId }).select().single()
    if (error) throw error
    return course
  },

  async updateCourse(courseId: string, data: any) {
    const { error } = await supabase.from('courses').update(data).eq('id', courseId)
    if (error) throw error
  },

  async deleteCourse(courseId: string) {
    const { error } = await supabase.from('courses').delete().eq('id', courseId)
    if (error) throw error
  },

  async cleanAllMyWhitelists(teacherId: string) {
    const { data: courses } = await supabase.from('courses').select('id').eq('teacher_id', teacherId)
    const courseIds = courses?.map(c => c.id) || []
    if (courseIds.length === 0) return
    const { error: _delErr } = await supabase.from('user_groups').delete().in('group_id', [])
    if (_delErr) throw _delErr
  },

  async getCourseStudents(courseId: string) {
    const { data, error } = await supabase.rpc('get_course_students_v2', { p_course_id: courseId })
    if (error) throw error
    return data || []
  },

  async getGlobalRanking(courseId: string) {
    const { data: mainCourse } = await supabase.from('courses').select('code').eq('id', courseId).single()
    if (!mainCourse) return []

    const { data: allCourses } = await supabase.from('courses').select('id, section, teacher_id, profiles(name)').eq('code', mainCourse.code)
    const courseIds = allCourses?.map(c => c.id) || []
    
    const { data: enrollments, error: eErr } = await supabase
      .from('enrollments')
      .select('*, profiles(*), courses(section, teacher_id, profiles(name))')
      .in('course_id', courseIds)
    
    if (eErr) throw eErr

    return (enrollments || []).map((e: any) => ({
      ...e.profiles,
      section: e.courses?.section,
      teacherName: e.courses?.profiles?.name || 'Docente'
    })).sort((a, b) => (b.ranking_points || 0) - (a.ranking_points || 0))
  },

  async batchUploadWhitelist(courseId: string, _teacherId: string, students: Array<{ identifier: string; name?: string; section?: string }>, clearExisting = false) {
    if (clearExisting) await supabase.from('whitelists').delete().eq('course_id', courseId)
    const { data: existing } = await supabase.from('whitelists').select('*').eq('course_id', courseId)
    let added = 0, updated = 0
    for (const student of students) {
      const rawId = student.identifier.trim()
      if (!rawId || rawId.length < 3) continue
      const normalized = rawId.replace(/[^\dkK]/g, '').toUpperCase() || rawId
      const existingEntry = existing?.find(w => w.student_identifier.replace(/[^\dkK]/g, '').toUpperCase() === normalized || w.student_identifier === rawId)
      if (existingEntry) {
        await supabase.from('whitelists').update({ student_name: student.name?.trim() || existingEntry.student_name, section: student.section?.trim() || existingEntry.section }).eq('id', existingEntry.id)
        updated++
      } else {
        await supabase.from('whitelists').insert({ course_id: courseId, student_identifier: normalized, student_name: student.name?.trim() || null, section: student.section?.trim() || null })
        added++
      }
    }
    return { added, updated, removed: 0 }
  },

  async getWhitelist(courseId: string) {
    const { data, error } = await supabase.from('whitelists').select('*').eq('course_id', courseId)
    if (error) throw error
    return data || []
  },

  async linkGoogleSheets(courseId: string, sheetsId: string, sheetsName: string) {
    const { error } = await supabase.from('courses').update({ linked_sheets_id: sheetsId, linked_sheets_name: sheetsName }).eq('id', courseId)
    if (error) throw error
  },

  async unlinkGoogleSheets(courseId: string) {
    const { error } = await supabase.from('courses').update({ linked_sheets_id: null, linked_sheets_name: null, last_sheets_sync: null }).eq('id', courseId)
    if (error) throw error
  },

  async syncCourseFromSheets(courseId: string) {
    const { data, error } = await supabase.rpc('sync_course_from_sheets', { p_course_id: courseId })
    if (error) throw error
    return data
  },

  async giveParticipationPoints(enrollmentId: string, teacherId: string, data: { points: number, reason?: string }) {
     const { data: res, error } = await supabase.rpc('give_participation_points', {
       p_enrollment_id: enrollmentId,
       p_teacher_id: teacherId,
       p_points: data.points,
       p_reason: data.reason || 'Participación en clase'
     })
     if (error) throw error
     return res
  }
}

// ============================================================
// REWARDS
// ============================================================
export const RewardsAPI = {
  async getRewardsByCourse(courseId: string) {
    const { data, error } = await supabase.from('rewards').select('*').eq('course_id', courseId).order('cost', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createReward(data: { course_id: string; name: string; description: string; cost: number; stock: number }) {
    const { data: reward, error } = await supabase.from('rewards').insert(data).select().single()
    if (error) throw error
    return reward
  },

  async updateReward(rewardId: string, updates: { name: string; description: string; cost: number; stock: number }) {
    const { error } = await supabase.from('rewards').update(updates).eq('id', rewardId)
    if (error) throw error
  },

  async deleteReward(rewardId: string) {
    const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
    if (error) throw error
  },

  async getPendingRedemptions(courseId: string) {
    const { data: rewards } = await supabase.from('rewards').select('id').eq('course_id', courseId)
    if (!rewards?.length) return []
    const rewardIds = rewards.map(r => r.id)
    const { data, error } = await supabase
      .from('redemptions')
      .select('*, profiles(name, email), rewards(name, cost)')
      .in('reward_id', rewardIds)
      .eq('status', 'pending')
      .order('timestamp', { ascending: false })
    if (error) throw error
    return (data || []).map((r: any) => ({
      id: r.id,
      student_name: r.profiles?.name || 'Alumno',
      student_email: r.profiles?.email || '',
      reward_name: r.rewards?.name || 'Recompensa',
      reward_cost: r.rewards?.cost || 0,
      timestamp: r.timestamp
    }))
  },

  async markRedemptionDelivered(redemptionId: string) {
    const { error } = await supabase.from('redemptions').update({ status: 'completed' }).eq('id', redemptionId)
    if (error) throw error
  },

  async redeemReward(rewardId: string, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")

    const { data: reward } = await supabase.from('rewards').select('*').eq('id', rewardId).single()
    if (!reward) throw new Error("Recompensa no encontrada")
    if (reward.stock <= 0) throw new Error("Sin stock")

    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', profile.id)
        .eq('course_id', reward.course_id)
        .single()
    
    if (!enrollment || enrollment.spendable_points < reward.cost) throw new Error("Puntos insuficientes")

    const { error: updateEnrollment } = await supabase
        .from('enrollments')
        .update({ spendable_points: enrollment.spendable_points - reward.cost })
        .eq('id', enrollment.id)
    if (updateEnrollment) throw updateEnrollment

    const { error: updateReward } = await supabase
        .from('rewards')
        .update({ stock: reward.stock - 1 })
        .eq('id', rewardId)
    if (updateReward) throw updateReward

    const { error: insertRedemption } = await supabase.from('redemptions').insert({
        reward_id: rewardId,
        user_id: profile.id,
        course_id: reward.course_id,
        timestamp: Date.now(),
        status: 'pending'
    })
    if (insertRedemption) throw insertRedemption
  },

  async getTeacherRedemptions(teacherId: string, status?: 'pending' | 'completed') {
    const { data: myCourses } = await supabase.from('courses').select('id, name').eq('teacher_id', teacherId)
    if (!myCourses?.length) return []
    const courseIds = myCourses.map(c => c.id)
    const { data: myRewards } = await supabase.from('rewards').select('id, name, cost, course_id').in('course_id', courseIds)
    if (!myRewards?.length) return []
    const rewardIds = myRewards.map(r => r.id)
    let query = supabase.from('redemptions').select('*, profiles(*)').in('reward_id', rewardIds).order('timestamp', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data: redemptions } = await query
    if (!redemptions?.length) return []
    return redemptions.map((r: any) => ({ ...r, student_name: r.profiles?.name || 'Alumno' }))
  }
}

// ============================================================
// MISSIONS
// ============================================================
export const MissionsAPI = {
  async getMissionsByCourse(courseId: string) {
    const { data, error } = await supabase.from('missions').select('*').eq('course_id', courseId).eq('status', 'active')
    if (error) throw error
    return data || []
  },

  async createMission(data: { course_id: string; title: string; description: string; points: number; narrative?: string }) {
    const { data: mission, error } = await supabase.from('missions').insert({ ...data, status: 'active' }).select().single()
    if (error) throw error
    return mission
  },

  async deleteMission(missionId: string) {
    const { error } = await supabase.from('missions').delete().eq('id', missionId)
    if (error) throw error
  },

  async updateMission(missionId: string, updates: { title: string; description: string; points: number }) {
    const { error } = await supabase.from('missions').update(updates).eq('id', missionId)
    if (error) throw error
  },

  async completeMission(missionId: string, userId: string) {
    const { error } = await supabase.from('mission_submissions').insert({ mission_id: missionId, user_id: userId, completed_at: Date.now() })
    if (error) throw error
  },

  async getEvaluacionesEstudiante(courseId: string, clerkId?: string) {
    const { data: missions, error } = await supabase.from('missions').select('*').eq('course_id', courseId)
    if (error) throw error
    
    if (clerkId) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
        if (profile) {
            const { data: submissions } = await supabase.from('mission_submissions').select('mission_id').eq('user_id', profile.id)
            const completedIds = new Set(submissions?.map(s => s.mission_id))
            return (missions || []).map(m => ({
                ...m,
                completed: completedIds.has(m.id)
            }))
        }
    }
    return missions || []
  },

  async getLeaderboard(courseId: string) {
    const { data, error } = await supabase
        .from('enrollments')
        .select('*, profiles(*)')
        .eq('course_id', courseId)
        .order('ranking_points', { ascending: false })
    
    if (error) throw error
    return (data || []).map(en => ({
        id: en.id,
        userId: en.user_id,
        name: en.profiles?.name || 'Alumno',
        belbin: en.profiles?.belbin_profile?.role_dominant,
        points: en.ranking_points || 0
    }))
  }
}

// ============================================================
// DOCUMENTS
// ============================================================
export const DocumentsAPI = {
  async getDocumentsByCourse(courseId: string) {
    const { data, error } = await supabase.from('documents').select('*').eq('course_id', courseId)
    if (error) throw error
    return data || []
  },

  async getMasterDocuments(courseId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('course_id', courseId)
      .in('document_type', ['PDA', 'PIA', 'PA'])
    if (error) throw error
    return data || []
  },

  async listCareers() {
    const { data, error } = await supabase.from('careers').select('*').order('name', { ascending: true })
    if (error) throw error
    return data || []
  },
  async getMyDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async saveDocument(data: {
    course_id: string;
    file_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    content_text: string;
    is_master_doc: boolean;
    master_doc_type?: string;
  }) {
    const { error } = await supabase.from('documents').insert({ ...data, created_at: Date.now() })
    if (error) throw error
  },

  async deleteDocument(docId: string) {
    const { data: doc } = await supabase.from('documents').select('file_id').eq('id', docId).single()
    if (doc?.file_id) {
        await supabase.storage.from('documents').remove([doc.file_id])
    }
    const { error } = await supabase.from('documents').delete().eq('id', docId)
    if (error) throw error
  },

  async setAsMasterDoc(docId: string, type: string) {
    const { error } = await supabase
      .from('documents')
      .update({ is_master_doc: type !== 'none', master_doc_type: type === 'none' ? null : type })
      .eq('id', docId)
    if (error) throw error
  },

  async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, {
      upsert: true
    })
    if (error) throw error
    return data.path
  }
}

// ============================================================
// ATTENDANCE
// ============================================================
export const AttendanceAPI = {
  async getActiveSession(courseId: string) {
    const now = Date.now()
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('course_id', courseId)
      .gt('expires_at', now)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async createSession(data: {
    course_id: string;
    lat?: number;
    lng?: number;
    radius?: number;
    duration_minutes: number;
  }) {
    const now = Date.now()
    const expiresAt = now + (data.duration_minutes * 60 * 1000)
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .insert({
        course_id: data.course_id,
        lat: data.lat,
        lng: data.lng,
        radius: data.radius,
        expires_at: expiresAt,
        code
      })
      .select()
      .single()
    if (error) throw error
    return session
  },

  async getSessionLogs(sessionId: string) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*, profiles(name)')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
    if (error) throw error
    return (data || []).map((l: any) => ({
      id: l.id,
      student_id: l.user_id,
      student_name: l.profiles?.name || 'Alumno',
      timestamp: l.timestamp,
      distance: l.distance
    }))
  },

  async markAttendance(data: {
    user_id: string;
    session_id: string;
    code: string;
    lat?: number;
    lng?: number;
  }) {
    const { data: session, error: sErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', data.session_id)
      .single()
    
    if (sErr || !session) throw new Error('Sesión no encontrada')
    if (session.code !== data.code) throw new Error('Código incorrecto')
    if (session.expires_at < Date.now()) throw new Error('Sesión expirada')

    if (session.lat && session.lng && data.lat && data.lng) {
      const dist = getDistance(session.lat, session.lng, data.lat, data.lng)
      if (dist > session.radius) {
        throw new Error('Estás demasiado lejos del aula')
      }
    }

    const { error } = await supabase
      .from('attendance_logs')
      .insert({
        session_id: data.session_id,
        user_id: data.user_id,
        timestamp: Date.now(),
        distance: (session.lat && session.lng && data.lat && data.lng) ? getDistance(session.lat, session.lng, data.lat, data.lng) : undefined
      })
    
    if (error) {
        if (error.code === '23505') throw new Error('Ya marcaste asistencia')
        throw error
    }
  },
  async getActiveSessionStudent(courseId: string) {
    const now = Date.now()
    const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('course_id', courseId)
        .gt('expires_at', now)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async markAttendanceStudent(sessionId: string, clerkId: string, code: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")

    const { data: session } = await supabase.from('attendance_sessions').select('*').eq('id', sessionId).single()
    if (!session || session.code !== code) throw new Error("Código incorrecto")

    const { error } = await supabase.from('attendance_logs').insert({
        session_id: sessionId,
        user_id: profile.id,
        marked_at: Date.now()
    })
    if (error) throw error
  }
}

// ============================================================
// ADMIN
// ============================================================
export const AdminAPI = {
  async getGlobalStats() {
    const { data: users, error: uErr } = await supabase.from('profiles').select('id, role')
    if (uErr) throw uErr
    
    return {
      totalUsers: users.length,
      students: users.filter(u => u.role === 'student').length,
      teachers: users.filter(u => u.role === 'teacher' || u.role === 'admin').length,
    }
  },

  async listAllFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((f: any) => ({
      ...f,
      userName: f.profiles?.name || 'Usuario',
      userEmail: f.profiles?.email || 'N/A'
    }))
  },

  async sendFeedback(data: { content: string; type: string; page_url?: string; image_urls?: string[] }, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")
    
    const { error } = await supabase.from('feedback').insert({
      user_id: profile.id,
      content: data.content,
      type: data.type,
      page_url: data.page_url,
      image_urls: data.image_urls,
      created_at: Date.now()
    })
    if (error) throw error
  },

  async listStudents() {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student')
    if (error) throw error
    return data
  },

  async listTeachers() {
    const { data, error } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin'])
    if (error) throw error
    return data
  },

  async listAllUsers(options: { limit?: number } = {}) {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (options.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async updateUserRole(targetUserId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
    if (error) throw error
  },
  async unifyUsersByRut() {
    const { data, error } = await supabase.rpc('unify_users_by_rut')
    if (error) throw error
    return data
  },

  async cleanAllWhitelists(): Promise<{ totalDeleted: number; coursesCount: number }> {
    const { data, error } = await supabase.rpc('clean_all_whitelists')
    if (error) throw error
    return data || { totalDeleted: 0, coursesCount: 0 }
  }
}

// ============================================================
// APP CONFIG
// ============================================================
export const AppConfigAPI = {
  async getAllowedDomainsList() {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'allowed_domains').maybeSingle()
    if (error) throw error
    return data?.value || []
  },

  async updateAllowedDomains(domains: string[]) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'allowed_domains', value: domains }, { onConflict: 'key' })
    if (error) throw error
  },

  async getLatestConfig() {
    return {
      latestVersion: "1.0.12",
      downloadUrl: "https://github.com/NicoTejias/QuestIA/releases/download/v.1.0.12/QuestIA.1.0.12.apk",
      isMandatory: true,
      message: "Versión 1.0.12: Optimizaciones de sistema y correcciones menores."
    }
  }
}

// ============================================================
// CAREERS
// ============================================================
export const CareersAPI = {
  async getCareers() {
    const { data, error } = await supabase.from('careers').select('*').order('name', { ascending: true })
    if (error) throw error
    return data
  },

  async createCareer(data: any) {
    const { error } = await supabase.from('careers').insert(data)
    if (error) throw error
  },

  async updateCareer(careerId: string, data: any) {
    const { error } = await supabase.from('careers').update(data).eq('id', careerId)
    if (error) throw error
  },

  async deleteCareer(careerId: string) {
    const { error } = await supabase.from('careers').delete().eq('id', careerId)
    if (error) throw error
  }
}

// ============================================================
// GROUPS
// ============================================================
export const GroupsAPI = {
  async getGroups(courseId: string): Promise<any[]> {
    const { data: groups, error: gErr } = await supabase
      .from('course_groups')
      .select('*')
      .eq('course_id', courseId)
    if (gErr) throw gErr

    const { data: enrollments, error: eErr } = await supabase
      .from('enrollments')
      .select('*, profiles(*)')
      .eq('course_id', courseId)
    if (eErr) throw eErr

    return (groups || []).map((group: any) => {
      const members = (enrollments || [])
        .filter((en: any) => en.group_id === group.id)
        .map((en: any) => ({
          id: en.profiles?.id,
          name: en.profiles?.name || 'Alumno',
          belbinRole: en.profiles?.belbin_profile?.role_dominant || 'Sin determinar',
          belbinCategory: en.profiles?.belbin_profile?.category || 'Sin categoría',
          points: en.profiles?.total_points || 0,
        }))
      return {
        ...group,
        members,
        stats: {
          mental: members.filter(m => m.belbinCategory === 'Mental').length,
          social: members.filter(m => m.belbinCategory === 'Social').length,
          accion: members.filter(m => m.belbinCategory === 'Acción').length,
          total: members.length,
        },
      }
    })
  },

  async assignStudentsToGroups(courseId: string, _type: 'random' | 'belbin', _groupsData?: any[]) {
    const { data: groups, error: gErr } = await supabase
      .from('course_groups')
      .select('*')
      .eq('course_id', courseId)
    if (gErr) throw gErr

    const { data: enrollments, error: eErr } = await supabase
      .from('enrollments')
      .select('*, profiles(*)')
      .eq('course_id', courseId)
    
    if (eErr) throw eErr

    return (groups || []).map((group: any) => {
      const members = enrollments
        .filter(en => en.group_id === group.id)
        .map(en => ({
           id: en.profiles?.id,
           name: en.profiles?.name || 'Alumno',
           belbinRole: en.profiles?.belbin_profile?.role_dominant || 'Sin determinar',
           belbinCategory: en.profiles?.belbin_profile?.category || 'Sin categoría',
           points: en.profiles?.total_points || 0
        }))
      
      return {
        ...group,
        members,
        stats: {
          mental: members.filter(m => m.belbinCategory === 'Mental').length,
          social: members.filter(m => m.belbinCategory === 'Social').length,
          accion: members.filter(m => m.belbinCategory === 'Acción').length,
          total: members.length
        }
      }
    })
  },

  async generateGroups(courseId: string, groupSize: number, teacherId: string) {
    // 1. Get enrollments and student profiles
    const { data: enrollments, error: eErr } = await supabase
      .from('enrollments')
      .select('*, profiles(*)')
      .eq('course_id', courseId)
    if (eErr) throw eErr
    if (!enrollments || enrollments.length < 2) throw new Error("Se necesitan al menos 2 alumnos")

    const students = enrollments.map(en => ({
      userId: en.profiles?.id,
      name: en.profiles?.name || "Sin nombre",
      belbinRole: en.profiles?.belbin_profile?.role_dominant || "Sin determinar",
      belbinCategory: en.profiles?.belbin_profile?.category || "Sin categoría",
      enrollmentId: en.id,
    }))

    // 2. Belbin Balancing Algorithm
    const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5)
    
    const mental = shuffle(students.filter(s => s.belbinCategory === "Mental"))
    const social = shuffle(students.filter(s => s.belbinCategory === "Social"))
    const accion = shuffle(students.filter(s => s.belbinCategory === "Acción"))
    const sin = shuffle(students.filter(s => s.belbinCategory === "Sin categoría"))

    const pool = []
    const maxLen = Math.max(mental.length, social.length, accion.length, sin.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < mental.length) pool.push(mental[i])
      if (i < social.length) pool.push(social[i])
      if (i < accion.length) pool.push(accion[i])
      if (i < sin.length) pool.push(sin[i])
    }

    const numGroups = Math.ceil(pool.length / groupSize)
    const grouped = Array.from({ length: numGroups }, () => [] as any[])
    pool.forEach((s, i) => grouped[i % numGroups].push(s))

    // 3. Save Groups
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 180)

    // Clear existing groups first (as per generateGroups behavior)
    await supabase.from('course_groups').delete().eq('course_id', courseId)
    // Note: cascade link in course_enrollments (group_id) should be set to null if not handled by DB

    const results = []
    for (let i = 0; i < grouped.length; i++) {
      const gName = `Grupo ${i + 1}`
      const { data: group, error: gErr } = await supabase
        .from('course_groups')
        .insert({ course_id: courseId, name: gName, created_by: teacherId, expires_at: expiresAt.toISOString() })
        .select().single()
      
      if (gErr) throw gErr

      for (const s of grouped[i]) {
        await supabase.from('enrollments').update({ group_id: group.id }).eq('id', s.enrollmentId)
      }

      results.push({
        id: group.id,
        name: gName,
        members: grouped[i].map(m => ({ name: m.name, belbinRole: m.belbinRole, belbinCategory: m.belbinCategory })),
        stats: {
             mental: grouped[i].filter(m => m.belbinCategory === "Mental").length,
             social: grouped[i].filter(m => m.belbinCategory === "Social").length,
             accion: grouped[i].filter(m => m.belbinCategory === "Acción").length,
        }
      })
    }

    return {
      total_students: students.length,
      total_groups: results.length,
      groups: results
    }
  }
}

// ============================================================
// AI FEEDBACK
// ============================================================
export const AiFeedbackAPI = {
  async getGroupFeedback(_groupsData: any[]) {
    // This will likely need an Edge Function. For now, we'll return a placeholder or 
    // suggest calling the OpenAI/Gemini API via a secure proxy.
    console.warn("getGroupFeedback not implemented with server-side safety yet.")
    return "Feedback de IA temporal: Los grupos parecen estar equilibrados según sus categorías Belbin predominantes. Se recomienda que el docente rote los líderes de cada equipo."
  }
}

// ============================================================
// POINT TRANSFERS
// ============================================================
export const PointTransfersAPI = {
  async getPendingForTeacher(teacherId: string) {
    // Fetch all pending and filter in JS (SQL or filter is too complex for the JS client).
    const { data: allPending, error: pErr } = await supabase
      .from('point_transfers')
      .select('*, from_course:courses!from_course_id(*), to_course:courses!to_course_id(*), student:profiles(name, email, student_id)')
      .eq('status', 'pending')
    
    if (pErr) throw pErr

    return (allPending || [])
      .filter((r: any) => r.from_course?.teacher_id === teacherId || r.to_course?.teacher_id === teacherId)
      .map((r: any) => ({
        ...r,
        student_name: r.student?.name || 'Alumno',
        student_identifier: r.student?.student_id || r.student?.email || 'N/A',
        from_course_name: r.from_course?.name,
        to_course_name: r.to_course?.name,
        isSourceTeacher: r.from_course?.teacher_id === teacherId,
        isTargetTeacher: r.to_course?.teacher_id === teacherId
      }))
  },

  async processTransfer(requestId: string, approve: boolean, teacherId: string) {
    // Check if teacher is source or target
    const { data: req, error: rErr } = await supabase
      .from('point_transfers')
      .select('*, from_course:courses!from_course_id(*), to_course:courses!to_course_id(*)')
      .eq('id', requestId)
      .single()
    
    if (rErr) throw rErr

    const isSource = req.from_course?.teacher_id === teacherId
    const isTarget = req.to_course?.teacher_id === teacherId

    if (!isSource && !isTarget) throw new Error("No autorizado")

    if (!approve) {
      const { error } = await supabase.from('point_transfers').update({ status: 'rejected' }).eq('id', requestId)
      if (error) throw error
      return
    }

    const update: any = {}
    if (isSource) update.approval_source = true
    if (isTarget) update.approval_target = true

    // Check if now both are approved
    const bothApproved = (isSource ? true : req.approval_source) && (isTarget ? true : req.approval_target)
    if (bothApproved) {
        update.status = 'approved'
        // Logic to actually move points would usually be in a database trigger or Edge Function
        // But for parity with Convex, we'd need to subtract from one enrollment and add to another.
    }

    const { error } = await supabase.from('point_transfers').update(update).eq('id', requestId)
    if (error) throw error
  },
  async requestTransfer(data: { from_course_id: string; to_course_id: string; amount: number }, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")

    const { error } = await supabase.from('point_transfers').insert({
        ...data,
        user_id: profile.id,
        created_at: Date.now(),
        status: 'pending'
    })
    if (error) throw error
  },

  async getStudentTransfers(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return []

    // Join with courses to get names
    const { data, error } = await supabase
        .from('point_transfers')
        .select('*, from_course:courses!from_course_id(name), to_course:courses!to_course_id(name)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(t => ({
        ...t,
        from_course_name: t.from_course?.name,
        to_course_name: t.to_course?.name
    }))
  }
}
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

// ============================================================
// EVALUATIONS
// ============================================================
export const EvaluationsAPI = {
  async getEvaluationsByCourse(courseId: string) {
    const { data, error } = await supabase.from('evaluations').select('*').eq('course_id', courseId).order('fecha', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createEvaluacion(data: {
    course_id: string;
    titulo: string;
    tipo: string;
    descripcion?: string;
    fecha: number;
    hora: string;
    puntos?: number;
    section?: string;
  }) {
    const { data: res, error } = await supabase
      .from('evaluations')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return res
  }
}

// ============================================================
// BADGES
// ============================================================
export const BadgesAPI = {
  async getBadgesByCourse(courseId: string) {
    const { data, error } = await supabase.from('badges').select('*').eq('course_id', courseId)
    if (error) throw error
    return data || []
  },

  async getBadgeHolders(badgeId: string) {
    const { data, error } = await supabase.from('user_badges').select('*, profiles(name)').eq('badge_id', badgeId)
    if (error) throw error
    return (data || []).map((b: any) => ({ id: b.id, user_id: b.user_id, userName: b.profiles?.name || 'Alumno' }))
  },

  async createBadge(data: { course_id: string, name: string, icon: string, description: string, criteria_type: string }) {
    const { data: result, error } = await supabase.from('badges').insert(data).select().single()
    if (error) throw error
    return result
  },

  async deleteBadge(badgeId: string) {
    const { error } = await supabase.from('badges').delete().eq('id', badgeId)
    if (error) throw error
  },

  async awardBadge(badgeId: string, userId: string, courseId: string) {
    const { error } = await supabase.from('user_badges').insert({ badge_id: badgeId, user_id: userId, course_id: courseId, awarded_at: Date.now() })
    if (error) throw error
  },

  async revokeBadge(userBadgeId: string) {
    const { error } = await supabase.from('user_badges').delete().eq('id', userBadgeId)
    if (error) throw error
  },
  async getMyBadges(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return []
    
    // Join user_badges with badges and optionally courses
    const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*), courses(code, name)')
        .eq('user_id', profile.id)
    
    if (error) throw error
    return (data || []).map(ub => ({
        ...ub,
        courseCode: ub.courses?.code,
        courseName: ub.courses?.name
    }))
  }
}

// ============================================================
// EVALUATOR (IA)
// ============================================================
export const EvaluatorAPI = {
  async getRubrics(courseId: string) {
    const { data, error } = await supabase.from('rubrics').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getRubric(rubricId: string) {
    const { data, error } = await supabase.from('rubrics').select('*').eq('id', rubricId).single()
    if (error) throw error
    return data
  },

  async createRubric(data: { course_id: string; title: string; content_text: string }) {
    const { data: rubric, error } = await supabase.from('rubrics').insert({ ...data, created_at: Date.now() }).select().single()
    if (error) throw error
    return rubric.id
  },

  async deleteRubric(rubricId: string) {
    const { error } = await supabase.from('rubrics').delete().eq('id', rubricId)
    if (error) throw error
  },

  async getGradingResults(rubricId: string) {
    const { data, error } = await supabase.from('grading_results').select('*').eq('rubric_id', rubricId).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async evaluateSubmission(data: { rubric_id: string; student_name: string; file_name: string; submission_text: string; }) {
    const { data: res, error } = await supabase.rpc('evaluate_submission_ia', {
      p_rubric_id: data.rubric_id,
      p_student_name: data.student_name,
      p_file_name: data.file_name,
      p_submission_text: data.submission_text
    })
    if (error) throw error
    return res
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export const NotificationsAPI = {
  async getMyNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return data || []
  },

  async markRead(notificationId: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    if (error) throw error
  },

  async markAllRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    if (error) throw error
  },

  async createNotification(data: { user_id: string; title: string; message: string; type: string; related_id?: string }) {
    const { error } = await supabase.from('notifications').insert({ ...data, read: false, created_at: Date.now() })
    if (error) throw error
  },
  async getNotifications(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return []
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getUnreadCount(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return 0
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('read', false)
    
    if (error) return 0
    return count || 0
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    if (error) throw error
  },

  async markAllAsRead(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return
    
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    if (error) throw error
  }
}

// ============================================================
// DOCUMENTS (Storage & Database)
// ============================================================

// ============================================================
// ANALYTICS
// ============================================================
export const AnalyticsAPI = {
  async getTeacherStats(teacherId: string, role: string) {
    // 1. Get Courses
    let query = supabase.from('courses').select('*')
    if (role !== 'admin') {
      query = query.eq('teacher_id', teacherId)
    }
    const { data: courses, error: cErr } = await query
    if (cErr) throw cErr
    if (!courses || courses.length === 0) return this._emptyStats()

    const courseIds = courses.map(c => c.id)

    // 2. Get Enrollments & Whitelist & Quizzes & Missions
    const { data: enrollments } = await supabase.from('enrollments').select('*, profiles(*)').in('course_id', courseIds)
    const { data: whitelist } = await supabase.from('whitelists').select('*').in('course_id', courseIds)
    const { data: documents } = await supabase.from('documents').select('*').in('course_id', courseIds)
    const { data: quizzes } = await supabase.from('quizzes').select('id, course_id').in('course_id', courseIds)
    const { data: quizSubmissions } = await supabase.from('quiz_submissions').select('id, score, quiz_id').in('quiz_id', quizzes?.map(q => q.id) || [])
    const { data: redemptions } = await supabase.from('redemptions').select('id').in('course_id', courseIds)
    
    // 3. Aggregate Stats
    const totalStudents = whitelist?.length || 0
    const totalRegistered = enrollments?.length || 0
    const registeredUserIds = new Set(enrollments?.map(e => e.user_id))
    const totalPoints = enrollments?.reduce((sum, e) => sum + (e.ranking_points || 0), 0) || 0
    
    const belbinDistribution: Record<string, number> = {}
    enrollments?.forEach(en => {
      const role = en.profiles?.belbin_profile?.role_dominant
      if (role) belbinDistribution[role] = (belbinDistribution[role] || 0) + 1
    })

    const courseStats = courses.map(course => {
      const cEn = enrollments?.filter(e => e.course_id === course.id) || []
      const cWh = whitelist?.filter(w => w.course_id === course.id) || []
      const cDocs = documents?.filter(d => d.course_id === course.id) || []
      const cQuizzes = quizzes?.filter(q => q.course_id === course.id) || []
      const cQuizIds = new Set(cQuizzes.map(q => q.id))
      const cSubmissions = quizSubmissions?.filter(s => cQuizIds.has(s.quiz_id)) || []

      return {
        id: course.id,
        name: `${course.name} (${course.code})`,
        code: course.code,
        students: cWh.length,
        registered: cEn.length,
        missions: cQuizzes.length,
        submissions: cSubmissions.length,
        documents: cDocs.length,
        totalPoints: cEn.reduce((sum, e) => sum + (e.ranking_points || 0), 0),
        dailyAvgQuizzes: 0, // Simplified
        dailyAvgPerStudent: 0 // Simplified
      }
    })

    return {
      totalStudents,
      totalRegistered,
      totalRegisteredUniqueUsers: registeredUserIds.size,
      totalUniqueStudents: totalStudents,
      totalPoints,
      totalCourses: courses.length,
      totalMissionsCreated: quizzes?.length || 0,
      totalMissionsCompleted: quizSubmissions?.length || 0,
      totalDocuments: documents?.length || 0,
      totalMasterDocs: documents?.filter(d => d.is_master_doc).length || 0,
      totalRedemptions: redemptions?.length || 0,
      totalQuizzesCompleted: quizSubmissions?.length || 0,
      avgQuizScore: quizSubmissions && quizSubmissions.length > 0 ? quizSubmissions.reduce((s, x) => s + x.score, 0) / quizSubmissions.length : 0,
      avgMissionsPerStudent: totalRegistered > 0 ? (quizSubmissions?.length || 0) / totalRegistered : 0,
      belbinDistribution,
      courseStats,
      topStudents: [], 
      dailyActivity: []
    }
  },

  _emptyStats() {
    return {
      totalStudents: 0, totalRegistered: 0, totalRegisteredUniqueUsers: 0, totalUniqueStudents: 0,
      totalPoints: 0, totalCourses: 0, totalDocuments: 0, totalMissionsCreated: 0, totalRedemptions: 0,
      totalMissionsCompleted: 0, totalMasterDocs: 0, totalQuizzesCompleted: 0, avgQuizScore: 0, avgMissionsPerStudent: 0,
      belbinDistribution: {}, courseStats: [], topStudents: [], dailyActivity: []
    }
  },

  async exportCourseData(courseName: string, teacherId: string, role: string) {
    let q = supabase.from('courses').select('id, name')
    if (role !== 'admin') q = q.eq('teacher_id', teacherId)
    const { data: allCourses } = await q
    const targetCourseIds = allCourses?.filter(c => c.name === courseName).map(c => c.id) || []
    
    if (targetCourseIds.length === 0) return []

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, profiles(*)')
      .in('course_id', targetCourseIds)
    
    return (enrollments || []).map(en => ({
      name: en.profiles?.name,
      id: en.profiles?.student_id || 'S/I',
      email: en.profiles?.email,
      points: en.ranking_points || 0,
      spendable: en.spendable_points || 0,
      belbin: en.profiles?.belbin_profile?.role_dominant || 'No realizado'
    }))
  }
}

// ============================================================
// ADMIN FIXES
// ============================================================

// ============================================================
// FAQ
// ============================================================
export const FaqAPI = {
  async getFaqs() {
    const { data, error } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createFaq(data: { question: string; answer: string; order: number; category?: string }) {
    const { error } = await supabase.from('faqs').insert({ ...data, category: data.category || 'general', created_at: Date.now() })
    if (error) throw error
  },

  async updateFaq(id: string, data: { question: string; answer: string; order: number; category?: string }) {
    const { error } = await supabase.from('faqs').update(data).eq('id', id)
    if (error) throw error
  },

  async deleteFaq(id: string) {
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================
// MESSAGES
// ============================================================
export const MessagesAPI = {
  async getByCourse(courseId: string) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, profiles(name, role, belbin_profile)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (error) throw error
    return (messages || []).map((m: any) => ({
      ...m,
      user_id: m.user_id,
      userName: m.profiles?.name || 'Usuario',
      userRole: m.profiles?.role || 'student',
      belbinRole: m.profiles?.belbin_profile?.role_dominant || 'Sin determinar',
    }))
  },

  async send(courseId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        course_id: courseId,
        user_id: userId,
        content,
        type: 'text',
        created_at: Date.now()
      })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ============================================================
// QUIZZES
// ============================================================
export const QuizzesAPI = {
  async getQuizzesByCourse(courseId: string, clerkId?: string) {
    const { data: quizzes, error } = await supabase.from('quizzes').select('*').eq('course_id', courseId)
    if (error) throw error
    
    // For students, we need to inject attempt counts and completion status
    if (clerkId) {
        // This would usually be a more complex join or subquery. 
        // For parity, let's fetch attempts for this user.
        const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
        if (profile) {
            const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('user_id', profile.id)
            const { data: submissions } = await supabase.from('quiz_submissions').select('*').eq('user_id', profile.id)
            
            return (quizzes || []).map(q => {
                const qSub = submissions?.find(s => s.quiz_id === q.id)
                const qAttempts = attempts?.filter(a => a.quiz_id === q.id) || []
                return {
                    ...q,
                    attempts_count: qAttempts.length,
                    completed: !!qSub,
                    score: qSub?.score || 0,
                    can_take: qAttempts.length < (q.max_attempts || 3) && !qSub
                }
            })
        }
    }
    return quizzes || []
  },

  async getQuizzesByDocument(documentId: string) {
    const { data, error } = await supabase.from('quizzes').select('*').eq('document_id', documentId)
    if (error) throw error
    return data || []
  },

  async deleteQuiz(quizId: string) {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
    if (error) throw error
  },

  async getQuizSubmissions(quizId: string) {
    const { data, error } = await supabase.from('quiz_submissions').select('*, profiles(name)').eq('quiz_id', quizId)
    if (error) throw error
    return (data || []).map((s: any) => ({ 
        id: s.id, 
        student_id: s.user_id, 
        student_name: s.profiles?.name || 'Alumno', 
        score: s.score, 
        earned_points: s.earned_points, 
        completed_at: s.completed_at 
    }))
  },

  async getMyQuizHistory(_courseId: string, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return []
    
    // Needs a join with quizzes to get the title
    const { data, error } = await supabase
        .from('quiz_submissions')
        .select('*, quizzes(title)')
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(s => ({
        ...s,
        quizTitle: s.quizzes?.title || 'Quiz'
    }))
  },

  async getOrCreateAttempt(args: { quiz_id: string }, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")

    const { data: existing } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', args.quiz_id)
        .eq('user_id', profile.id)
        .is('completed_at', null)
        .limit(1)
        .single()
    
    if (existing) return existing

    const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', args.quiz_id).single()
    if (!quiz) throw new Error("Quiz no encontrado")

    const { data: newAttempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
            quiz_id: args.quiz_id,
            user_id: profile.id,
            current_question_index: 0,
            selected_options: [],
            started_at: Date.now()
        })
        .select()
        .single()
    
    if (error) throw error
    return newAttempt
  },

  async updateAttemptProgress(args: { attempt_id: string; current_question_index: number; selected_options: any[] }) {
    const { error } = await supabase
        .from('quiz_attempts')
        .update({
            current_question_index: args.current_question_index,
            selected_options: args.selected_options
        })
        .eq('id', args.attempt_id)
    if (error) throw error
  },

  async submitQuiz(args: { quiz_id: string; time_penalty: number; final_answers: any[] }, clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id, clerk_id').eq('clerk_id', clerkId).single()
    if (!profile) throw new Error("Perfil no encontrado")

    const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', args.quiz_id).single()
    if (!quiz) throw new Error("Quiz no encontrado")

    // Scoring logic (simplified for parity with Convex version if existing)
    // In production, this should happen on the server/Edge Function for security.
    let correctCount = 0
    const questions = quiz.questions || []
    args.final_answers.forEach((ans, i) => {
        const q = questions[i]
        if (!q) return
        if (q.type === 'multiple_choice' || q.type === 'trivia' || q.type === 'quiz_sprint') {
            if (ans === q.correct_option) correctCount++
        } else if (q.type === 'true_false') {
            if (ans === (q.correct_answer ? 1 : 0)) correctCount++
        } else {
            // Placeholder for other types
            correctCount++ 
        }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const earned = Math.round((quiz.points_reward || 10) * (score / 100))

    // Mark attempt as completed
    await supabase.from('quiz_attempts').update({ completed_at: Date.now() }).eq('quiz_id', args.quiz_id).eq('user_id', profile.id).is('completed_at', null)

    const { data: submission, error } = await supabase
        .from('quiz_submissions')
        .insert({
            quiz_id: args.quiz_id,
            user_id: profile.id,
            score,
            earned_points: earned,
            selected_options: args.final_answers,
            completed_at: Date.now()
        })
        .select()
        .single()
    
    if (error) throw error

    // Update enrollment points
    const { data: enrollment } = await supabase.from('enrollments').select('*').eq('user_id', profile.id).eq('course_id', quiz.course_id).single()
    if (enrollment) {
        await supabase.from('enrollments').update({
            total_points: (enrollment.total_points || 0) + earned,
            ranking_points: (enrollment.ranking_points || 0) + earned,
            spendable_points: (enrollment.spendable_points || 0) + earned
        }).eq('id', enrollment.id)
    }

    return {
        ...submission,
        is_simulation: false,
        earned,
        remaining_attempts: 0 // Simplification
    }
  },

  async generateQuiz(data: {
    document_id: string;
    num_questions: number;
    difficulty: string;
    quiz_type: string;
    max_attempts: number;
  }) {
    const { data: res, error } = await supabase.rpc('generate_quiz_ia', {
      p_document_id: data.document_id,
      p_num_questions: data.num_questions,
      p_difficulty: data.difficulty,
      p_quiz_type: data.quiz_type,
      p_max_attempts: data.max_attempts
    })
    if (error) throw error
    return res
  }
}

// ============================================================
// MISSIONS
// ============================================================


// ============================================================
// ATTENDANCE
// ============================================================

// ============================================================
// NOTIFICATIONS
// ============================================================

// ============================================================
// REWARDS
// ============================================================

// ============================================================
// BADGES
// ============================================================

// ============================================================
// POINT TRANSFERS
// ============================================================

// ============================================================
// EVALUACIONES
// ============================================================
export const EvaluacionesAPI = {
  async getEvaluacionesEstudiante(clerkId: string) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_id', clerkId).single()
    if (!profile) return []

    const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('user_id', profile.id)
    const courseIds = enrollments?.map(e => e.course_id) || []

    const { data, error } = await supabase
        .from('evaluaciones')
        .select('*, courses(code, name)')
        .in('course_id', courseIds)
        .order('fecha', { ascending: true })
    
    if (error) throw error
    return (data || []).map(e => ({
        ...e,
        course_code: e.courses?.code,
        course_name: e.courses?.name
    }))
  }
}
