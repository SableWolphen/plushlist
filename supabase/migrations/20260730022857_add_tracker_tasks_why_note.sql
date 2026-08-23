alter table public.tracker_tasks
  add column if not exists why_note text not null default '' check (length(why_note) <= 300);
