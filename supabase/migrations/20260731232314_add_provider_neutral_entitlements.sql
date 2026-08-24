-- Provider-neutral entitlement record. Google Play Billing today, an Apple
-- StoreKit adapter later — both write through the same shape so the app
-- doesn't need provider-specific UI/logic to know what a user has access to.
-- Entirely additive: no existing table is touched, and beta behavior (every
-- feature unlocked, no purchase UI) doesn't depend on this table at all.
--
-- Purchases must be verified server-side (Google Play Developer API /
-- App Store Server API) before a row here is trusted, so only service_role
-- may write. Clients may only read their own row, once billing UI exists
-- that needs to check status — nothing reads this table yet.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_play', 'apple_app_store')),
  platform text not null check (platform in ('android', 'ios')),
  product_id text not null,
  original_transaction_reference text,
  purchase_token_reference text,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'in_grace_period', 'on_hold', 'revoked')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  auto_renewing boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entitlements_user_id_idx on public.entitlements(user_id);

alter table public.entitlements enable row level security;

revoke all on table public.entitlements from anon;
revoke all on table public.entitlements from authenticated;
grant select on table public.entitlements to authenticated;

drop policy if exists "Owners read their own entitlements" on public.entitlements;
create policy "Owners read their own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated/anon: only service_role
-- (which bypasses RLS entirely) can write, i.e. only a trusted server-side
-- verification path — never a client-reported "purchase succeeded" call.
