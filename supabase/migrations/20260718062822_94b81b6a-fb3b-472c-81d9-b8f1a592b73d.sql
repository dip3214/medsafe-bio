-- Restore EXECUTE for RLS helper functions. RLS policies call these as the
-- invoking role (authenticated/anon), so those roles must be able to execute
-- them. has_role is SECURITY DEFINER with a fixed search_path, so it stays safe.
GRANT EXECUTE ON FUNCTION public.owns_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;