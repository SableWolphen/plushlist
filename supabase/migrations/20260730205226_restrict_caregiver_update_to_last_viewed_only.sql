create or replace function public.restrict_caregiver_link_self_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  caller_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
begin
  -- If the caller is the caregiver (not the owner), they may only change
  -- last_viewed_at. Every other field snaps back to its previous value,
  -- regardless of what was sent in the request.
  if caller_email = lower(old.caregiver_email) and caller_email <> lower(coalesce((select email from auth.users where id = old.owner_user_id), '')) then
    new.owner_user_id := old.owner_user_id;
    new.caregiver_email := old.caregiver_email;
    new.label := old.label;
    new.active := old.active;
    new.can_view_progress := old.can_view_progress;
    new.can_send_notes := old.can_send_notes;
    new.can_add_rewards := old.can_add_rewards;
    new.can_suggest_tasks := old.can_suggest_tasks;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists caregiver_links_restrict_self_update on public.caregiver_links;
create trigger caregiver_links_restrict_self_update
  before update on public.caregiver_links
  for each row execute function public.restrict_caregiver_link_self_update();
