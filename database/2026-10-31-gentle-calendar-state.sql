-- Gentle calendar: one private row per account.
--
-- This table already exists in production (verified 2026-10-31). This file
-- records its definition in the repo so it can be recreated or reviewed.
-- It is written to be safe to run again: nothing is dropped or overwritten.

create table if not exists public.gentle_calendar_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  completed jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint items_array check (jsonb_typeof(items) = 'array'),
  constraint completed_object check (jsonb_typeof(completed) = 'object'),
  constraint items_size check (octet_length(items::text) <= 262144),
  constraint completed_size check (octet_length(completed::text) <= 131072)
);

alter table public.gentle_calendar_state enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gentle_calendar_state' and policyname = 'Calendar owner selects') then
    create policy "Calendar owner selects" on public.gentle_calendar_state
      for select using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gentle_calendar_state' and policyname = 'Calendar owner inserts') then
    create policy "Calendar owner inserts" on public.gentle_calendar_state
      for insert with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gentle_calendar_state' and policyname = 'Calendar owner updates') then
    create policy "Calendar owner updates" on public.gentle_calendar_state
      for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gentle_calendar_state' and policyname = 'Calendar owner deletes') then
    create policy "Calendar owner deletes" on public.gentle_calendar_state
      for delete using ((select auth.uid()) = user_id);
  end if;
end $$;
