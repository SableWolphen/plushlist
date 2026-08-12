-- Non-destructive defense-in-depth hardening applied to production on 2026-08-12.
-- No rows are inserted, updated, or deleted by this migration.
-- Existing authenticated app flows keep EXECUTE; anonymous/PUBLIC access is removed.

REVOKE EXECUTE ON FUNCTION public.accept_support_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decline_support_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_my_support_relationships() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.touch_caregiver_link_viewed(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_onboarding_funnel() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_supporter_status(text, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_support_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_support_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_support_relationships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_caregiver_link_viewed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_onboarding_funnel() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_supporter_status(text, boolean) TO authenticated;
