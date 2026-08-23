create or replace function public.prevent_self_supporter_grant()
returns trigger
language plpgsql
set search_path = public
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
