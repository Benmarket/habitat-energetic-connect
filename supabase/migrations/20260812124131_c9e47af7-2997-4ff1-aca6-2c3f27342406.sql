-- Maintenance function: only server-side/cron should call it
REVOKE EXECUTE ON FUNCTION public.mark_abandoned_conversations() FROM anon, authenticated, PUBLIC;

-- Unused legacy argument-order variant of has_permission
REVOKE EXECUTE ON FUNCTION public.has_permission(text, uuid) FROM anon, authenticated, PUBLIC;

-- Keep admin-guarded RPC callable only by signed-in users (guard enforces admin role)
REVOKE EXECUTE ON FUNCTION public.expire_stale_agent_requests() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_agent_requests() TO authenticated;
