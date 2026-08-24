-- Short-lived, one-time state tokens for the Google Calendar OAuth
-- handoff — mirrors the existing glow_mcp_oauth_codes pattern. Needed
-- because Google's redirect back to our callback endpoint carries no
-- Supabase session, so this is how the callback learns which user
-- initiated the connection, without trusting an unsigned client-supplied
-- user id.
create table public.calendar_oauth_state (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

alter table public.calendar_oauth_state enable row level security;

create policy "Service role only"
  on public.calendar_oauth_state
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.calendar_oauth_state is 'One-time state tokens for the Google Calendar OAuth callback to identify the initiating user. service_role only — see start_calendar_oauth().';

create or replace function public.start_calendar_oauth()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_state text;
begin
  delete from public.calendar_oauth_state where user_id = auth.uid();
  new_state := encode(gen_random_bytes(32), 'hex');
  insert into public.calendar_oauth_state (state, user_id, expires_at)
  values (new_state, auth.uid(), now() + interval '10 minutes');
  return new_state;
end;
$$;

revoke all on function public.start_calendar_oauth() from public, anon;
grant execute on function public.start_calendar_oauth() to authenticated;
