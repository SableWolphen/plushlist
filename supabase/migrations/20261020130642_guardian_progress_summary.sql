-- Counts-only progress sharing: task labels, identifiers, notes and schedule
-- entries stay behind their existing owner/explicit task-sharing policies.
create schema if not exists plush_private;
revoke all on schema plush_private from public, anon;
grant usage on schema plush_private to authenticated;

create or replace function plush_private.guardian_progress_summary(
  p_owner_user_id uuid, p_from_date date, p_to_date date
)
returns table (
  progress_date date, total_count bigint, completed_count bigint,
  daily_count bigint, daily_completed bigint,
  scheduled_count bigint, scheduled_completed bigint
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  -- Caller identity comes from the signed JWT, never editable user metadata.
  if auth.uid() is null or p_owner_user_id is null
    or p_from_date is null or p_to_date is null
    or p_to_date < p_from_date or p_to_date - p_from_date > 6 then
    return;
  end if;
  if auth.uid() <> p_owner_user_id and not exists (
    select 1 from public.caregiver_links l
    where l.owner_user_id = p_owner_user_id and l.active
      and l.accepted_at is not null and l.can_view_progress
      and lower(l.caregiver_email) = lower(coalesce(auth.jwt()->>'email', ''))
  ) then
    return;
  end if;

  return query
  with dates as (
    select p_from_date + i as d,
      (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from p_from_date + i)::int + 1] as day_id
    from pg_catalog.generate_series(0, p_to_date - p_from_date) i
  ), eligible as (
    select d.d, t.task_key,
      t.day_id = 'daily' and not (
        coalesce(t.schedule_days, array[]::text[]) &&
        array['mon','tue','wed','thu','fri','sat','sun']
      ) as is_daily,
      coalesce(p.completed_keys, '[]'::jsonb) ? t.task_key as done
    from dates d
    join public.tracker_tasks t on t.user_id = p_owner_user_id
      and t.archived_at is null and not coalesce(t.is_bonus, false)
      and lower(coalesce(t.section, '')) not like all
        (array['%bonus%','%little space%','%reward%','%fun%'])
      and case when coalesce(t.schedule_days, array[]::text[]) &&
          array['mon','tue','wed','thu','fri','sat','sun']
        then d.day_id = any(t.schedule_days)
        else t.day_id = 'daily' or t.day_id = d.day_id end
      and case when t.schedule_type = 'once' then t.one_time_date = d.d
        when t.schedule_type = 'range' then
          (t.start_date is null or t.start_date <= d.d) and
          (t.end_date is null or t.end_date >= d.d)
        else true end
      and not (t.paused_since is not null and t.paused_since <= d.d
        and (t.paused_until is null or t.paused_until >= d.d))
    left join public.daily_progress p on p.user_id = p_owner_user_id and p.progress_date = d.d
  )
  select d.d, count(e.task_key), count(e.task_key) filter (where e.done),
    count(e.task_key) filter (where e.is_daily),
    count(e.task_key) filter (where e.is_daily and e.done),
    count(e.task_key) filter (where not e.is_daily),
    count(e.task_key) filter (where not e.is_daily and e.done)
  from dates d left join eligible e on e.d = d.d
  group by d.d order by d.d;
end;
$$;
revoke all on function plush_private.guardian_progress_summary(uuid,date,date) from public, anon, authenticated;
grant execute on function plush_private.guardian_progress_summary(uuid,date,date) to authenticated;

-- The Data API exposes only this invoker wrapper, not the privileged helper.
create or replace function public.guardian_progress_summary(
  p_owner_user_id uuid, p_from_date date, p_to_date date
)
returns table (
  progress_date date, total_count bigint, completed_count bigint,
  daily_count bigint, daily_completed bigint,
  scheduled_count bigint, scheduled_completed bigint
)
language sql stable security invoker set search_path = ''
as $$
  select * from plush_private.guardian_progress_summary(p_owner_user_id, p_from_date, p_to_date);
$$;
revoke all on function public.guardian_progress_summary(uuid,date,date) from public, anon, authenticated;
grant execute on function public.guardian_progress_summary(uuid,date,date) to authenticated;

-- Raw completed keys can reveal task identifiers. Progress-only Guardians use
-- the aggregate above; raw progress requires accepted progress AND task consent.
drop policy if exists "Owners and invited adults read daily progress" on public.daily_progress;
create policy "Owners and invited adults read daily progress"
on public.daily_progress for select to authenticated
using (
  (select auth.uid()) = user_id or exists (
    select 1 from public.caregiver_links l
    where l.owner_user_id = daily_progress.user_id and l.active
      and l.accepted_at is not null and l.can_view_progress and l.can_view_tasks
      and lower(l.caregiver_email) = lower(coalesce((select auth.jwt())->>'email', ''))
  )
);

