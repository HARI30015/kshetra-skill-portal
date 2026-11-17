-- Adaptive planner (2026-11-17): aim company + daily tasks + daily activity.
-- Run ONCE in the Supabase SQL Editor (or `supabase db push`).
-- Idempotent: safe to re-run.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aim_company text;

CREATE TABLE IF NOT EXISTS public.plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  week int NOT NULL,
  topic text NOT NULL,
  task_description text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  problems_solved int DEFAULT 0,
  tasks_completed int DEFAULT 0,
  login_count int DEFAULT 0,
  UNIQUE(profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_profile ON public.plan_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_profile ON public.daily_activity(profile_id);

ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_tasks_select_own_or_lecturer"
  ON public.plan_tasks FOR SELECT
  USING (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "plan_tasks_upsert_own_or_lecturer"
  ON public.plan_tasks FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "plan_tasks_update_own_or_lecturer"
  ON public.plan_tasks FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_lecturer())
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "plan_tasks_delete_lecturer"
  ON public.plan_tasks FOR DELETE
  USING (public.is_lecturer());

CREATE POLICY "daily_activity_select_own_or_lecturer"
  ON public.daily_activity FOR SELECT
  USING (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "daily_activity_upsert_own_or_lecturer"
  ON public.daily_activity FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());

CREATE POLICY "daily_activity_update_own_or_lecturer"
  ON public.daily_activity FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_lecturer())
  WITH CHECK (profile_id = auth.uid() OR public.is_lecturer());
