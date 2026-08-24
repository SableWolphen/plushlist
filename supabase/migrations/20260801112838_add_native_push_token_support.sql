
-- Purpose: allow push_subscriptions to hold Android FCM tokens alongside
-- existing web-push (VAPID) subscriptions, without touching any existing rows.
-- Backward compatible: existing web rows are untouched (platform defaults to
-- 'web', all existing NOT NULL columns keep their values). No rows deleted,
-- no columns dropped, no type changes.

alter table public.push_subscriptions
  alter column endpoint drop not null,
  alter column p256dh drop not null,
  alter column auth drop not null;

alter table public.push_subscriptions
  add column platform text not null default 'web',
  add column fcm_token text null;

alter table public.push_subscriptions
  add constraint push_subscriptions_fcm_token_key unique (fcm_token);

alter table public.push_subscriptions
  add constraint push_subscriptions_platform_check check (platform in ('web', 'android', 'ios'));

alter table public.push_subscriptions
  add constraint push_subscriptions_platform_fields_check check (
    (platform = 'web' and endpoint is not null and p256dh is not null and auth is not null)
    or (platform in ('android', 'ios') and fcm_token is not null)
  );
