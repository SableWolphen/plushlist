
drop policy if exists "Guardians read requests addressed to them" on public.guardian_support_requests;
create policy "Guardians read requests addressed to them"
  on public.guardian_support_requests for select to authenticated
  using (lower(caregiver_email) = lower((select auth.jwt()) ->> 'email'));

drop policy if exists "Guardians update requests addressed to them" on public.guardian_support_requests;
create policy "Guardians update requests addressed to them"
  on public.guardian_support_requests for update to authenticated
  using (lower(caregiver_email) = lower((select auth.jwt()) ->> 'email'))
  with check (lower(caregiver_email) = lower((select auth.jwt()) ->> 'email'));
