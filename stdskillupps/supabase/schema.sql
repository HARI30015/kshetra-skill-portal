-- stdskillupps — Supabase schema
-- Run in the SQL editor (or via psql) against your Supabase project.
-- Requires: pgcrypto (for gen_random_uuid) — enabled by default on Supabase.

-- ============================================================
-- Extensions & grants
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- Helper: is_lecturer()
-- SECURITY DEFINER to avoid infinite recursion on profiles policies.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'lecturer'
  );
$$;

-- ============================================================
-- Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'lecturer')),
  full_name text,
  email text,
  year int CHECK (year BETWEEN 1 AND 4),
  target_field text,
  leetcode_username text,
  campustrack_username text,
  campustrack_score numeric,
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  role text NOT NULL,
  job_field text NOT NULL,
  languages text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  notes text,
  package_lpa numeric,
  location text,
  drive_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_stats (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  leetcode_total_solved int DEFAULT 0,
  leetcode_easy int DEFAULT 0,
  leetcode_medium int DEFAULT 0,
  leetcode_hard int DEFAULT 0,
  language_stats jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  year int,
  recommended_languages text[] DEFAULT '{}',
  focus_areas text[] DEFAULT '{}',
  plan text,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_placements_job_field ON public.placements(job_field);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON public.recommendations(profile_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- ---------------- profiles ----------------
-- Students: read/update their own row. Lecturers: full access.
CREATE POLICY "profiles_select_own_or_lecturer"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_lecturer());

CREATE POLICY "profiles_update_own_or_lecturer"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_lecturer())
  WITH CHECK (id = auth.uid() OR public.is_lecturer());

CREATE POLICY "profiles_insert_own_or_lecturer"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_lecturer());

CREATE POLICY "profiles_delete_lecturer"
  ON public.profiles FOR DELETE
  USING (public.is_lecturer());

-- ---------------- placements ----------------
-- Any authenticated user can read. Only lecturers can write.
CREATE POLICY "placements_select_authenticated"
  ON public.placements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "placements_lecturer_insert"
  ON public.placements FOR INSERT
  WITH CHECK (public.is_lecturer());

CREATE POLICY "placements_lecturer_update"
  ON public.placements FOR UPDATE
  USING (public.is_lecturer())
  WITH CHECK (public.is_lecturer());

CREATE POLICY "placements_lecturer_delete"
  ON public.placements FOR DELETE
  USING (public.is_lecturer());

-- ---------------- student_stats ----------------
-- Students: read/update their own. Lecturers: full access.
CREATE POLICY "student_stats_select_own_or_lecturer"
  ON public.student_stats FOR SELECT
  USING (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "student_stats_upsert_own_or_lecturer"
  ON public.student_stats FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "student_stats_update_own_or_lecturer"
  ON public.student_stats FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_lecturer())
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "student_stats_delete_lecturer"
  ON public.student_stats FOR DELETE
  USING (public.is_lecturer());

-- ---------------- recommendations ----------------
-- Students: read their own. Lecturers: full access.
CREATE POLICY "recommendations_select_own_or_lecturer"
  ON public.recommendations FOR SELECT
  USING (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "recommendations_lecturer_insert"
  ON public.recommendations FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "recommendations_lecturer_delete"
  ON public.recommendations FOR DELETE
  USING (public.is_lecturer());
