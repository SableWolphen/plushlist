alter table public.tracker_schedules
  add column if not exists entries jsonb not null default '[]'::jsonb;
