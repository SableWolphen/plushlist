create policy "Owners delete their notes" on public.support_notes
  for delete to authenticated
  using (auth.uid() = owner_user_id);
