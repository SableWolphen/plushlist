-- Guardrail: fail loudly if any owner-scoped table in the public schema
-- lacks row-level security. Several core tables (caregiver_links,
-- app_preferences, private_notes, support_notes, push_subscriptions,
-- notification_deliveries, task_suggestions, tracker_progress) were created
-- via the Supabase dashboard rather than migrations, so in-repo CREATE TABLE
-- coverage is incomplete; the expected list below is built from both the
-- migration history and the dashboard-created tables known to the app.
--
-- Tables on this list MUST have RLS enabled — the migration raises an
-- exception naming the offender, so drift fails at deploy time instead of
-- silently. Any other public table without RLS gets a warning notice so new
-- tables are reviewed deliberately.
--
-- CHECKPOINT (owner-confirmed): this migration only adds assertions; it
-- changes no policies, grants, or table definitions.

do $$
declare
  expected_owner_scoped text[] := array[
    'app_error_logs',
    'app_preferences',
    'calendar_connections',
    'calendar_oauth_state',
    'calendar_sync_links',
    'care_session_logs',
    'caregiver_links',
    'daily_check_ins',
    'daily_progress',
    'entitlements',
    'feedback_messages',
    'glow_mcp_oauth_codes',
    'glow_mcp_tokens',
    'guardian_support_requests',
    'mommy_chat_threads',
    'notification_deliveries',
    'onboarding_events',
    'plush_path_progress',
    'private_notes',
    'push_subscriptions',
    'rest_days',
    'schedule_exceptions',
    'support_notes',
    'supporter_payments',
    'task_snoozes',
    'task_suggestions',
    'tracker_profiles',
    'tracker_progress',
    'tracker_schedules',
    'tracker_tasks',
    'user_achievements',
    'user_presence',
    'watch_pairings',
    'weekly_intention_checkins',
    'weekly_intentions'
  ];
  missing_rls text[];
  unlisted_without_rls text[];
begin
  select coalesce(array_agg(t.relname order by t.relname), '{}')
  into missing_rls
  from pg_class t
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relkind = 'r'
    and t.relname = any (expected_owner_scoped)
    and not t.relrowsecurity;

  if array_length(missing_rls, 1) > 0 then
    raise exception 'RLS is not enabled on owner-scoped tables: %',
      array_to_string(missing_rls, ', ');
  end if;

  select coalesce(array_agg(t.relname order by t.relname), '{}')
  into unlisted_without_rls
  from pg_class t
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relkind = 'r'
    and not (t.relname = any (expected_owner_scoped))
    and not t.relrowsecurity;

  if array_length(unlisted_without_rls, 1) > 0 then
    raise notice 'Public tables without RLS that are not on the owner-scoped list (review whether they should be): %',
      array_to_string(unlisted_without_rls, ', ');
  end if;
end;
$$;
