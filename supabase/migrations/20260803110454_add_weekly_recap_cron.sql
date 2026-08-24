select cron.schedule(
  'plushlist-weekly-recap',
  '0 14 * * 1',
  $$
  select net.http_post(
    url := 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/send-weekly-recap',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='plushlist_cron_secret' order by created_at desc limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
