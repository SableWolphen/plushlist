alter table public.app_preferences
  add column if not exists dismissed_energy_patterns jsonb not null default '[]'::jsonb;

comment on column public.app_preferences.dismissed_energy_patterns is 'Weekday ids the user dismissed a low-energy pattern insight for, so it does not keep resurfacing.';
