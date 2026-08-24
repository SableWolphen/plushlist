create table if not exists public.mommy_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caregiver_voice text not null default 'motherly' check (caregiver_voice in ('motherly', 'fatherly')),
  title text not null default 'Cozy chat' check (char_length(title) between 1 and 120),
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mommy_chat_threads_owner_updated_idx on public.mommy_chat_threads (user_id, updated_at desc);
alter table public.mommy_chat_threads enable row level security;
drop policy if exists "Owners read private Mommy chats" on public.mommy_chat_threads;
create policy "Owners read private Mommy chats" on public.mommy_chat_threads for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Owners create private Mommy chats" on public.mommy_chat_threads;
create policy "Owners create private Mommy chats" on public.mommy_chat_threads for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Owners update private Mommy chats" on public.mommy_chat_threads;
create policy "Owners update private Mommy chats" on public.mommy_chat_threads for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Owners delete private Mommy chats" on public.mommy_chat_threads;
create policy "Owners delete private Mommy chats" on public.mommy_chat_threads for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on table public.mommy_chat_threads to authenticated;
grant select, insert, update, delete on table public.mommy_chat_threads to service_role;
revoke all on table public.mommy_chat_threads from anon;
comment on table public.mommy_chat_threads is 'Private resumable AI companion chats. Owner-only through RLS; never exposed to Guardians.';
