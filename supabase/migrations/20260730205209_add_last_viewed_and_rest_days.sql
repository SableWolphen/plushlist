-- Guardian last-viewed transparency
alter table public.caregiver_links add column if not exists last_viewed_at timestamptz;

create policy "Caregivers update their own last_viewed" on public.caregiver_links
  for update to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) = lower(caregiver_email))
  with check (lower(coalesce((auth.jwt() ->> 'email'), '')) = lower(caregiver_email));

-- Rest Day / Vacation mode
create table if not exists public.rest_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  rest_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, rest_date)
);
alter table public.rest_days enable row level security;

create policy "Owners manage their own rest days" on public.rest_days
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
