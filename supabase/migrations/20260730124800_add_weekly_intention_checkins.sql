create table if not exists public.weekly_intention_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  feeling text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
alter table public.weekly_intention_checkins enable row level security;

create policy "Owners manage their weekly checkins" on public.weekly_intention_checkins
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
