alter table public.app_preferences
  add column if not exists focus_mode boolean not null default false,
  add column if not exists calm_mode boolean not null default false,
  add column if not exists adult_mode boolean not null default false;
