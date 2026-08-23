create table if not exists public.tracker_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 80),
  show_personal_schedule boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.tracker_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null check (length(task_key) between 1 and 120),
  day_id text not null check (day_id in ('daily','mon','tue','wed','thu','fri','sat','sun')),
  section text not null check (length(section) between 1 and 100),
  task text not null check (length(trim(task)) between 1 and 240),
  detail text not null default '' check (length(detail) <= 1200),
  sort_order integer not null default 0,
  is_bonus boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, task_key)
);
create index if not exists tracker_tasks_user_day_order_idx on public.tracker_tasks (user_id, day_id, sort_order);
alter table public.tracker_profiles enable row level security;
alter table public.tracker_tasks enable row level security;
grant select, insert, update, delete on public.tracker_profiles to authenticated;
grant select, insert, update, delete on public.tracker_tasks to authenticated;

drop policy if exists "Owners and invited caretakers read tracker profiles" on public.tracker_profiles;
drop policy if exists "Owners add tracker profiles" on public.tracker_profiles;
drop policy if exists "Owners update tracker profiles" on public.tracker_profiles;
drop policy if exists "Owners delete tracker profiles" on public.tracker_profiles;
create policy "Owners and invited caretakers read tracker profiles" on public.tracker_profiles for select to authenticated using (
  (select auth.uid()) = user_id or exists (
    select 1 from public.caregiver_links link where link.owner_user_id = tracker_profiles.user_id and link.active
      and lower(link.caregiver_email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
create policy "Owners add tracker profiles" on public.tracker_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update tracker profiles" on public.tracker_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete tracker profiles" on public.tracker_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Owners and invited caretakers read tracker tasks" on public.tracker_tasks;
drop policy if exists "Owners add tracker tasks" on public.tracker_tasks;
drop policy if exists "Owners update tracker tasks" on public.tracker_tasks;
drop policy if exists "Owners delete tracker tasks" on public.tracker_tasks;
create policy "Owners and invited caretakers read tracker tasks" on public.tracker_tasks for select to authenticated using (
  (select auth.uid()) = user_id or exists (
    select 1 from public.caregiver_links link where link.owner_user_id = tracker_tasks.user_id and link.active
      and lower(link.caregiver_email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
create policy "Owners add tracker tasks" on public.tracker_tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update tracker tasks" on public.tracker_tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete tracker tasks" on public.tracker_tasks for delete to authenticated using ((select auth.uid()) = user_id);

-- [Redacted before committing to this public repo: the original migration
-- also seeded one real account's personal task list and copied personal
-- progress data between two real accounts. That data has been removed;
-- only the schema and RLS policies are preserved here.]
