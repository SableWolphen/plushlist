-- Guardian relationships are directional (owner invites a caregiver) but a person can be
-- both a Cozy (supported) and a Guardian (supporting) at once, in different relationships,
-- and two people can support each other mutually. This adds explicit invite consent and a
-- safe way to detect mutual relationships without exposing other users' emails to the client.

alter table public.caregiver_links
  add column if not exists accepted_at timestamptz;

-- Grandfather in existing relationships created before consent tracking existed.
update public.caregiver_links
  set accepted_at = created_at
  where accepted_at is null;

create or replace function public.list_my_support_relationships()
returns table (
  partner_user_id uuid,
  partner_display_name text,
  they_support_me boolean,
  they_support_me_link_id uuid,
  they_support_me_accepted boolean,
  i_support_them boolean,
  i_support_them_link_id uuid,
  i_support_them_accepted boolean
)
language sql
security definer
set search_path = public, auth
stable
as $$
  with my_email as (
    select lower(email) as email from auth.users where id = auth.uid()
  ),
  they_support_me as (
    select cl.id, u.id as partner_id, cl.accepted_at
    from caregiver_links cl
    join auth.users u on lower(u.email) = lower(cl.caregiver_email)
    where cl.owner_user_id = auth.uid() and cl.active
  ),
  i_support_them as (
    select cl.id, cl.owner_user_id as partner_id, cl.accepted_at
    from caregiver_links cl, my_email
    where lower(cl.caregiver_email) = my_email.email
      and cl.active
      and cl.owner_user_id <> auth.uid()
  ),
  partners as (
    select partner_id from they_support_me
    union
    select partner_id from i_support_them
  )
  select
    p.partner_id,
    tp.display_name,
    (tsm.id is not null) as they_support_me,
    tsm.id as they_support_me_link_id,
    (tsm.accepted_at is not null) as they_support_me_accepted,
    (ist.id is not null) as i_support_them,
    ist.id as i_support_them_link_id,
    (ist.accepted_at is not null) as i_support_them_accepted
  from partners p
  left join they_support_me tsm on tsm.partner_id = p.partner_id
  left join i_support_them ist on ist.partner_id = p.partner_id
  left join tracker_profiles tp on tp.user_id = p.partner_id;
$$;

revoke all on function public.list_my_support_relationships() from public;
grant execute on function public.list_my_support_relationships() to authenticated;

create or replace function public.accept_support_invitation(link_id uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  update public.caregiver_links
  set accepted_at = now()
  where id = link_id
    and accepted_at is null
    and lower(caregiver_email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''));
$$;

revoke all on function public.accept_support_invitation(uuid) from public;
grant execute on function public.accept_support_invitation(uuid) to authenticated;
