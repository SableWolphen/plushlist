create table if not exists public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  url text,
  created_at timestamptz not null default now()
);
alter table public.app_error_logs enable row level security;
create policy "Users can insert their own error logs" on public.app_error_logs
  for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  message text not null check (length(message) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.feedback_messages enable row level security;
create policy "Users can send feedback" on public.feedback_messages
  for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);
