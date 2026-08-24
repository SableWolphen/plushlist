create table if not exists public.daily_check_ins (
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null,
  capacity text check (capacity in ('very_low','low','usual','high')),
  soft_day boolean not null default false,
  custom_essentials text[],
  next_step_skip_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, check_date)
);
alter table public.daily_check_ins enable row level security;

create policy "Owners manage their daily check-ins" on public.daily_check_ins
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
