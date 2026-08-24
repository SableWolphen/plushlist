
drop policy if exists "Owners manage their support requests" on public.guardian_support_requests;
drop policy if exists "Guardians read requests addressed to them" on public.guardian_support_requests;
drop policy if exists "Guardians update requests addressed to them" on public.guardian_support_requests;

drop policy if exists "Owners create their support requests" on public.guardian_support_requests;
create policy "Owners create their support requests"
  on public.guardian_support_requests for insert to authenticated
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Owners delete their support requests" on public.guardian_support_requests;
create policy "Owners delete their support requests"
  on public.guardian_support_requests for delete to authenticated
  using ((select auth.uid()) = owner_user_id);

drop policy if exists "Owners and addressed Guardians read support requests" on public.guardian_support_requests;
create policy "Owners and addressed Guardians read support requests"
  on public.guardian_support_requests for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or lower(caregiver_email) = lower((select auth.jwt()) ->> 'email')
  );

drop policy if exists "Owners and addressed Guardians update support requests" on public.guardian_support_requests;
create policy "Owners and addressed Guardians update support requests"
  on public.guardian_support_requests for update to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or lower(caregiver_email) = lower((select auth.jwt()) ->> 'email')
  )
  with check (
    (select auth.uid()) = owner_user_id
    or lower(caregiver_email) = lower((select auth.jwt()) ->> 'email')
  );
