create table if not exists public.tracker_schedules (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id text not null check (day_id in ('mon','tue','wed','thu','fri','sat','sun')),
  label text not null check (length(label) between 1 and 30),
  wake text not null default '' check (length(wake) <= 80),
  morning text not null default '' check (length(morning) <= 500),
  work text not null default '' check (length(work) <= 500),
  workout text not null default '' check (length(workout) <= 500),
  home text not null default '' check (length(home) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_id)
);
alter table public.tracker_schedules enable row level security;
grant select, insert, update, delete on public.tracker_schedules to authenticated;

create policy "Owners and invited caretakers read schedules" on public.tracker_schedules
for select to authenticated using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.caregiver_links link
    where link.owner_user_id = tracker_schedules.user_id
      and link.active
      and lower(link.caregiver_email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
create policy "Owners add schedules" on public.tracker_schedules
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update schedules" on public.tracker_schedules
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete schedules" on public.tracker_schedules
for delete to authenticated using ((select auth.uid()) = user_id);

-- [Redacted before committing to this public repo: the original migration
-- also seeded one real account's personal weekly schedule details. That
-- data has been removed; only the schema and RLS policies are preserved
-- here.]
