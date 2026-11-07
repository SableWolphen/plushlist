-- Additive only: no existing task, mood, relationship permission or progress changes.
create schema if not exists guardian_private;
revoke all on schema guardian_private from public, anon;
grant usage on schema guardian_private to authenticated;

create table public.guardian_agreements (
  id uuid primary key default gen_random_uuid(),
  caregiver_link_id uuid not null references public.caregiver_links(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  guardian_user_id uuid not null references auth.users(id) on delete cascade,
  proposed_by uuid not null references auth.users(id),
  mode text not null default 'supportive' check (mode in ('supportive','accountability')),
  expectations text not null check (char_length(btrim(expectations)) between 1 and 2000),
  boundaries text not null check (char_length(btrim(boundaries)) between 1 and 2000),
  rewards text not null default '' check (char_length(rewards) <= 1000),
  consequences text not null default '' check (char_length(consequences) <= 1000),
  status text not null default 'proposed' check (status in ('proposed','accepted','revoked')),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (owner_user_id <> guardian_user_id),
  check (proposed_by in (owner_user_id, guardian_user_id)),
  check (accepted_by is null or (accepted_by in (owner_user_id, guardian_user_id) and accepted_by <> proposed_by)),
  check (status <> 'accepted' or (accepted_by is not null and accepted_at is not null)),
  check (status <> 'revoked' or revoked_at is not null),
  check (mode = 'accountability' or consequences = '')
);
create unique index guardian_agreement_live_link on public.guardian_agreements(caregiver_link_id) where status <> 'revoked';
create index guardian_agreement_owner on public.guardian_agreements(owner_user_id);
create index guardian_agreement_guardian on public.guardian_agreements(guardian_user_id);

create table public.guardian_agreement_tasks (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.guardian_agreements(id) on delete cascade,
  proposed_by uuid not null references auth.users(id),
  assignee_user_id uuid not null references auth.users(id),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  status text not null default 'proposed' check (status in ('proposed','accepted','completed','declined','withdrawn')),
  created_at timestamptz not null default now()
);
create index guardian_agreement_task_parent on public.guardian_agreement_tasks(agreement_id, created_at);

create table public.guardian_agreement_moods (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.guardian_agreements(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index guardian_agreement_mood_parent on public.guardian_agreement_moods(agreement_id, created_at);
create index guardian_agreement_mood_author on public.guardian_agreement_moods(author_user_id);

-- Narrow privileged helpers live outside the exposed public schema. No user metadata
-- or client-supplied email authorizes access. Private records never join daily_check_ins.
create function guardian_private.can_read(p_id uuid, p_accepted boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.guardian_agreements a
    join public.caregiver_links l on l.id = a.caregiver_link_id
    join auth.users g on g.id = a.guardian_user_id
    where a.id = p_id and auth.uid() in (a.owner_user_id, a.guardian_user_id)
      and l.owner_user_id = a.owner_user_id
      and l.active and l.accepted_at is not null
      and lower(l.caregiver_email) = lower(g.email)
      and (not p_accepted or a.status = 'accepted')
  );
$$;

alter table public.guardian_agreements enable row level security;
alter table public.guardian_agreement_tasks enable row level security;
alter table public.guardian_agreement_moods enable row level security;
revoke all on public.guardian_agreements, public.guardian_agreement_tasks, public.guardian_agreement_moods from public, anon, authenticated;
grant select on public.guardian_agreements, public.guardian_agreement_tasks, public.guardian_agreement_moods to authenticated;
create policy agreement_members_read on public.guardian_agreements for select to authenticated
  using (owner_user_id = (select auth.uid()) or guardian_private.can_read(id));
create policy agreement_tasks_read on public.guardian_agreement_tasks for select to authenticated
  using (guardian_private.can_read(agreement_id, true));
create policy agreement_moods_read on public.guardian_agreement_moods for select to authenticated
  using (author_user_id = (select auth.uid()) or (shared and guardian_private.can_read(agreement_id, true)));

-- All writes lock relationship then agreement, serializing consent withdrawal with
-- acceptance, sharing and task actions. Direct table writes are never granted.
create function guardian_private.lock_agreement(p_id uuid, p_active boolean default true)
returns public.guardian_agreements language plpgsql security definer set search_path = '' as $$
declare a public.guardian_agreements; link_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select caregiver_link_id into link_id from public.guardian_agreements where id = p_id;
  perform 1 from public.caregiver_links where id = link_id for update;
  select * into a from public.guardian_agreements where id = p_id for update;
  if a.id is null or auth.uid() not in (a.owner_user_id, a.guardian_user_id) then raise exception 'Not allowed'; end if;
  if p_active and not guardian_private.can_read(a.id) then raise exception 'Relationship unavailable'; end if;
  return a;
end;
$$;

create function guardian_private.agreement_action(p_id uuid, p_action text, p_link_id uuid, p_terms jsonb)
returns public.guardian_agreements language plpgsql security definer set search_path = '' as $$
declare a public.guardian_agreements; l public.caregiver_links; g uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_action = 'propose' then
    select * into l from public.caregiver_links where id = p_link_id for update;
    select id into g from auth.users where lower(email) = lower(l.caregiver_email);
    if l.id is null or not l.active or l.accepted_at is null or g is null
      or auth.uid() not in (l.owner_user_id, g) then raise exception 'Not allowed'; end if;
    insert into public.guardian_agreements(caregiver_link_id,owner_user_id,guardian_user_id,proposed_by,mode,expectations,boundaries,rewards,consequences)
    values(l.id,l.owner_user_id,g,auth.uid(),coalesce(p_terms->>'mode','supportive'),p_terms->>'expectations',p_terms->>'boundaries',coalesce(p_terms->>'rewards',''),coalesce(p_terms->>'consequences','')) returning * into a;
  elsif p_action = 'accept' then
    a := guardian_private.lock_agreement(p_id);
    if a.status <> 'proposed' or auth.uid() = a.proposed_by then raise exception 'Other participant must accept the proposal'; end if;
    update public.guardian_agreements set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=a.id returning * into a;
  elsif p_action = 'revoke' then
    a := guardian_private.lock_agreement(p_id, false);
    if a.status <> 'revoked' then
      update public.guardian_agreements set status='revoked',revoked_by=auth.uid(),revoked_at=now() where id=a.id returning * into a;
    end if;
  else raise exception 'Unknown agreement action'; end if;
  return a;
end;
$$;

create function public.guardian_agreement_action(p_action text, p_id uuid default null, p_link_id uuid default null, p_terms jsonb default null)
returns public.guardian_agreements language sql security invoker set search_path = '' as $$
  select guardian_private.agreement_action(p_id,p_action,p_link_id,p_terms);
$$;

create function guardian_private.task_action(p_agreement_id uuid,p_action text,p_id uuid,p_body text,p_assignee uuid)
returns public.guardian_agreement_tasks language plpgsql security definer set search_path = '' as $$
declare a public.guardian_agreements; t public.guardian_agreement_tasks;
begin
  a := guardian_private.lock_agreement(p_agreement_id);
  if a.status <> 'accepted' then raise exception 'Both people must accept the agreement'; end if;
  if p_action = 'propose' then
    if p_assignee is null or p_assignee not in (a.owner_user_id,a.guardian_user_id) then raise exception 'Invalid assignee'; end if;
    insert into public.guardian_agreement_tasks(agreement_id,proposed_by,assignee_user_id,body)
      values(a.id,auth.uid(),p_assignee,p_body) returning * into t;
  else
    select * into t from public.guardian_agreement_tasks where id=p_id and agreement_id=a.id for update;
    if t.id is null then raise exception 'Not allowed'; end if;
    if p_action = 'withdraw' and auth.uid() = t.proposed_by and t.status in ('proposed','accepted') then
      update public.guardian_agreement_tasks set status='withdrawn' where id=t.id returning * into t;
    elsif auth.uid() = t.assignee_user_id and
      ((p_action in ('accept','decline') and t.status='proposed') or (p_action='complete' and t.status='accepted')) then
      update public.guardian_agreement_tasks set status=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'completed' end
        where id=t.id returning * into t;
    else raise exception 'Task action not allowed'; end if;
  end if;
  return t;
end;
$$;
create function public.guardian_agreement_task_action(p_agreement_id uuid,p_action text,p_id uuid default null,p_body text default null,p_assignee uuid default null)
returns public.guardian_agreement_tasks language sql security invoker set search_path = '' as $$
  select guardian_private.task_action(p_agreement_id,p_action,p_id,p_body,p_assignee);
$$;

create function guardian_private.mood_action(p_agreement_id uuid,p_action text,p_id uuid,p_body text,p_shared boolean)
returns public.guardian_agreement_moods language plpgsql security definer set search_path = '' as $$
declare a public.guardian_agreements; m public.guardian_agreement_moods;
begin
  -- Unsharing/deletion is allowed even after withdrawal. No other operation is.
  a := guardian_private.lock_agreement(p_agreement_id, p_action not in ('unshare','delete'));
  if p_action='create' and a.status='accepted' then
    insert into public.guardian_agreement_moods(agreement_id,author_user_id,body,shared)
      values(a.id,auth.uid(),p_body,coalesce(p_shared,false)) returning * into m;
  else
    select * into m from public.guardian_agreement_moods where id=p_id and agreement_id=a.id and author_user_id=auth.uid() for update;
    if m.id is null then raise exception 'Not allowed'; end if;
    if p_action='delete' then delete from public.guardian_agreement_moods where id=m.id;
    elsif p_action='unshare' or (p_action='share' and a.status='accepted') then
      update public.guardian_agreement_moods set shared=(p_action='share') where id=m.id returning * into m;
    else raise exception 'Mood action not allowed'; end if;
  end if;
  return m;
end;
$$;
create function public.guardian_agreement_mood_action(p_agreement_id uuid,p_action text,p_id uuid default null,p_body text default null,p_shared boolean default false)
returns public.guardian_agreement_moods language sql security invoker set search_path = '' as $$
  select guardian_private.mood_action(p_agreement_id,p_action,p_id,p_body,p_shared);
$$;

-- Pausing/changing a connection invalidates consent permanently; resuming never
-- revives an old agreement. This trigger never changes the relationship itself.
create function guardian_private.invalidate_agreements()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.active is distinct from old.active or new.accepted_at is distinct from old.accepted_at
    or new.owner_user_id is distinct from old.owner_user_id or lower(new.caregiver_email) is distinct from lower(old.caregiver_email) then
    update public.guardian_agreements set status='revoked',revoked_at=now(),revoked_by=auth.uid()
      where caregiver_link_id=new.id and status <> 'revoked';
  end if;
  return new;
end;
$$;
create trigger invalidate_guardian_agreements after update on public.caregiver_links
for each row execute function guardian_private.invalidate_agreements();

revoke all on all functions in schema guardian_private from public, anon, authenticated;
grant execute on function guardian_private.can_read(uuid,boolean),guardian_private.agreement_action(uuid,text,uuid,jsonb),guardian_private.task_action(uuid,text,uuid,text,uuid),guardian_private.mood_action(uuid,text,uuid,text,boolean) to authenticated;
revoke all on function public.guardian_agreement_action(text,uuid,uuid,jsonb),public.guardian_agreement_task_action(uuid,text,uuid,text,uuid),public.guardian_agreement_mood_action(uuid,text,uuid,text,boolean) from public, anon;
grant execute on function public.guardian_agreement_action(text,uuid,uuid,jsonb),public.guardian_agreement_task_action(uuid,text,uuid,text,uuid),public.guardian_agreement_mood_action(uuid,text,uuid,text,boolean) to authenticated;
