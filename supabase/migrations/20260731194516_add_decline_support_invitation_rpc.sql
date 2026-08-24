-- Only the owner can DELETE caregiver_links rows per existing RLS, so the invited
-- party has no client-side way to decline a pending invite. This lets them remove
-- their own not-yet-accepted invitation without granting them delete rights over
-- relationships in general (accepted relationships still end only via the owner's
-- "End relationship" action, matching existing behavior).
create or replace function public.decline_support_invitation(link_id uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from public.caregiver_links
  where id = link_id
    and accepted_at is null
    and lower(caregiver_email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''));
$$;

revoke all on function public.decline_support_invitation(uuid) from public;
revoke all on function public.decline_support_invitation(uuid) from anon;
grant execute on function public.decline_support_invitation(uuid) to authenticated;
