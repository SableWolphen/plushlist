create table public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  step integer not null,
  onboarding_mode text,
  event text not null,
  created_at timestamptz not null default now()
);
alter table public.onboarding_events enable row level security;

create policy "Users log their own onboarding events" on public.onboarding_events
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Admins read onboarding events" on public.onboarding_events
  for select to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));
