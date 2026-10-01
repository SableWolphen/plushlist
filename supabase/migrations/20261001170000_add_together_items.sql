-- Cozy + Guardian shared activities.
-- A Together item always belongs to one accepted Guardian relationship so
-- multiple Guardians never accidentally share the same private corner.

create table if not exists public.together_items (
  id uuid primary key default gen_random_uuid(),
  caregiver_link_id uuid not null references public.caregiver_links(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_by_role text not null check (created_by_role in ('cozy','guardian')),
  kind text not null check (kind in ('activity','note','task','checkin','promise','comfort','idea','memory')),
  body text not null check (char_length(body) between 1 and 500),
  scheduled_for timestamptz,
  recurrence text check (recurrence is null or recurrence in ('daily','weekly')),
  cozy_done_at timestamptz,
  guardian_done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists together_items_relationship_created_idx
  on public.together_items (caregiver_link_id, created_at desc);

alter table public.together_items enable row level security;

revoke all on table public.together_items from anon;
grant select, insert, delete on table public.together_items to authenticated;

drop policy if exists "Together relationship members read items" on public.together_items;
create policy "Together relationship members read items"
on public.together_items for select to authenticated
using (
  auth.uid() = owner_user_id
  or exists (
    select 1
    from public.caregiver_links link
    where link.id = together_items.caregiver_link_id
      and link.owner_user_id = together_items.owner_user_id
      and link.active
      and link.accepted_at is not null
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
  )
);

drop policy if exists "Together relationship members create items" on public.together_items;
create policy "Together relationship members create items"
on public.together_items for insert to authenticated
with check (
  (
    auth.uid() = owner_user_id
    and auth.uid() = created_by_user_id
    and created_by_role = 'cozy'
    and exists (
      select 1 from public.caregiver_links link
      where link.id = together_items.caregiver_link_id
        and link.owner_user_id = together_items.owner_user_id
        and link.active
        and link.accepted_at is not null
    )
  )
  or
  (
    auth.uid() = created_by_user_id
    and created_by_role = 'guardian'
    and exists (
      select 1 from public.caregiver_links link
      where link.id = together_items.caregiver_link_id
        and link.owner_user_id = together_items.owner_user_id
        and link.active
        and link.accepted_at is not null
        and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
    )
  )
);

drop policy if exists "Together creators or Cozy delete items" on public.together_items;
create policy "Together creators or Cozy delete items"
on public.together_items for delete to authenticated
using (
  auth.uid() = owner_user_id
  or auth.uid() = created_by_user_id
);

-- Completion is updated only through this RPC. That prevents either person
-- from writing the other person's checkmark.
create or replace function public.set_together_item_completion(
  p_item_id uuid,
  p_done boolean
)
returns public.together_items
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.together_items;
  is_guardian boolean := false;
begin
  select * into item
  from public.together_items
  where id = p_item_id;

  if item.id is null then
    raise exception 'Together item not found';
  end if;

  if auth.uid() = item.owner_user_id then
    update public.together_items
      set cozy_done_at = case when p_done then now() else null end
      where id = p_item_id
      returning * into item;
    return item;
  end if;

  select exists (
    select 1 from public.caregiver_links link
    where link.id = item.caregiver_link_id
      and link.owner_user_id = item.owner_user_id
      and link.active
      and link.accepted_at is not null
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
  ) into is_guardian;

  if not is_guardian then
    raise exception 'Not allowed';
  end if;

  update public.together_items
    set guardian_done_at = case when p_done then now() else null end
    where id = p_item_id
    returning * into item;

  return item;
end;
$$;

revoke all on function public.set_together_item_completion(uuid, boolean) from public;
grant execute on function public.set_together_item_completion(uuid, boolean) to authenticated;
