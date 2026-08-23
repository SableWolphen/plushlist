alter table public.app_preferences
  add column if not exists beta_banner_dismissed boolean not null default false,
  add column if not exists last_seen_changelog text not null default '';
