
CREATE OR REPLACE FUNCTION public.owns_member(_member uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT _member IS NULL OR EXISTS (
    SELECT 1 FROM public.family_members
    WHERE id = _member AND user_id = auth.uid()
  );
$$;
