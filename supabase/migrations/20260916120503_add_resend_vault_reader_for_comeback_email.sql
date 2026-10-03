create or replace function public.plushlife_get_resend_api_key()
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  order by created_at desc
  limit 1;
$$;

revoke all on function public.plushlife_get_resend_api_key() from public, anon, authenticated;
grant execute on function public.plushlife_get_resend_api_key() to service_role;
