-- Guardians matched by the "Guardians update requests addressed to them"
-- RLS policy are meant to acknowledge or resolve a support request — not to
-- rewrite what the owner asked for. Postgres UPDATE policies cannot restrict
-- columns on their own (see the same lesson on caregiver_links in
-- 20260802112113_lock_caregiver_links_caregiver_side_updates.sql), so a
-- BEFORE UPDATE trigger reverts every column except the two legitimate
-- guardian writes: status and resolved_at.
--
-- CHECKPOINT (owner-confirmed): this is a Supabase schema change (new
-- trigger function + trigger on guardian_support_requests).

create or replace function public.protect_guardian_support_request_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The owner keeps full write access through the "Owners manage their
  -- support requests" policy; only non-owner writes get column-reverted.
  if auth.uid() is distinct from OLD.owner_user_id then
    NEW.owner_user_id := OLD.owner_user_id;
    NEW.caregiver_email := OLD.caregiver_email;
    NEW.request_type := OLD.request_type;
    NEW.message := OLD.message;
    NEW.created_at := OLD.created_at;
    -- status and resolved_at are the two legitimate non-owner writes:
    -- acknowledging or resolving a request addressed to the guardian.
  end if;
  return NEW;
end;
$$;

drop trigger if exists guardian_support_requests_protect_columns on public.guardian_support_requests;
create trigger guardian_support_requests_protect_columns
  before update on public.guardian_support_requests
  for each row execute function public.protect_guardian_support_request_columns();

-- Trigger functions must not be directly callable; the existing revoke
-- pattern from 20260803000053 / 20260803000125 is mirrored here.
revoke execute on function public.protect_guardian_support_request_columns() from anon, authenticated, public;

comment on function public.protect_guardian_support_request_columns() is
  'Reverts guardian writes to guardian_support_requests columns other than status/resolved_at.';
