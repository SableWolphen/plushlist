create or replace function public.admin_onboarding_funnel()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  caller_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  result jsonb;
begin
  if caller_email not in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com') then
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
