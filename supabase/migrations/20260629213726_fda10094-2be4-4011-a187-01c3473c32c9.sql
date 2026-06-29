
-- Family members
CREATE TYPE public.family_segment AS ENUM ('kids','parents','me');

CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  segment public.family_segment NOT NULL DEFAULT 'me',
  relation text,
  dob date,
  avatar_color text DEFAULT '#dc2626',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX family_members_user_id_idx ON public.family_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members owner" ON public.family_members FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add member_id to scoped tables
ALTER TABLE public.documents       ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.extractions     ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.lab_results     ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.medications     ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.action_items    ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.summaries       ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.episodes        ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.chat_threads    ADD COLUMN member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX documents_member_idx    ON public.documents(member_id);
CREATE INDEX lab_results_member_idx  ON public.lab_results(member_id);
CREATE INDEX medications_member_idx  ON public.medications(member_id);
CREATE INDEX chat_threads_member_idx ON public.chat_threads(member_id);

-- Extend handle_new_user to seed a default "Me" member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  INSERT INTO public.family_members (user_id, name, segment, relation, is_default)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Me'), 'me', 'self', true);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Backfill: ensure every existing user has a default "Me" member
INSERT INTO public.family_members (user_id, name, segment, relation, is_default)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email, 'Me'), 'me', 'self', true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.user_id = u.id);

-- Backfill member_id on existing rows to that default member
UPDATE public.documents d
  SET member_id = fm.id
  FROM public.family_members fm
  WHERE fm.user_id = d.user_id AND fm.is_default = true AND d.member_id IS NULL;
UPDATE public.lab_results l
  SET member_id = fm.id
  FROM public.family_members fm
  WHERE fm.user_id = l.user_id AND fm.is_default = true AND l.member_id IS NULL;
UPDATE public.medications m
  SET member_id = fm.id
  FROM public.family_members fm
  WHERE fm.user_id = m.user_id AND fm.is_default = true AND m.member_id IS NULL;
UPDATE public.chat_threads c
  SET member_id = fm.id
  FROM public.family_members fm
  WHERE fm.user_id = c.user_id AND fm.is_default = true AND c.member_id IS NULL;

-- Consents: ensure columns exist for DPDP toggles
ALTER TABLE public.consents
  ADD COLUMN IF NOT EXISTS storage_consent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_processing_consent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS analytics_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
