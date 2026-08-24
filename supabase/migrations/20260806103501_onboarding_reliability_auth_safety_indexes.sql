begin;

create or replace function public.ensure_new_user_base_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tracker_profiles (
    user_id,
    display_name,
    account_type,
    guardian_read_only,
    created_at,
    updated_at
  ) values (
    new.id,
    '',
    'little',
    true,
    now(),
    now()
  ) on conflict (user_id) do nothing;

  insert into public.app_preferences (
    user_id,
    onboarding_complete,
    updated_at
  ) values (
    new.id,
    false,
    now()
  ) on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.ensure_new_user_base_rows() from public, anon, authenticated;

drop trigger if exists plushlife_ensure_new_user_base_rows on auth.users;
create trigger plushlife_ensure_new_user_base_rows
after insert on auth.users
for each row execute function public.ensure_new_user_base_rows();

insert into public.tracker_profiles (user_id, display_name, account_type, guardian_read_only, created_at, updated_at)
select u.id, '', 'little', true, now(), now()
from auth.users u
left join public.tracker_profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

insert into public.app_preferences (user_id, onboarding_complete, updated_at)
select u.id, false, now()
from auth.users u
left join public.app_preferences p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

create or replace function public.complete_my_onboarding(
  requested_display_name text,
  requested_account_type text,
  requested_timezone text default 'America/Chicago'
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  clean_name text := trim(coalesce(requested_display_name, ''));
  clean_type text := lower(trim(coalesce(requested_account_type, '')));
  clean_timezone text := nullif(trim(coalesce(requested_timezone, '')), '');
begin
  if caller_id is null then
    raise exception 'authentication required';
  end if;

  if clean_name = '' then
    raise exception 'display name required';
  end if;

  if clean_type not in ('little', 'caretaker') then
    raise exception 'invalid account type';
  end if;

  insert into public.tracker_profiles (
    user_id,
    display_name,
    account_type,
    guardian_read_only,
    updated_at
  ) values (
    caller_id,
    clean_name,
    clean_type,
    true,
    now()
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      account_type = excluded.account_type,
      guardian_read_only = true,
      updated_at = now();

  insert into public.app_preferences (
    user_id,
    timezone,
    onboarding_complete,
    updated_at
  ) values (
    caller_id,
    coalesce(clean_timezone, 'America/Chicago'),
    true,
    now()
  )
  on conflict (user_id) do update
  set timezone = coalesce(clean_timezone, public.app_preferences.timezone),
      onboarding_complete = true,
      updated_at = now();
end;
$$;

revoke all on function public.complete_my_onboarding(text, text, text) from public, anon;
grant execute on function public.complete_my_onboarding(text, text, text) to authenticated;

revoke all on function public.accept_support_invitation(uuid) from public, anon;
revoke all on function public.decline_support_invitation(uuid) from public, anon;
revoke all on function public.list_my_support_relationships() from public, anon;
grant execute on function public.accept_support_invitation(uuid) to authenticated;
grant execute on function public.decline_support_invitation(uuid) to authenticated;
grant execute on function public.list_my_support_relationships() to authenticated;

revoke all on function public.admin_dashboard_stats() from public, anon;
revoke all on function public.admin_onboarding_funnel() from public, anon;
revoke all on function public.admin_set_supporter_status(text, boolean) from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_onboarding_funnel() to authenticated;
grant execute on function public.admin_set_supporter_status(text, boolean) to authenticated;

create index if not exists app_error_logs_user_id_idx on public.app_error_logs (user_id);
create index if not exists feedback_messages_user_id_idx on public.feedback_messages (user_id);
create index if not exists onboarding_events_user_id_idx on public.onboarding_events (user_id);
create index if not exists supporter_payments_user_id_idx on public.supporter_payments (user_id);

commit;
