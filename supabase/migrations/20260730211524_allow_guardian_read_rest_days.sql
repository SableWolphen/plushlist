create policy "Permitted guardians read owners rest days" on public.rest_days
  for select to authenticated
  using (
    exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = rest_days.user_id
        and link.active
        and link.can_view_progress
        and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );
