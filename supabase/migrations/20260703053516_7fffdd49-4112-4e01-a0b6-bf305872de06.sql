
-- Restrict chat_threads and family_members policies to authenticated role only
DROP POLICY IF EXISTS "owner manages own threads" ON public.chat_threads;
CREATE POLICY "owner manages own threads" ON public.chat_threads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "members owner" ON public.family_members;
CREATE POLICY "members owner" ON public.family_members
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Harden has_role: SECURITY DEFINER so it reads user_roles even if the
-- caller's RLS view is restricted, and cannot be short-circuited by
-- policy gaps. Fixed search_path prevents schema-hijack.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
