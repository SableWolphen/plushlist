-- Admin authorization now keys on the immutable auth user id via
-- private.app_admins instead of a hardcoded email allowlist baked into
-- policies and functions. Email is a mutable identifier: changing the
-- owner's email used to silently break every admin path, and the old list
-- lived in nine migrations that all had to be edited by hand.
--
-- CHECKPOINT (owner-confirmed): this is a Supabase schema/policy change.
-- After applying, replace the placeholder UUID below with the owner's real
-- auth.users id. The placeholder row is inert (nil UUID matches no user)
-- and exists only to document where the seed belongs.

-- Canonical admin check. SECURITY DEFINER so policies and RPCs can call it
-- regardless of the caller's grants on private.app_admins; search_path is
-- locked and all references are schema-qualified.
create or replace function public.is_app_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from private.app_admins where user_id = auth.uid()
  );
end;
$$;

revoke all on function public.is_app_admin() from anon, authenticated, public;
grant execute on function public.is_app_admin() to authenticated;

-- Seed the owner row. BEFORE APPLYING, replace the placeholder below with
-- the owner's real auth.users id (from the Supabase dashboard >
-- Authentication > Users), then uncomment the insert. The placeholder is
-- left commented because private.app_admins.user_id references auth.users(id)
-- and a nil UUID would violate the foreign key.
--
--   insert into private.app_admins (user_id)
--   values ('<owner auth user uuid>')
--   on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Re-point every admin-gated policy from the email allowlist to
-- public.is_app_admin(). Each drop/create below mirrors the policy as
-- defined in its original migration, with only the USING / WITH CHECK
-- expression changed.
-- ---------------------------------------------------------------------------

drop policy if exists "Admins read feedback" on public.feedback_messages;
create policy "Admins read feedback" on public.feedback_messages
  for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins read error logs" on public.app_error_logs;
create policy "Admins read error logs" on public.app_error_logs
  for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins update feedback" on public.feedback_messages;
create policy "Admins update feedback" on public.feedback_messages
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins delete feedback" on public.feedback_messages;
create policy "Admins delete feedback" on public.feedback_messages
  for delete to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins delete error logs" on public.app_error_logs;
create policy "Admins delete error logs" on public.app_error_logs
  for delete to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins read presence" on public.user_presence;
create policy "Admins read presence" on public.user_presence
  for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins read supporter payments" on public.supporter_payments;
create policy "Admins read supporter payments" on public.supporter_payments
  for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins read onboarding events" on public.onboarding_events;
create policy "Admins read onboarding events" on public.onboarding_events
  for select to authenticated
  using (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- Re-point the admin-gated RPCs. Bodies are the latest versions from the
-- original migrations; only the authorization guard changed.
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_app_admin() then
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

create or replace function public.admin_set_supporter_status(target_email text, new_value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;
  select id into target_user_id from auth.users where lower(email) = lower(target_email);
  if target_user_id is null then
    raise exception 'no account found for that email';
  end if;
  perform set_config('app.admin_override', 'true', true);
  insert into public.app_preferences (user_id, is_supporter, updated_at)
  values (target_user_id, new_value, now())
  on conflict (user_id) do update set is_supporter = excluded.is_supporter, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.admin_onboarding_funnel()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  result jsonb;
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;

  with event_rows as (
    select user_id, step, event, onboarding_mode, created_at,
           lag(created_at) over (partition by user_id order by created_at) as previous_at
    from public.onboarding_events
  ),
  users as (
    select
      user_id,
      case when bool_or(onboarding_mode = 'guardian') then 'guardian' else 'cozy' end as mode,
      max(step) filter (where event = 'step_viewed') as max_step,
      bool_or(event = 'completed') as completed,
      min(created_at) as first_event_at,
      max(created_at) as last_event_at,
      bool_or(previous_at is not null and created_at - previous_at >= interval '30 minutes') as returned_later
    from event_rows
    group by user_id
  ),
  overall_steps as (
    select s.step,
           count(*) filter (where u.max_step >= s.step) as reached,
           count(*) filter (where not u.completed and u.max_step = s.step and u.last_event_at < now() - interval '24 hours') as abandoned_here,
           count(*) filter (where not u.completed and u.max_step = s.step and u.last_event_at >= now() - interval '24 hours') as recent_here
    from generate_series(1, 6) s(step)
    cross join users u
    group by s.step
    order by s.step
  ),
  mode_names as (
    select unnest(array['cozy'::text,'guardian'::text]) as mode
  ),
  mode_json as (
    select jsonb_agg(
      jsonb_build_object(
        'mode', m.mode,
        'started', (select count(*) from users u where u.mode = m.mode),
        'completed', (select count(*) from users u where u.mode = m.mode and u.completed),
        'returned_later', (select count(*) from users u where u.mode = m.mode and u.returned_later),
        'abandoned', (select count(*) from users u where u.mode = m.mode and not u.completed and u.last_event_at < now() - interval '24 hours'),
        'recent_unfinished', (select count(*) from users u where u.mode = m.mode and not u.completed and u.last_event_at >= now() - interval '24 hours'),
        'by_step', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'step', s.step,
            'reached', (select count(*) from users u where u.mode = m.mode and u.max_step >= s.step),
            'abandoned_here', (select count(*) from users u where u.mode = m.mode and not u.completed and u.max_step = s.step and u.last_event_at < now() - interval '24 hours'),
            'recent_here', (select count(*) from users u where u.mode = m.mode and not u.completed and u.max_step = s.step and u.last_event_at >= now() - interval '24 hours')
          ) order by s.step), '[]'::jsonb)
          from generate_series(1, 6) s(step)
        )
      ) order by case m.mode when 'cozy' then 1 else 2 end
    ) as value
    from mode_names m
  )
  select jsonb_build_object(
    'started', count(*),
    'completed', count(*) filter (where completed),
    'returned_later', count(*) filter (where returned_later),
    'abandoned', count(*) filter (where not completed and last_event_at < now() - interval '24 hours'),
    'recent_unfinished', count(*) filter (where not completed and last_event_at >= now() - interval '24 hours'),
    'abandon_after_hours', 24,
    'return_gap_minutes', 30,
    'by_step', (select coalesce(jsonb_agg(row_to_json(os) order by os.step), '[]'::jsonb) from overall_steps os),
    'by_mode', (select value from mode_json)
  ) into result
  from users;

  return result;
end;
$function$;
