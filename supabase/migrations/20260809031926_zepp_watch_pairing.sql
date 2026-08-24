create table if not exists public.watch_pairings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_secret_hash text not null unique,
  pairing_code text unique,
  pairing_expires_at timestamptz,
  device_name text not null default 'Amazfit watch',
  linked_at timestamptz,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists watch_pairings_user_idx on public.watch_pairings(user_id) where revoked_at is null;
alter table public.watch_pairings enable row level security;
revoke all on public.watch_pairings from anon, authenticated;
create or replace function public.claim_watch_pairing(p_pairing_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare pairing public.watch_pairings;
begin
  if auth.uid() is null then raise exception 'Sign in before connecting a watch'; end if;
  update public.watch_pairings
  set user_id=auth.uid(), linked_at=now(), pairing_code=null, pairing_expires_at=null, revoked_at=null
  where pairing_code=upper(trim(p_pairing_code)) and user_id is null and revoked_at is null and pairing_expires_at > now()
  returning * into pairing;
  if pairing.id is null then raise exception 'That code is invalid or expired'; end if;
  return jsonb_build_object('connected', true, 'device_name', pairing.device_name);
end; $$;
revoke all on function public.claim_watch_pairing(text) from public, anon;
grant execute on function public.claim_watch_pairing(text) to authenticated;
comment on table public.watch_pairings is 'Hashed Zepp watch credentials and temporary pairing codes; accessible only through controlled functions.';
comment on function public.claim_watch_pairing(text) is 'Claims an unexpired Zepp pairing code for the currently authenticated PlushLife user.';
