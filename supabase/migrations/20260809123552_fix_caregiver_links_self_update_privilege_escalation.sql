-- The "Caregivers update their own last_viewed" policy let any user whose
-- email matched a caregiver_links row UPDATE *every* column on it (active,
-- can_view_progress, can_view_mood, can_send_notes, can_add_rewards,
-- can_suggest_tasks, ...), with no check that the relationship was still
-- active. A revoked or never-accepted invitee could reactivate their own
-- access and grant themselves full guardian permissions without the
-- owner's consent. Replace direct table UPDATE access with a narrow
-- function that only ever touches last_viewed_at on an active row.

drop policy if exists "Caregivers update their own last_viewed" on public.caregiver_links;

create or replace function public.touch_caregiver_link_viewed(p_owner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_email text := lower(coalesce((select email from auth.users where id = auth.uid()), ''));
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  update public.caregiver_links
  set last_viewed_at = now()
  where owner_user_id = p_owner_user_id
    and active
    and lower(caregiver_email) = caller_email;
end;
$$;

revoke all on function public.touch_caregiver_link_viewed(uuid) from public, anon;
grant execute on function public.touch_caregiver_link_viewed(uuid) to authenticated;

comment on function public.touch_caregiver_link_viewed(uuid) is
  'Lets an active, invited caregiver record that they viewed a support relationship, without granting general UPDATE access to caregiver_links.';
