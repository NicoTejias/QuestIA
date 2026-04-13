-- ============================================================
-- RLS Policies for Supabase Migration
-- Run these in Supabase SQL Editor
-- ============================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;
CREATE POLICY "Allow read profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert profiles" ON profiles;
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- FAQS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read faqs" ON faqs;
CREATE POLICY "Allow read faqs" ON faqs FOR SELECT USING (true);

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read messages" ON messages;
CREATE POLICY "Allow read messages" ON messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert messages" ON messages;
CREATE POLICY "Allow insert messages" ON messages FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read notifications" ON notifications;
CREATE POLICY "Allow read notifications" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow update notifications" ON notifications;
CREATE POLICY "Allow update notifications" ON notifications FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
CREATE POLICY "Allow insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read courses" ON courses;
CREATE POLICY "Allow read courses" ON courses FOR SELECT USING (true);

-- ENROLLMENTS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read enrollments" ON enrollments;
CREATE POLICY "Allow read enrollments" ON enrollments FOR SELECT USING (true);

-- QUIZZES
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read quizzes" ON quizzes;
CREATE POLICY "Allow read quizzes" ON quizzes FOR SELECT USING (true);

-- QUIZ SUBMISSIONS
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read quiz_submissions" ON quiz_submissions;
CREATE POLICY "Allow read quiz_submissions" ON quiz_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert quiz_submissions" ON quiz_submissions;
CREATE POLICY "Allow insert quiz_submissions" ON quiz_submissions FOR INSERT WITH CHECK (true);

-- REDEMPTIONS
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read redemptions" ON redemptions;
CREATE POLICY "Allow read redemptions" ON redemptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert redemptions" ON redemptions;
CREATE POLICY "Allow insert redemptions" ON redemptions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update redemptions" ON redemptions;
CREATE POLICY "Allow update redemptions" ON redemptions FOR UPDATE USING (true);

-- REWARDS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read rewards" ON rewards;
CREATE POLICY "Allow read rewards" ON rewards FOR SELECT USING (true);

-- COURSE DOCUMENTS (not "documents")
ALTER TABLE course_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read course_documents" ON course_documents;
CREATE POLICY "Allow read course_documents" ON course_documents FOR SELECT USING (true);

-- WHITELISTS
ALTER TABLE whitelists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read whitelists" ON whitelists;
CREATE POLICY "Allow read whitelists" ON whitelists FOR SELECT USING (true);

-- FEEDBACK
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read feedback" ON feedback;
CREATE POLICY "Allow read feedback" ON feedback FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert feedback" ON feedback;
CREATE POLICY "Allow insert feedback" ON feedback FOR INSERT WITH CHECK (true);

-- APP_CONFIG
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read app_config" ON app_config;
CREATE POLICY "Allow read app_config" ON app_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert app_config" ON app_config;
CREATE POLICY "Allow insert app_config" ON app_config FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update app_config" ON app_config;
CREATE POLICY "Allow update app_config" ON app_config FOR UPDATE USING (true);

-- COURSE_GROUPS
ALTER TABLE course_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read course_groups" ON course_groups;
CREATE POLICY "Allow read course_groups" ON course_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert course_groups" ON course_groups;
CREATE POLICY "Allow insert course_groups" ON course_groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update course_groups" ON course_groups;
CREATE POLICY "Allow update course_groups" ON course_groups FOR UPDATE USING (true);

-- MISSIONS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read missions" ON missions;
CREATE POLICY "Allow read missions" ON missions FOR SELECT USING (true);

-- MISSION SUBMISSIONS
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read mission_submissions" ON mission_submissions;
CREATE POLICY "Allow read mission_submissions" ON mission_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert mission_submissions" ON mission_submissions;
CREATE POLICY "Allow insert mission_submissions" ON mission_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update mission_submissions" ON mission_submissions;
CREATE POLICY "Allow update mission_submissions" ON mission_submissions FOR UPDATE USING (true);

-- BADGES
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read badges" ON badges;
CREATE POLICY "Allow read badges" ON badges FOR SELECT USING (true);

-- USER BADGES
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read user_badges" ON user_badges;
CREATE POLICY "Allow read user_badges" ON user_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert user_badges" ON user_badges;
CREATE POLICY "Allow insert user_badges" ON user_badges FOR INSERT WITH CHECK (true);

-- CAREERS
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read careers" ON careers;
CREATE POLICY "Allow read careers" ON careers FOR SELECT USING (true);

-- INSTITUTION CONFIG
ALTER TABLE institution_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read institution_config" ON institution_config;
CREATE POLICY "Allow read institution_config" ON institution_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow update institution_config" ON institution_config;
CREATE POLICY "Allow update institution_config" ON institution_config FOR UPDATE USING (true);

-- ADMINS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read admins" ON admins;
CREATE POLICY "Allow read admins" ON admins FOR SELECT USING (true);

-- POINT TRANSFER REQUESTS
ALTER TABLE point_transfer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read point_transfer_requests" ON point_transfer_requests;
CREATE POLICY "Allow read point_transfer_requests" ON point_transfer_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert point_transfer_requests" ON point_transfer_requests;
CREATE POLICY "Allow insert point_transfer_requests" ON point_transfer_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update point_transfer_requests" ON point_transfer_requests;
CREATE POLICY "Allow update point_transfer_requests" ON point_transfer_requests FOR UPDATE USING (true);

-- ATTENDANCE SESSIONS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read attendance_sessions" ON attendance_sessions;
CREATE POLICY "Allow read attendance_sessions" ON attendance_sessions FOR SELECT USING (true);

-- ATTENDANCE LOGS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read attendance_logs" ON attendance_logs;
CREATE POLICY "Allow read attendance_logs" ON attendance_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert attendance_logs" ON attendance_logs;
CREATE POLICY "Allow insert attendance_logs" ON attendance_logs FOR INSERT WITH CHECK (true);

-- GRADING RUBRICS
ALTER TABLE grading_rubrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read grading_rubrics" ON grading_rubrics;
CREATE POLICY "Allow read grading_rubrics" ON grading_rubrics FOR SELECT USING (true);

-- GRADING RESULTS
ALTER TABLE grading_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read grading_results" ON grading_results;
CREATE POLICY "Allow read grading_results" ON grading_results FOR SELECT USING (true);

-- EVALUACIONES
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read evaluaciones" ON evaluaciones;
CREATE POLICY "Allow read evaluaciones" ON evaluaciones FOR SELECT USING (true);

-- RATE LIMITS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read rate_limits" ON rate_limits;
CREATE POLICY "Allow read rate_limits" ON rate_limits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert rate_limits" ON rate_limits;
CREATE POLICY "Allow insert rate_limits" ON rate_limits FOR INSERT WITH CHECK (true);