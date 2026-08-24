-- The calendar sync needs a reliable "did this change since we last
-- pushed it?" signal. tracker_tasks had no updated_at at all, and
-- tracker_schedules.updated_at is only set by whichever client code
-- happens to pass it explicitly (its default only applies on insert) —
-- neither is trustworthy enough for conflict detection across ~10+
-- existing tracker_tasks write call sites. A trigger is correct
-- regardless of which code path writes, with no other side effects.

alter table public.tracker_tasks add column updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_tracker_tasks_updated_at
  before update on public.tracker_tasks
  for each row
  execute function public.set_updated_at();

create trigger set_tracker_schedules_updated_at
  before update on public.tracker_schedules
  for each row
  execute function public.set_updated_at();
