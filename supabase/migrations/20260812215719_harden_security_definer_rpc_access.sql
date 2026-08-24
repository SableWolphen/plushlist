-- Defense-in-depth only: do not change function bodies or any user data.
-- Keep the existing authenticated app behavior while removing anonymous/PUBLIC execution.
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
