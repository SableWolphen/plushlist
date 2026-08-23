-- Admins can clear error logs
create policy "Admins delete error logs" on public.app_error_logs
  for delete to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));

-- Lightweight presence heartbeat table
create table public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  last_active_at timestamptz not null default now()
);
alter table public.user_presence enable row level security;

create policy "Owners upsert their own presence" on public.user_presence
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Owners update their own presence" on public.user_presence
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read presence" on public.user_presence
  for select to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));
