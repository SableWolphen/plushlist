create extension if not exists pg_cron;

select cron.schedule(
  'sables-tracker-daily-reset',
  '0 9 * * *',
  $$
    update public.tracker_progress
    set completed = false, updated_at = now()
    where task_key like 'daily-%' and completed = true;
  $$
);

select cron.schedule(
  'sables-tracker-weekly-reset',
  '5 9 * * 1',
  $$
    update public.tracker_progress
    set completed = false, updated_at = now()
    where task_key not like 'daily-%' and completed = true;
  $$
);
