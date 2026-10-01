-- Shared participation and timer state for Cozy + Guardian Together items.
-- Keep each person's participation separate; neither side can mark the other done.

alter table public.together_items
  add column if not exists timer_minutes integer check (timer_minutes is null or timer_minutes between 1 and 120),
  add column if not exists timer_started_at timestamptz,
  add column if not exists timer_started_by uuid references auth.users(id) on delete set null;

create table if not exists public.together_item_participation (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.together_items(id) on delete cascade,
  occurrence_date date not null,
  role text not null check (role in ('cozy','guardian')),
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (item_id, occurrence_date, role)
);

create index if not exists together_participation_item_date_idx
  on public.together_item_participation (item_id, occurrence_date);

alter table public.together_item_participation enable row level security;
revoke all on table public.together_item_participation from anon;
grant select on table public.together_item_participation to authenticated;

drop policy if exists "Together relationship members read participation" on public.together_item_participation;
create policy "Together relationship members read participation"
on public.together_item_participation for select to authenticated
using (
  exists (
    select 1
    from public.together_items item
    where item.id = together_item_participation.item_id
      and (
        auth.uid() = item.owner_user_id
        or exists (
          select 1
          from public.caregiver_links link
          where link.id = item.caregiver_link_id
            and link.owner_user_id = item.owner_user_id
            and link.active
            and link.accepted_at is not null
            and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
        )
      )
  )
);

create or replace function public.set_together_participation(
  p_item_id uuid,
  p_occurrence_date date,
  p_joined boolean,
  p_done boolean
)
returns public.together_item_participation
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.together_items;
  actor_role text;
  row_out public.together_item_participation;
begin
  select * into item from public.together_items where id = p_item_id;
  if item.id is null then raise exception 'Together item not found'; end if;

  if auth.uid() = item.owner_user_id then
    actor_role := 'cozy';
  elsif exists (
    select 1 from public.caregiver_links link
    where link.id = item.caregiver_link_id
      and link.owner_user_id = item.owner_user_id
      and link.active
      and link.accepted_at is not null
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
  ) then
    actor_role := 'guardian';
  else
    raise exception 'Not allowed';
  end if;

  insert into public.together_item_participation (
    item_id, occurrence_date, role, user_id, joined_at, done_at
  ) values (
    p_item_id,
    p_occurrence_date,
    actor_role,
    auth.uid(),
    case when p_joined or p_done then now() else null end,
    case when p_done then now() else null end
  )
  on conflict (item_id, occurrence_date, role)
  do update set
    user_id = excluded.user_id,
    joined_at = case when p_joined or p_done then coalesce(together_item_participation.joined_at, now()) else null end,
    done_at = case when p_done then now() else null end
  returning * into row_out;

  return row_out;
end;
$$;

revoke all on function public.set_together_participation(uuid, date, boolean, boolean) from public;
grant execute on function public.set_together_participation(uuid, date, boolean, boolean) to authenticated;

create or replace function public.start_together_timer(
  p_item_id uuid,
  p_minutes integer
)
returns public.together_items
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.together_items;
begin
  if p_minutes < 1 or p_minutes > 120 then
    raise exception 'Timer must be between 1 and 120 minutes';
  end if;

  select * into item from public.together_items where id = p_item_id;
  if item.id is null then raise exception 'Together item not found'; end if;

  if auth.uid() <> item.owner_user_id and not exists (
    select 1 from public.caregiver_links link
    where link.id = item.caregiver_link_id
      and link.owner_user_id = item.owner_user_id
      and link.active
      and link.accepted_at is not null
      and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email',''))
  ) then
    raise exception 'Not allowed';
  end if;

  update public.together_items
    set timer_minutes = p_minutes,
        timer_started_at = now(),
        timer_started_by = auth.uid()
    where id = p_item_id
    returning * into item;

  return item;
end;
$$;

revoke all on function public.start_together_timer(uuid, integer) from public;
grant execute on function public.start_together_timer(uuid, integer) to authenticated;
