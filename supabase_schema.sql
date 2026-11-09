-- ====================================================================
-- STUDYSPHERE AI - COMPLETE SUPABASE POSTGRESQL SCHEMA & PERMISSIONS SETUP
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Automatic User Registration Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || new.id
    ),
    COALESCE(new.created_at, timezone('utc'::text, now()))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT 'subj_' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'BookOpen',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    topic_count INTEGER DEFAULT 0,
    units_count INTEGER DEFAULT 4,
    color TEXT DEFAULT 'from-indigo-500 to-violet-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY DEFAULT 'top_' || substr(md5(random()::text), 1, 8),
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL CHECK (unit_number BETWEEN 1 AND 10),
    unit_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    notes_content TEXT,
    duration_mins INTEGER DEFAULT 45,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    questions_count INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Study Materials Table
CREATE TABLE IF NOT EXISTS public.study_materials (
    id TEXT PRIMARY KEY DEFAULT 'mat_' || substr(md5(random()::text), 1, 8),
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_number INTEGER DEFAULT 1,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'notes', 'question_paper', 'assignment', 'reference')),
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT 'PDF',
    is_published BOOLEAN DEFAULT true,
    uploader_name TEXT DEFAULT 'Faculty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT PRIMARY KEY DEFAULT 'q_' || substr(md5(random()::text), 1, 8),
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT 'qa_' || substr(md5(random()::text), 1, 8),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    score_percentage INTEGER NOT NULL CHECK (score_percentage BETWEEN 0 AND 100),
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Study Plans Table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id TEXT PRIMARY KEY DEFAULT 'task_' || substr(md5(random()::text), 1, 8),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name TEXT,
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'high' CHECK (priority IN ('high', 'medium', 'low')),
    duration_mins INTEGER DEFAULT 45,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Weak Topics Table
CREATE TABLE IF NOT EXISTS public.weak_topics (
    id TEXT PRIMARY KEY DEFAULT 'wt_' || substr(md5(random()::text), 1, 8),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    accuracy_percentage INTEGER NOT NULL CHECK (accuracy_percentage BETWEEN 0 AND 100),
    error_count INTEGER DEFAULT 1,
    last_attempted TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'critical' CHECK (status IN ('critical', 'moderate', 'improved'))
);

-- 11. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id TEXT PRIMARY KEY DEFAULT 'conv_' || substr(md5(random()::text), 1, 8),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id TEXT PRIMARY KEY DEFAULT 'msg_' || substr(md5(random()::text), 1, 8),
    conversation_id TEXT REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    learning_level TEXT DEFAULT 'intermediate' CHECK (learning_level IN ('beginner', 'intermediate', 'exam_focused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Subjects (Curriculum read open for all students, authenticated manage)
DROP POLICY IF EXISTS "Users can manage own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow public read of subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all subjects" ON public.subjects;
CREATE POLICY "Allow public read of subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage subjects" ON public.subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Topics (Curriculum read open for all students, authenticated manage)
DROP POLICY IF EXISTS "Users can manage own topics" ON public.topics;
DROP POLICY IF EXISTS "Allow public read of topics" ON public.topics;
DROP POLICY IF EXISTS "Allow all topics" ON public.topics;
CREATE POLICY "Allow public read of topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage topics" ON public.topics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Study Materials (Published materials readable by all, author manages own)
DROP POLICY IF EXISTS "Users can manage own materials" ON public.study_materials;
DROP POLICY IF EXISTS "Allow public read of published materials" ON public.study_materials;
DROP POLICY IF EXISTS "Allow all study materials" ON public.study_materials;
CREATE POLICY "Allow read published study materials" ON public.study_materials FOR SELECT USING (is_published = true OR auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Allow author manage study materials" ON public.study_materials FOR ALL TO authenticated USING (user_id IS NULL OR auth.uid() = user_id) WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 5. Quiz Questions (Read access open for all students)
DROP POLICY IF EXISTS "Allow all quiz questions" ON public.quiz_questions;
CREATE POLICY "Allow read quiz questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Quiz Attempts (Strict User Data Isolation: users only access their own quiz results)
DROP POLICY IF EXISTS "Users view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users manage own quiz attempts" ON public.quiz_attempts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Study Plans (Strict User Data Isolation: users only manage their own tasks)
DROP POLICY IF EXISTS "Users manage own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Allow all study plans" ON public.study_plans;
CREATE POLICY "Users manage own study plans" ON public.study_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Weak Topics (Strict User Data Isolation: personalized diagnostic records)
DROP POLICY IF EXISTS "Users manage own weak topics" ON public.weak_topics;
DROP POLICY IF EXISTS "Allow all weak topics" ON public.weak_topics;
CREATE POLICY "Users manage own weak topics" ON public.weak_topics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. AI Conversations (Strict User Data Isolation: private student-AI chat sessions)
DROP POLICY IF EXISTS "Users manage own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Allow all AI conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own AI conversations" ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. AI Messages (Strict User Data Isolation: messages scoped to user's conversation)
DROP POLICY IF EXISTS "Users manage own AI messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Allow all AI messages" ON public.ai_messages;
CREATE POLICY "Users manage own AI messages" ON public.ai_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE public.ai_conversations.id = public.ai_messages.conversation_id
      AND public.ai_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE public.ai_conversations.id = public.ai_messages.conversation_id
      AND public.ai_conversations.user_id = auth.uid()
    )
  );

-- ====================================================================
-- PERMISSIONS & ROLES
-- ====================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ====================================================================
-- STORAGE BUCKETS CONFIGURATION & SECURITY
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Storage Insert" ON storage.objects;
CREATE POLICY "Storage Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Storage Update" ON storage.objects;
CREATE POLICY "Storage Update" ON storage.objects FOR UPDATE USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Storage Delete" ON storage.objects;
CREATE POLICY "Storage Delete" ON storage.objects FOR DELETE USING (bucket_id = 'study-materials');
