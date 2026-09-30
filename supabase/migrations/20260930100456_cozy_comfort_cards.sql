-- The comfort passport is owner-only. Guardians receive a separate, explicit snapshot.
create table public.cozy_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint cozy_profile_object check (jsonb_typeof(profile) = 'object' and octet_length(profile::text) <= 100000)
);
alter table public.cozy_profiles enable row level security;
revoke all on public.cozy_profiles from anon, authenticated;
grant select, insert, update, delete on public.cozy_profiles to authenticated;
create policy "Cozy owns their comfort passport" on public.cozy_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.cozy_shared_cards (
  link_id uuid primary key references public.caregiver_links(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  card jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint cozy_card_object check (jsonb_typeof(card) = 'object' and octet_length(card::text) <= 100000)
);
create index cozy_shared_cards_owner_idx on public.cozy_shared_cards(owner_user_id);
alter table public.cozy_shared_cards enable row level security;
revoke all on public.cozy_shared_cards from anon, authenticated;
grant select, insert, update, delete on public.cozy_shared_cards to authenticated;
create policy "Cozy manages their shared cards" on public.cozy_shared_cards for all to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id and exists (
    select 1 from public.caregiver_links l where l.id = link_id and l.owner_user_id = (select auth.uid())
  ));
create policy "Accepted active Guardian reads selected card" on public.cozy_shared_cards for select to authenticated
  using (active and exists (
    select 1 from public.caregiver_links l where l.id = link_id and l.owner_user_id = cozy_shared_cards.owner_user_id
      and l.active and l.accepted_at is not null
      and lower(l.caregiver_email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  ));
comment on table public.cozy_profiles is 'Private comfort passport, reset choices, memories and support feedback. Never readable by Guardians.';
comment on table public.cozy_shared_cards is 'Owner-chosen per-Guardian snapshot; pause, invitation acceptance and relationship activity enforced by RLS.';
