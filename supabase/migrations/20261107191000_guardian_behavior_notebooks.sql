-- Optional Guardian workspace. All mutations use authenticated RPCs and
-- serialize against relationship revocation using guardian_private.lock_agreement.
create table public.guardian_behavior_events (
 id uuid primary key default gen_random_uuid(),
 agreement_id uuid not null references public.guardian_agreements(id) on delete cascade,
 author_user_id uuid not null references auth.users(id),
 body text not null check (char_length(btrim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create table public.guardian_behavior_reviews (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.guardian_behavior_events(id) on delete cascade,
 actor_user_id uuid not null references auth.users(id),
 score smallint not null check (score between -10 and 10),
 reason text not null default '' check (char_length(reason) <= 1000),
 created_at timestamptz not null default now()
);
create index guardian_behavior_event_agreement on public.guardian_behavior_events(agreement_id,created_at);
create index guardian_behavior_review_event on public.guardian_behavior_reviews(event_id,created_at);
create table public.guardian_shared_notebooks (
 id uuid primary key default gen_random_uuid(),
 agreement_id uuid not null references public.guardian_agreements(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 150),
 body text not null default '' check (char_length(body) <= 20000),
 version integer not null default 1 check (version >= 1),
 created_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table public.guardian_notebook_revisions (
 notebook_id uuid not null references public.guardian_shared_notebooks(id) on delete cascade,
 version integer not null,
 body text not null,
 actor_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(notebook_id,version)
);
create index guardian_notebook_agreement on public.guardian_shared_notebooks(agreement_id);
alter table public.guardian_behavior_events enable row level security;
alter table public.guardian_behavior_reviews enable row level security;
alter table public.guardian_shared_notebooks enable row level security;
alter table public.guardian_notebook_revisions enable row level security;
revoke all on public.guardian_behavior_events,public.guardian_behavior_reviews,public.guardian_shared_notebooks,public.guardian_notebook_revisions from public,anon,authenticated;
grant select on public.guardian_behavior_events,public.guardian_behavior_reviews,public.guardian_shared_notebooks,public.guardian_notebook_revisions to authenticated;
create policy guardian_events_read on public.guardian_behavior_events for select to authenticated using (guardian_private.can_read(agreement_id,true));
create policy guardian_reviews_read on public.guardian_behavior_reviews for select to authenticated using (exists(select 1 from public.guardian_behavior_events e where e.id=event_id and guardian_private.can_read(e.agreement_id,true)));
create policy guardian_notebooks_read on public.guardian_shared_notebooks for select to authenticated using (guardian_private.can_read(agreement_id,true));
create policy guardian_revisions_read on public.guardian_notebook_revisions for select to authenticated using (exists(select 1 from public.guardian_shared_notebooks n where n.id=notebook_id and guardian_private.can_read(n.agreement_id,true)));

create function public.guardian_behavior_action(p_agreement_id uuid,p_action text,p_event_id uuid default null,p_body text default null,p_score integer default null,p_reason text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.guardian_agreements; e public.guardian_behavior_events; result uuid;
begin
 a:=guardian_private.lock_agreement(p_agreement_id);
 if a.status<>'accepted' then raise exception 'Agreement not accepted'; end if;
 if p_action='log' then
   if p_body is null or char_length(btrim(p_body)) not between 1 and 1000 then raise exception 'Invalid event'; end if;
   insert into public.guardian_behavior_events(agreement_id,author_user_id,body) values(a.id,auth.uid(),p_body) returning id into result;
 elsif p_action='score' then
   if a.mode<>'accountability' or auth.uid()<>a.guardian_user_id then raise exception 'Only the mutually accepted Guardian evaluator may score'; end if;
   if p_score is null or p_score not between -10 and 10 or char_length(coalesce(p_reason,''))>1000 then raise exception 'Invalid score'; end if;
   select * into e from public.guardian_behavior_events where id=p_event_id and agreement_id=a.id for update;
   if e.id is null then raise exception 'Event unavailable'; end if;
   insert into public.guardian_behavior_reviews(event_id,actor_user_id,score,reason) values(e.id,auth.uid(),p_score,coalesce(p_reason,'')) returning id into result;
 else raise exception 'Unknown action'; end if;
 return result;
end;
$$;

create function public.guardian_notebook_action(p_agreement_id uuid,p_action text,p_id uuid default null,p_title text default null,p_body text default null,p_expected_version integer default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.guardian_agreements; n public.guardian_shared_notebooks; result uuid; next_version integer;
begin
 a:=guardian_private.lock_agreement(p_agreement_id);
 if a.status<>'accepted' then raise exception 'Agreement not accepted'; end if;
 if p_body is null or char_length(p_body)>20000 then raise exception 'Invalid notebook body'; end if;
 if p_action='create' then
   if p_title is null or char_length(btrim(p_title)) not between 1 and 150 then raise exception 'Invalid notebook title'; end if;
   insert into public.guardian_shared_notebooks(agreement_id,title,body,created_by) values(a.id,p_title,p_body,auth.uid()) returning * into n;
   insert into public.guardian_notebook_revisions(notebook_id,version,body,actor_user_id) values(n.id,1,n.body,auth.uid());
   result:=n.id;
 elsif p_action='edit' then
   select * into n from public.guardian_shared_notebooks where id=p_id and agreement_id=a.id for update;
   if n.id is null or p_expected_version is null or n.version<>p_expected_version then raise exception 'Notebook edit conflict'; end if;
   next_version:=n.version+1;
   update public.guardian_shared_notebooks set body=p_body,version=next_version,updated_at=now() where id=n.id;
   insert into public.guardian_notebook_revisions(notebook_id,version,body,actor_user_id) values(n.id,next_version,p_body,auth.uid());
   result:=n.id;
 else raise exception 'Unknown action'; end if;
 return result;
end;
$$;
revoke all on function public.guardian_behavior_action(uuid,text,uuid,text,integer,text),public.guardian_notebook_action(uuid,text,uuid,text,text,integer) from public,anon;
grant execute on function public.guardian_behavior_action(uuid,text,uuid,text,integer,text),public.guardian_notebook_action(uuid,text,uuid,text,text,integer) to authenticated;
