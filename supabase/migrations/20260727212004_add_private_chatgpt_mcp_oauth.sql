create table if not exists public.glow_mcp_oauth_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  redirect_uri text not null,
  resource text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.glow_mcp_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  resource text not null,
  scope text not null,
  expires_at timestamptz not null
);

alter table public.glow_mcp_oauth_codes enable row level security;
alter table public.glow_mcp_tokens enable row level security;

revoke all on table public.glow_mcp_oauth_codes from public, anon, authenticated;
revoke all on table public.glow_mcp_tokens from public, anon, authenticated;
