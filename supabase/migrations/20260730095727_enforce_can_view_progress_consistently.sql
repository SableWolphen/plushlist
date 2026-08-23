drop policy if exists "Owners and invited adults read daily progress" on public.daily_progress;
create policy "Owners and invited adults read daily progress" on public.daily_progress
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = daily_progress.user_id
        and link.active
        and link.can_view_progress
        and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );

drop policy if exists "Owners and invited caretakers read schedules" on public.tracker_schedules;
create policy "Owners and invited caretakers read schedules" on public.tracker_schedules
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = tracker_schedules.user_id
        and link.active
        and link.can_view_progress
        and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );
