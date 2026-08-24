drop policy if exists "Owners and permitted caretakers read tracker tasks" on public.tracker_tasks;
create policy "Owners read tracker tasks" on public.tracker_tasks for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Owners and invited caretakers read schedules" on public.tracker_schedules;
create policy "Owners read schedules" on public.tracker_schedules for select to authenticated using ((select auth.uid()) = user_id);
