-- Correction: the trigger from the previous migration also reverted
-- accepted_at, which would have silently broken accept_support_invitation
-- (a SECURITY DEFINER RPC that legitimately sets accepted_at on behalf of
-- the invited caregiver, gated by its own "only while still null, only for
-- the matching email" WHERE clause — that's already safe on its own terms).
-- Accepting an invite doesn't grant anything beyond what the owner already
-- chose at invite time, so accepted_at needs to stay mutable here too.
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
    NEW.care_agreement := OLD.care_agreement;
    NEW.created_at := OLD.created_at;
    -- last_viewed_at and accepted_at are the two legitimate non-owner writes:
    -- last_viewed_at from the app's own "mark as viewed" call, accepted_at
    -- from accept_support_invitation (already separately guarded).
  end if;
  return NEW;
end;
$$;
