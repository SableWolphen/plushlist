alter table public.tracker_tasks
  add column if not exists paused_since date,
  add column if not exists paused_until date,
  add column if not exists pause_reason text;
