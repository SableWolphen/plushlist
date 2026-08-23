create policy "Owners and permitted caretakers read achievements" on public.user_achievements
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = user_achievements.user_id
        and link.active
        and link.can_view_progress
        and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );
