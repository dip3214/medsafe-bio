
-- Ownership helper: a member must belong to the caller
CREATE OR REPLACE FUNCTION public.owns_member(_member uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _member IS NULL OR EXISTS (
    SELECT 1 FROM public.family_members
    WHERE id = _member AND user_id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.owns_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_member(uuid) TO authenticated;

-- Tighten member scoping on all scoped tables
DO $$
DECLARE
  t text;
  polname text;
  tables text[] := ARRAY['documents','extractions','lab_results','medications','episodes','summaries','action_items'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop existing "Users manage own ..." policy if present
    FOR polname IN
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', polname, t);
    END LOOP;
    EXECUTE format($f$
      CREATE POLICY "Users manage own %1$s scoped by member" ON public.%1$I
      FOR ALL TO authenticated
      USING (
        auth.uid() = user_id
        AND public.owns_member(member_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        AND public.owns_member(member_id)
      );
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "Admins full access %1$s" ON public.%1$I
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $f$, t);
  END LOOP;
END $$;

-- Lifestyle logs
CREATE TABLE public.lifestyle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric(4,2),
  exercise_type text,
  exercise_minutes integer,
  meals text,
  source text NOT NULL DEFAULT 'form',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifestyle_logs TO authenticated;
GRANT ALL ON public.lifestyle_logs TO service_role;
ALTER TABLE public.lifestyle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lifestyle logs" ON public.lifestyle_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER lifestyle_logs_updated_at
  BEFORE UPDATE ON public.lifestyle_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lifestyle goals (single row per user)
CREATE TABLE public.lifestyle_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_hours_target numeric(4,2) DEFAULT 7.5,
  exercise_min_per_day integer DEFAULT 30,
  exercise_days_per_week integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifestyle_goals TO authenticated;
GRANT ALL ON public.lifestyle_goals TO service_role;
ALTER TABLE public.lifestyle_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lifestyle goals" ON public.lifestyle_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER lifestyle_goals_updated_at
  BEFORE UPDATE ON public.lifestyle_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
