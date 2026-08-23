create table public.daily_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_date date not null,
  completed_keys jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, progress_date),
  constraint completed_keys_is_array check (jsonb_typeof(completed_keys) = 'array')
);

alter table public.daily_progress enable row level security;

grant select, insert, update, delete on table public.daily_progress to authenticated;

create policy "Users can read their own progress"
on public.daily_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own progress"
on public.daily_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress"
on public.daily_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own progress"
on public.daily_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);
