-- Keep each person's task list private by default.
-- Guardians can only read tasks for an accepted, active relationship when
-- the Cozy explicitly enabled task sharing.

drop policy if exists "Owners and invited caretakers read tracker tasks" on public.tracker_tasks;
drop policy if exists "Owners and permitted Guardians read tracker tasks" on public.tracker_tasks;

create policy "Owners and permitted Guardians read tracker tasks"
on public.tracker_tasks
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.caregiver_links link
    where link.owner_user_id = tracker_tasks.user_id
      and link.active
      and link.accepted_at is not null
      and coalesce(link.can_view_tasks, false)
      and lower(link.caregiver_email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
