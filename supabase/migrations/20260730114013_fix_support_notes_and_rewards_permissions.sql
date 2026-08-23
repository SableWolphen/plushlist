-- support_notes: allow the owner (self-note) or an actively permitted caregiver to insert
create policy "Owners and permitted caretakers add notes" on public.support_notes
  for insert to authenticated
  with check (
    (auth.uid() = owner_user_id and auth.uid() = caregiver_user_id)
    or (
      auth.uid() = caregiver_user_id
      and exists (
        select 1 from public.caregiver_links link
        where link.owner_user_id = support_notes.owner_user_id
          and link.active
          and link.can_send_notes
          and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    )
  );

-- support_rewards: allow the owner (self-reward) or an actively permitted caregiver to insert
create policy "Owners and permitted caretakers add rewards" on public.support_rewards
  for insert to authenticated
  with check (
    (auth.uid() = owner_user_id and auth.uid() = caregiver_user_id)
    or (
      auth.uid() = caregiver_user_id
      and exists (
        select 1 from public.caregiver_links link
        where link.owner_user_id = support_rewards.owner_user_id
          and link.active
          and link.can_add_rewards
          and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    )
  );

-- Tighten support_rewards UPDATE so a removed/paused guardian can no longer approve rewards
drop policy if exists "Owners and caretakers update relevant rewards" on public.support_rewards;
create policy "Owners and permitted caretakers update rewards" on public.support_rewards
  for update to authenticated
  using (
    auth.uid() = owner_user_id
    or (
      auth.uid() = caregiver_user_id
      and exists (
        select 1 from public.caregiver_links link
        where link.owner_user_id = support_rewards.owner_user_id
          and link.active
          and link.can_add_rewards
          and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    )
  )
  with check (
    auth.uid() = owner_user_id
    or (
      auth.uid() = caregiver_user_id
      and exists (
        select 1 from public.caregiver_links link
        where link.owner_user_id = support_rewards.owner_user_id
          and link.active
          and link.can_add_rewards
          and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    )
  );

-- Tighten support_rewards DELETE the same way
drop policy if exists "Invited adults delete their own rewards" on public.support_rewards;
create policy "Owners and permitted caretakers delete rewards" on public.support_rewards
  for delete to authenticated
  using (
    auth.uid() = owner_user_id
    or (
      auth.uid() = caregiver_user_id
      and exists (
        select 1 from public.caregiver_links link
        where link.owner_user_id = support_rewards.owner_user_id
          and link.active
          and link.can_add_rewards
          and lower(link.caregiver_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    )
  );
