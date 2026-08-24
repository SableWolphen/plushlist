create table if not exists public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_exceptions_date_range_check check (end_date >= start_date),
  constraint schedule_exceptions_entries_array_check check (jsonb_typeof(entries) = 'array')
);

create index if not exists schedule_exceptions_user_dates_idx
  on public.schedule_exceptions (user_id, start_date, end_date);

grant select, insert, update, delete on table public.schedule_exceptions to authenticated;
alter table public.schedule_exceptions enable row level security;

create policy "Users can read their own schedule exceptions"
  on public.schedule_exceptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can add their own schedule exceptions"
  on public.schedule_exceptions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own schedule exceptions"
  on public.schedule_exceptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own schedule exceptions"
  on public.schedule_exceptions for delete to authenticated
  using ((select auth.uid()) = user_id);
