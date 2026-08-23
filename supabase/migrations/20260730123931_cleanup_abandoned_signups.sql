create or replace function public.cleanup_abandoned_signups()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Removes accounts that were created (an OTP/sign-up email was requested)
  -- but never actually confirmed and never signed in, after a generous grace
  -- period. This covers the case where the email never arrived, was never
  -- opened, or the OTP simply expired unused — the account never really
  -- "existed" from the person's point of view, so it shouldn't linger.
  delete from auth.users
  where email_confirmed_at is null
    and last_sign_in_at is null
    and created_at < now() - interval '24 hours';
end;
$$;

revoke all on function public.cleanup_abandoned_signups() from anon, authenticated, public;

select cron.schedule(
  'cleanup-abandoned-signups-hourly',
  '0 * * * *',
  $$select public.cleanup_abandoned_signups();$$
);
