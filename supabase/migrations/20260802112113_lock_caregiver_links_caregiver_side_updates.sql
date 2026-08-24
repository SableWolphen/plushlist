-- The "Caregivers update their own last_viewed" RLS policy on caregiver_links
-- only restricts WHICH ROW a non-owner can update (matching their own
-- caregiver_email), not WHICH COLUMNS — Postgres RLS UPDATE policies never
-- restrict columns on their own. In practice the app only ever sends
-- { last_viewed_at } from that code path, but RLS is the real security
-- boundary: nothing stopped a signed-in invited (or even not-yet-accepted)
-- caregiver from calling the same table directly and setting
-- can_view_progress / can_send_notes / can_add_rewards / can_suggest_tasks /
-- active / accepted_at to whatever they want, self-granting access to
-- someone else's account without the owner's consent.
--
-- This trigger forces every column except last_viewed_at back to its prior
-- value whenever the row is updated by anyone other than the owner, so that
-- escalation path is closed regardless of what a client sends.
create or replace function public.protect_caregiver_link_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from OLD.owner_user_id then
    NEW.owner_user_id := OLD.owner_user_id;
    NEW.caregiver_email := OLD.caregiver_email;
    NEW.label := OLD.label;
    NEW.active := OLD.active;
    NEW.can_view_progress := OLD.can_view_progress;
    NEW.can_send_notes := OLD.can_send_notes;
    NEW.can_add_rewards := OLD.can_add_rewards;
    NEW.can_suggest_tasks := OLD.can_suggest_tasks;
    NEW.can_view_mood := OLD.can_view_mood;
    NEW.accepted_at := OLD.accepted_at;
    NEW.care_agreement := OLD.care_agreement;
    NEW.created_at := OLD.created_at;
    -- last_viewed_at is intentionally left mutable here — that's the one
    -- legitimate self-service write a caregiver makes.
  end if;
  return NEW;
end;
$$;

drop trigger if exists caregiver_links_protect_columns on public.caregiver_links;
create trigger caregiver_links_protect_columns
before update on public.caregiver_links
for each row execute function public.protect_caregiver_link_columns();
