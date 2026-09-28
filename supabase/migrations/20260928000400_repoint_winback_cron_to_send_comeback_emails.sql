-- Repoint the winback cron at the sender that actually exists.
--
-- The 'plushlist-winback-notifications' cron (added 2026-07-31) has always
-- called .../functions/v1/send-winback-notifications, which was never built,
-- so every daily run fails. The real winback sender is send-comeback-emails:
-- staged gentle emails, per-user opt-out (app_metadata.comeback_email_opt_out),
-- signed one-click unsubscribe, duplicate-send protection, and a graceful
-- "not configured" response when Resend is not set up. It already expects the
-- same x-cron-secret header this job sends.
select cron.unschedule('plushlist-winback-notifications');

select cron.schedule(
  'plushlist-winback-notifications',
  '0 16 * * *',
  $$
  select net.http_post(
    url := 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/send-comeback-emails',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='plushlist_cron_secret' order by created_at desc limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
