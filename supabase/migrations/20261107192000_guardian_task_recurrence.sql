-- Recurrence belongs to an accepted agreement, never grants unilateral task acceptance.
alter table public.guardian_agreement_tasks
 add column due_on date,
 add column recurrence text check (recurrence in ('daily','weekly','monthly')),
 add column recurrence_origin uuid references public.guardian_agreement_tasks(id);
create index guardian_task_due on public.guardian_agreement_tasks(agreement_id,due_on);
create or replace function guardian_private.task_action(p_agreement_id uuid,p_action text,p_id uuid,p_body text,p_assignee uuid)
returns public.guardian_agreement_tasks language plpgsql security definer set search_path='' as $$
declare a public.guardian_agreements; t public.guardian_agreement_tasks; next_due date;
begin
 a:=guardian_private.lock_agreement(p_agreement_id);
 if a.status<>'accepted' then raise exception 'Both people must accept the agreement'; end if;
 if p_action='propose' then
   if p_assignee is null or p_assignee not in (a.owner_user_id,a.guardian_user_id) then raise exception 'Invalid assignee'; end if;
   insert into public.guardian_agreement_tasks(agreement_id,proposed_by,assignee_user_id,body)
    values(a.id,auth.uid(),p_assignee,p_body) returning * into t;
 else
   select * into t from public.guardian_agreement_tasks where id=p_id and agreement_id=a.id for update;
   if t.id is null then raise exception 'Not allowed'; end if;
   if p_action='withdraw' and auth.uid()=t.proposed_by and t.status in ('proposed','accepted') then
     update public.guardian_agreement_tasks set status='withdrawn' where id=t.id returning * into t;
   elsif auth.uid()=t.assignee_user_id and ((p_action in ('accept','decline') and t.status='proposed') or (p_action='complete' and t.status='accepted')) then
     update public.guardian_agreement_tasks set status=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'completed' end where id=t.id returning * into t;
     if p_action='complete' and t.recurrence is not null then
       next_due:=case t.recurrence when 'daily' then coalesce(t.due_on,current_date)+1 when 'weekly' then coalesce(t.due_on,current_date)+7
         else (date_trunc('month',coalesce(t.due_on,current_date)::timestamp)+interval '1 month'+
           (least(extract(day from coalesce(t.due_on,current_date))::int,
             extract(day from (date_trunc('month',coalesce(t.due_on,current_date)::timestamp)+interval '2 month - 1 day'))::int)-1)*interval '1 day')::date end;
       insert into public.guardian_agreement_tasks(agreement_id,proposed_by,assignee_user_id,body,status,due_on,recurrence,recurrence_origin)
        values(a.id,t.proposed_by,t.assignee_user_id,t.body,'accepted',next_due,t.recurrence,coalesce(t.recurrence_origin,t.id));
     end if;
   else raise exception 'Task action not allowed'; end if;
 end if;
 return t;
end;
$$;
-- An assignee may configure recurrence only on a task they accepted.
create function public.guardian_task_schedule(p_agreement_id uuid,p_task_id uuid,p_due_on date,p_recurrence text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.guardian_agreements; t public.guardian_agreement_tasks;
begin
 a:=guardian_private.lock_agreement(p_agreement_id);
 if a.status<>'accepted' then raise exception 'Agreement not accepted'; end if;
 select * into t from public.guardian_agreement_tasks where id=p_task_id and agreement_id=a.id for update;
 if t.id is null or t.assignee_user_id<>auth.uid() or t.status<>'accepted' then raise exception 'Only the accepting assignee can schedule'; end if;
 if p_recurrence is not null and p_recurrence not in ('daily','weekly','monthly') then raise exception 'Invalid recurrence'; end if;
 if p_due_on is null or p_due_on < current_date - 1 or p_due_on > current_date + 3660 then raise exception 'Invalid due date'; end if;
 update public.guardian_agreement_tasks set due_on=p_due_on,recurrence=p_recurrence where id=t.id;
 return t.id;
end;
$$;
revoke all on function public.guardian_task_schedule(uuid,uuid,date,text) from public,anon;
grant execute on function public.guardian_task_schedule(uuid,uuid,date,text) to authenticated;
