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

-- DOCUMENTS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read documents" ON documents;
CREATE POLICY "Allow read documents" ON documents FOR SELECT USING (true);

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