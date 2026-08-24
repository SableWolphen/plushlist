-- These tables were created through the dashboard Table Editor, which by
-- default grants full CRUD to both `anon` and `authenticated` and expects
-- RLS to be the only real gate. Every policy on these tables already scopes
-- to `authenticated` (verified against pg_policies), so this hasn't been an
-- active leak, but it means an anonymous, unauthenticated request is only
-- one RLS policy mistake away from reading or writing private data (mood
-- check-ins, journal entries, guardian relationships, etc.). Nothing in the
-- app works without sign-in, so anon never legitimately needs table access
-- here; revoking it removes that margin-for-error entirely rather than
-- relying solely on RLS being perfect forever.

revoke all on table
  public.app_error_logs,
  public.app_preferences,
  public.care_session_logs,
  public.caregiver_links,
  public.daily_check_ins,
  public.daily_progress,
  public.feedback_messages,
  public.guardian_support_requests,
  public.notification_deliveries,
  public.onboarding_events,
  public.plush_path_progress,
  public.private_notes,
  public.push_subscriptions,
  public.rest_days,
  public.schedule_exceptions,
  public.support_notes,
  public.support_rewards,
  public.supporter_payments,
  public.task_snoozes,
  public.task_suggestions,
  public.tracker_profiles,
  public.tracker_progress,
  public.tracker_schedules,
  public.tracker_tasks,
  public.user_presence,
  public.weekly_intention_checkins,
  public.weekly_intentions
from anon;
