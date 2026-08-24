-- PlushLife adaptive care system
-- Run in the Supabase SQL editor before deploying the matching web build.

alter table public.daily_check_ins
  add column if not exists mood text,
  add column if not exists energy text,
  add column if not exists day_type text not null default 'full',
  add column if not exists support_preference text,
  add column if not exists context_tags text[] not null default '{}',
  add column if not exists note text;

alter table public.daily_check_ins
  drop constraint if exists daily_check_ins_mood_check,
  add constraint daily_check_ins_mood_check
    check (mood is null or mood in ('happy','calm','okay','tired','stressed','anxious','sad','angry','lonely','overwhelmed','numb','sick')),
  drop constraint if exists daily_check_ins_energy_check,
  add constraint daily_check_ins_energy_check
    check (energy is null or energy in ('empty','low','steady','high')),
  drop constraint if exists daily_check_ins_day_type_check,
  add constraint daily_check_ins_day_type_check
    check (day_type in ('full','soft','tiny','recovery','rest'));

alter table public.tracker_tasks
  add column if not exists soft_label text,
  add column if not exists tiny_label text,
  add column if not exists estimated_minutes integer,
  add column if not exists essential_on_low_capacity boolean not null default false;

alter table public.tracker_tasks
  drop constraint if exists tracker_tasks_estimated_minutes_check,
  add constraint tracker_tasks_estimated_minutes_check
    check (estimated_minutes is null or estimated_minutes between 1 and 1440);

alter table public.app_preferences
  add column if not exists pattern_insights_enabled boolean not null default true;

create table if not exists public.care_session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  session_kind text not null default 'care',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  outcome text,
  check_date date not null default current_date,
  constraint care_session_logs_outcome_check
    check (outcome is null or outcome in ('helped','a_little','not_really','worse','skipped'))
);

create index if not exists care_session_logs_user_date_idx
  on public.care_session_logs(user_id, check_date desc);

alter table public.care_session_logs enable row level security;
grant select, insert, update, delete on public.care_session_logs to authenticated;

drop policy if exists "Owners read their care sessions" on public.care_session_logs;
create policy "Owners read their care sessions"
  on public.care_session_logs for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Owners create their care sessions" on public.care_session_logs;
create policy "Owners create their care sessions"
  on public.care_session_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners update their care sessions" on public.care_session_logs;
create policy "Owners update their care sessions"
  on public.care_session_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners delete their care sessions" on public.care_session_logs;
create policy "Owners delete their care sessions"
  on public.care_session_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.plush_path_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id text not null,
  current_day integer not null default 1,
  completed_days integer[] not null default '{}',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, path_id),
  constraint plush_path_progress_day_check check (current_day between 1 and 365),
  constraint plush_path_progress_status_check check (status in ('active','paused','completed'))
);

alter table public.plush_path_progress enable row level security;
grant select, insert, update, delete on public.plush_path_progress to authenticated;

drop policy if exists "Owners manage their path progress" on public.plush_path_progress;
create policy "Owners manage their path progress"
  on public.plush_path_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.guardian_support_requests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  caregiver_email text not null,
  request_type text not null,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint guardian_support_requests_type_check
    check (request_type in ('company','practical_help','encouragement','space','call','body_double')),
  constraint guardian_support_requests_status_check
    check (status in ('open','acknowledged','resolved','cancelled'))
);

create index if not exists guardian_support_requests_owner_idx
  on public.guardian_support_requests(owner_user_id, created_at desc);
create index if not exists guardian_support_requests_email_idx
  on public.guardian_support_requests(lower(caregiver_email), created_at desc);

alter table public.guardian_support_requests enable row level security;
grant select, insert, delete on public.guardian_support_requests to authenticated;
grant update(status, resolved_at) on public.guardian_support_requests to authenticated;

drop policy if exists "Owners manage their support requests" on public.guardian_support_requests;
create policy "Owners manage their support requests"
  on public.guardian_support_requests for all to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Guardians read requests addressed to them" on public.guardian_support_requests;
create policy "Guardians read requests addressed to them"
  on public.guardian_support_requests for select to authenticated
  using (lower(caregiver_email) = lower((select auth.jwt() ->> 'email')));

drop policy if exists "Guardians update requests addressed to them" on public.guardian_support_requests;
create policy "Guardians update requests addressed to them"
  on public.guardian_support_requests for update to authenticated
  using (lower(caregiver_email) = lower((select auth.jwt() ->> 'email')))
  with check (lower(caregiver_email) = lower((select auth.jwt() ->> 'email')));

comment on table public.care_session_logs is 'Private records of PlushCare and PlushSleep sessions and user-reported outcomes.';
comment on table public.plush_path_progress is 'Private progress through the free guided PlushPaths.';
comment on table public.guardian_support_requests is 'Consent-based support requests addressed to a selected Guardian.';
