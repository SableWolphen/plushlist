-- Google Calendar two-way sync: OAuth tokens and per-item sync bookkeeping.
-- Both tables hold nothing the client needs to read directly (the raw
-- refresh token, and internal Google event-id mappings), so they follow the
-- same "service_role only" pattern already used for glow_mcp_tokens /
-- glow_mcp_oauth_codes. A SECURITY DEFINER RPC below exposes only the
-- safe status fields a signed-in user needs to see in Settings.

create table public.calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text not null,
  google_calendar_id text not null, -- the dedicated "PlushLife" secondary calendar created for this user, not their primary calendar
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_connections enable row level security;

create policy "Service role only"
  on public.calendar_connections
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.calendar_connections is 'Google OAuth tokens for the two-way calendar sync feature. Raw tokens never exposed to clients — service_role (Edge Functions) only. Use get_calendar_connection_status() for client-safe status.';

-- Maps a local schedule/task row to the Google Calendar event it's synced
-- to, so repeat syncs update the existing event instead of duplicating it,
-- and either side's edits since the last sync can be detected.
create table public.calendar_sync_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_table text not null check (source_table in ('tracker_task', 'schedule_entry')),
  source_key text not null, -- tracker_tasks.task_key, or "<day_id>:<entry.id>" for a schedule_entries row
  google_event_id text not null,
  local_updated_at timestamptz not null, -- our own row's updated_at/created_at at the time we last pushed it
  google_updated_at timestamptz not null, -- Google's event.updated at the time we last pulled/pushed it
  deleted_locally boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_table, source_key),
  unique (user_id, google_event_id)
);

alter table public.calendar_sync_links enable row level security;

create policy "Service role only"
  on public.calendar_sync_links
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.calendar_sync_links is 'Bookkeeping for the Google Calendar two-way sync — maps local tracker_tasks/schedule entries to Google event ids. service_role only.';

-- Client-safe status check for Settings ("Connected as you@gmail.com",
-- last synced time, last error) without ever exposing the refresh/access
-- tokens themselves.
create or replace function public.get_calendar_connection_status()
returns table (
  connected boolean,
  google_email text,
  last_synced_at timestamptz,
  last_sync_error text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    true,
    cc.google_email,
    cc.last_synced_at,
    cc.last_sync_error
  from public.calendar_connections cc
  where cc.user_id = auth.uid()
$$;

revoke all on function public.get_calendar_connection_status() from public, anon;
grant execute on function public.get_calendar_connection_status() to authenticated;

-- Lets a signed-in user disconnect their own calendar sync without needing
-- a round trip through an Edge Function just to delete their own row.
create or replace function public.disconnect_calendar_sync()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.calendar_connections where user_id = auth.uid();
  delete from public.calendar_sync_links where user_id = auth.uid();
$$;

revoke all on function public.disconnect_calendar_sync() from public, anon;
grant execute on function public.disconnect_calendar_sync() to authenticated;
