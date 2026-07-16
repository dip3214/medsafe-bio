-- Lock down SECURITY DEFINER helper functions: only postgres/service_role may EXECUTE.
-- RLS policies still work because SECURITY DEFINER runs as the function owner, not the caller.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_member(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_member(uuid) TO service_role;