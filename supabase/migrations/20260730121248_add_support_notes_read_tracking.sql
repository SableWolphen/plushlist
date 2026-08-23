alter table public.support_notes add column if not exists is_read boolean not null default false;

-- Owners need to be able to mark their own notes read
create policy "Owners update their notes" on public.support_notes
  for update to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);
