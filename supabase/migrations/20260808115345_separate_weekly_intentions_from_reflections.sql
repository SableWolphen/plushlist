-- Store weekly intentions separately from dated journal reflections.
-- This keeps intentions out of the reflection calendar and allows a Sunday
-- journal entry and a weekly intention to coexist without overwriting either.

create table if not exists public.weekly_intentions (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start),
  constraint weekly_intentions_body_length check (char_length(body) <= 2000)
);

alter table public.weekly_intentions enable row level security;

drop policy if exists "Owners read weekly intentions" on public.weekly_intentions;
create policy "Owners read weekly intentions"
on public.weekly_intentions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners add weekly intentions" on public.weekly_intentions;
create policy "Owners add weekly intentions"
on public.weekly_intentions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners update weekly intentions" on public.weekly_intentions;
create policy "Owners update weekly intentions"
on public.weekly_intentions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners delete weekly intentions" on public.weekly_intentions;
create policy "Owners delete weekly intentions"
on public.weekly_intentions for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.weekly_intentions to authenticated;
grant select, insert, update, delete on table public.weekly_intentions to service_role;
