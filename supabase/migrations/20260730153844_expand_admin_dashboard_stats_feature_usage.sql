create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  result jsonb;
begin
  if caller_email not in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com') then
    raise exception 'not authorized';
  end if;
  select jsonb_build_object(
    'total_accounts', (select count(*) from public.tracker_profiles),
    'total_tasks', (select count(*) from public.tracker_tasks),
    'total_guardian_links', (select count(*) from public.caregiver_links where active),
    'total_feedback', (select count(*) from public.feedback_messages),
    'unresolved_feedback', (select count(*) from public.feedback_messages where not resolved),
    'total_errors_24h', (select count(*) from public.app_error_logs where created_at > now() - interval '24 hours'),
    'total_daily_progress_rows', (select count(*) from public.daily_progress),
    'using_focus_mode', (select count(*) from public.app_preferences where focus_mode),
    'using_baby_mode', (select count(*) from public.app_preferences where nickname_style = 'baby'),
    'using_dino_theme', (select count(*) from public.app_preferences where dino_theme),
    'using_notifications', (select count(*) from public.app_preferences where notifications_enabled),
    'total_habit_tasks', (select count(*) from public.tracker_tasks where detail ilike '[[plushlist-habit:%'),
    'total_badges_earned', (select coalesce(sum(array_length(earned_badge_ids, 1)), 0) from public.user_achievements),
    'total_reflections', (select count(*) from public.private_notes)
  ) into result;
  return result;
end;
$$;
