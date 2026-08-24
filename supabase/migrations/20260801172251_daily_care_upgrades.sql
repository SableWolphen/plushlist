-- PlushLife daily-care upgrades
-- Run in the Supabase SQL editor before deploying the matching web build.

alter table public.tracker_tasks
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists schedule_days text[] not null default '{}',
  add column if not exists reminder_time time;

alter table public.tracker_tasks
  drop constraint if exists tracker_tasks_archive_reason_check,
  add constraint tracker_tasks_archive_reason_check
    check (
      archive_reason is null
      or archive_reason in ('completed_goal', 'no_longer_needed', 'changed_routine', 'medication_changed', 'other')
    ),
  drop constraint if exists tracker_tasks_schedule_days_check,
  add constraint tracker_tasks_schedule_days_check
    check (schedule_days <@ array['sun','mon','tue','wed','thu','fri','sat']::text[]);

create index if not exists tracker_tasks_user_active_idx
  on public.tracker_tasks(user_id, day_id, sort_order)
  where archived_at is null;

create table if not exists public.task_snoozes (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  snoozed_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, task_key)
);

create index if not exists task_snoozes_user_until_idx
  on public.task_snoozes(user_id, snoozed_until);

alter table public.task_snoozes enable row level security;
grant select, insert, update, delete on public.task_snoozes to authenticated;

drop policy if exists "Owners read their task snoozes" on public.task_snoozes;
create policy "Owners read their task snoozes"
  on public.task_snoozes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Owners create their task snoozes" on public.task_snoozes;
create policy "Owners create their task snoozes"
  on public.task_snoozes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners update their task snoozes" on public.task_snoozes;
create policy "Owners update their task snoozes"
  on public.task_snoozes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners delete their task snoozes" on public.task_snoozes;
create policy "Owners delete their task snoozes"
  on public.task_snoozes for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on column public.tracker_tasks.archived_at is
  'Stops future scheduling while preserving task history.';
comment on column public.tracker_tasks.schedule_days is
  'Optional multi-weekday schedule; empty keeps the legacy day_id behavior.';
comment on table public.task_snoozes is
  'Private per-user task reminder postponements. Expired rows may be deleted safely.';

alter table public.caregiver_links
  add column if not exists care_agreement text;

alter table public.caregiver_links
  drop constraint if exists caregiver_links_care_agreement_length;

alter table public.caregiver_links
  add constraint caregiver_links_care_agreement_length
  check (care_agreement is null or char_length(care_agreement) <= 1000);

comment on column public.caregiver_links.care_agreement is
  'Cozy-authored boundaries and support preferences for this Guardian relationship.';
