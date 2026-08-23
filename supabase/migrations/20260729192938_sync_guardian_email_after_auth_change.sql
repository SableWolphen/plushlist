create or replace function public.sync_guardian_email_on_auth_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email is distinct from new.email then
    update public.caregiver_links
      set caregiver_email = lower(new.email)
      where lower(caregiver_email) = lower(old.email);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_guardian_email_after_auth_change on auth.users;
create trigger sync_guardian_email_after_auth_change
after update of email on auth.users
for each row execute function public.sync_guardian_email_on_auth_change();
