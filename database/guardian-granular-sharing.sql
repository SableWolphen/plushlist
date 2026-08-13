-- PlushLife Guardian granular sharing
-- Production migrations applied 2026-08-13.
-- Existing relationships default to no task/schedule access; owners must opt in.

alter table public.caregiver_links add column if not exists can_view_tasks boolean not null default false;
alter table public.caregiver_links add column if not exists can_view_schedule boolean not null default false;

drop policy if exists "Owners read tracker tasks" on public.tracker_tasks;
drop policy if exists "Owners and permitted caretakers read tracker tasks" on public.tracker_tasks;
create policy "Owners or explicitly permitted guardians read tracker tasks"
on public.tracker_tasks for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.caregiver_links link
    where link.owner_user_id = tracker_tasks.user_id
      and link.active
      and link.accepted_at is not null
      and link.can_view_tasks
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Owners read schedules" on public.tracker_schedules;
drop policy if exists "Owners and invited caretakers read schedules" on public.tracker_schedules;
create policy "Owners or explicitly permitted guardians read schedules"
on public.tracker_schedules for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.caregiver_links link
    where link.owner_user_id = tracker_schedules.user_id
      and link.active
      and link.accepted_at is not null
      and link.can_view_schedule
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Users can read their own schedule exceptions" on public.schedule_exceptions;
create policy "Owners or explicitly permitted guardians read schedule exceptions"
on public.schedule_exceptions for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.caregiver_links link
    where link.owner_user_id = schedule_exceptions.user_id
      and link.active
      and link.accepted_at is not null
      and link.can_view_schedule
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Mood sharing returns only a small summary. Notes/context tags remain private.
create or replace function public.guardian_daily_checkin_summary(p_owner_user_id uuid, p_date date)
returns table(mood text, energy text, capacity text, day_type text, support_preference text)
language sql
security definer
set search_path = public
as $$
  select c.mood, c.energy, c.capacity, c.day_type, c.support_preference
  from public.daily_check_ins c
  where c.user_id = p_owner_user_id
    and c.check_date = p_date
    and exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = p_owner_user_id
        and link.active
        and link.accepted_at is not null
        and link.can_view_mood
        and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  limit 1;
$$;
revoke all on function public.guardian_daily_checkin_summary(uuid,date) from public, anon;
grant execute on function public.guardian_daily_checkin_summary(uuid,date) to authenticated;
