select cron.schedule(
  'plushlist-winback-notifications',
  '0 16 * * *',
  $$
  select net.http_post(
    url := 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/send-winback-notifications',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='plushlist_cron_secret' order by created_at desc limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
