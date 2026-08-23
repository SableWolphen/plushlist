-- Prevent any regular authenticated user from setting their own is_supporter
-- via a direct API call, even though their own row's RLS otherwise allows
-- them to update their own preferences. Only an admin-authorized operation
-- (via admin_set_supporter_status below) can change this field.
create or replace function public.prevent_self_supporter_grant()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.admin_override', true), '') = 'true' then
    return new;
  end if;
  if TG_OP = 'INSERT' then
    new.is_supporter := false;
  elsif TG_OP = 'UPDATE' then
    new.is_supporter := old.is_supporter;
  end if;
  return new;
end;
$$;

drop trigger if exists app_preferences_protect_supporter on public.app_preferences;
create trigger app_preferences_protect_supporter
  before insert or update on public.app_preferences
  for each row execute function public.prevent_self_supporter_grant();

-- Admin-only way to grant or revoke supporter status, for comping test
-- accounts or manually recording a payment before real billing exists.
create or replace function public.admin_set_supporter_status(target_email text, new_value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  target_user_id uuid;
begin
  if caller_email not in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com') then
    raise exception 'not authorized';
  end if;
  select id into target_user_id from auth.users where lower(email) = lower(target_email);
  if target_user_id is null then
    raise exception 'no account found for that email';
  end if;
  perform set_config('app.admin_override', 'true', true);
  insert into public.app_preferences (user_id, is_supporter, updated_at)
  values (target_user_id, new_value, now())
  on conflict (user_id) do update set is_supporter = excluded.is_supporter, updated_at = excluded.updated_at;
end;
$$;
revoke all on function public.admin_set_supporter_status(text, boolean) from anon, public;
grant execute on function public.admin_set_supporter_status(text, boolean) to authenticated;
