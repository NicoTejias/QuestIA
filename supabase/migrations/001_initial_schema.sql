-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CAREERS
-- ============================================================
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  coordinator_email TEXT NOT NULL,
  director_email TEXT NOT NULL,
  jefe_admin_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_careers_name ON careers(name);

-- ============================================================
-- PROFILES (replaces Convex users)
-- id = Clerk user ID (e.g. "user_xxxxx")
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  image TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  student_id TEXT,
  clerk_id TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  terms_accepted_at BIGINT,
  daily_streak INTEGER DEFAULT 0,
  last_daily_bonus_at BIGINT,
  ice_cubes INTEGER DEFAULT 0,
  push_token TEXT,
  last_notified_streak_at BIGINT,
  belbin_profile JSONB,
  bartle_profile TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES profiles(id)
);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ============================================================
-- INSTITUTION CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS institution_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  updated_by TEXT REFERENCES profiles(id)
);
CREATE INDEX IF NOT EXISTS idx_institution_config_key ON institution_config(key);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  career_id UUID REFERENCES careers(id),
  linked_sheets_id TEXT,
  linked_sheets_name TEXT,
  last_sheets_sync BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);

-- ============================================================
-- WHITELISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS whitelists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_identifier TEXT NOT NULL,
  student_name TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whitelists_course_id ON whitelists(course_id);
CREATE INDEX IF NOT EXISTS idx_whitelists_student_identifier ON whitelists(student_identifier);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  ranking_points NUMERIC DEFAULT 0 NOT NULL,
  spendable_points NUMERIC DEFAULT 0 NOT NULL,
  total_points NUMERIC DEFAULT 0,
  section TEXT,
  group_id TEXT,
  active_multiplier NUMERIC,
  last_quizzes_update BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_ranking ON enrollments(course_id, ranking_points DESC);

-- ============================================================
-- MISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_missions_course_id ON missions(course_id);

-- ============================================================
-- MISSION SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS mission_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_mission_id ON mission_submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_user_id ON mission_submissions(user_id);

-- ============================================================
-- REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rewards_course_id ON rewards(course_id);

-- ============================================================
-- REDEMPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_course_id ON redemptions(course_id);

-- ============================================================
-- COURSE DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  content_text TEXT NOT NULL,
  uploaded_at BIGINT NOT NULL,
  is_master_doc BOOLEAN DEFAULT FALSE,
  master_doc_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_documents_course_id ON course_documents(course_id);
CREATE INDEX IF NOT EXISTS idx_course_documents_teacher_id ON course_documents(teacher_id);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  document_id UUID REFERENCES course_documents(id),
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  quiz_type TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL,
  num_questions INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_attempts INTEGER
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_document_id ON quizzes(document_id);

-- ============================================================
-- QUIZ SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  earned_points INTEGER NOT NULL,
  completed_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_user ON quiz_submissions(quiz_id, user_id);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_question_index INTEGER DEFAULT 0,
  selected_options JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress',
  last_updated BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_status ON quiz_attempts(user_id, status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id TEXT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- POINT TRANSFER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS point_transfer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_course_id UUID NOT NULL REFERENCES courses(id),
  to_course_id UUID NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  approval_source BOOLEAN DEFAULT FALSE,
  approval_target BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_point_transfers_user_id ON point_transfer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transfers_from_course ON point_transfer_requests(from_course_id, status);
CREATE INDEX IF NOT EXISTS idx_point_transfers_to_course ON point_transfer_requests(to_course_id, status);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_course_id ON messages(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_course_time ON messages(course_id, created_at);

-- ============================================================
-- ATTENDANCE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  radius NUMERIC,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  status TEXT DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_course_id ON attendance_sessions(course_id);

-- ============================================================
-- ATTENDANCE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  timestamp BIGINT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  distance NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session_id ON attendance_logs(session_id);

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_badges_course_id ON badges(course_id);

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  earned_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_course ON user_badges(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================================
-- FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  page_url TEXT,
  image_urls JSONB,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- ============================================================
-- GRADING RUBRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS grading_rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_course_id ON grading_rubrics(course_id);

-- ============================================================
-- GRADING RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS grading_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID NOT NULL REFERENCES grading_rubrics(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  student_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  feedback TEXT NOT NULL,
  score NUMERIC NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grading_results_rubric_id ON grading_results(rubric_id);

-- ============================================================
-- FAQS
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  category TEXT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);

-- ============================================================
-- EVALUACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  fecha BIGINT NOT NULL,
  hora TEXT,
  puntos INTEGER,
  section TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_course_id ON evaluaciones(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON evaluaciones(fecha);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_teacher_id ON evaluaciones(teacher_id);

-- ============================================================
-- RATE LIMITS
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  last_action_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);

-- ============================================================
-- COURSE GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  created_by TEXT NOT NULL REFERENCES profiles(id),
  expires_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_course_groups_course_id ON course_groups(course_id);

-- ============================================================
-- ROW LEVEL SECURITY (Enable on all tables)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: service_role bypasses all RLS
-- (Our backend API will use service_role key)
-- ============================================================
DROP POLICY IF EXISTS "Service role full access" ON profiles;
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON courses;
CREATE POLICY "Service role full access" ON courses FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON whitelists;
CREATE POLICY "Service role full access" ON whitelists FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON enrollments;
CREATE POLICY "Service role full access" ON enrollments FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON rewards;
CREATE POLICY "Service role full access" ON rewards FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON redemptions;
CREATE POLICY "Service role full access" ON redemptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON missions;
CREATE POLICY "Service role full access" ON missions FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON mission_submissions;
CREATE POLICY "Service role full access" ON mission_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON quizzes;
CREATE POLICY "Service role full access" ON quizzes FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON quiz_submissions;
CREATE POLICY "Service role full access" ON quiz_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON quiz_attempts;
CREATE POLICY "Service role full access" ON quiz_attempts FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON notifications;
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON course_documents;
CREATE POLICY "Service role full access" ON course_documents FOR ALL USING (true);
