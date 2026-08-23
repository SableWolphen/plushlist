select cron.schedule(
  'cleanup-abandoned-signups-daily',
  '0 0 * * *',
  $$select public.cleanup_abandoned_signups();$$
);
