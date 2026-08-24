alter table public.app_preferences
  add column if not exists companion_state jsonb not null default '{}'::jsonb;

comment on column public.app_preferences.companion_state is
  'Private per-account PlushCompanion state such as evening resets, Gentle Day checks, first-week state, and recent local progress snapshots.';
