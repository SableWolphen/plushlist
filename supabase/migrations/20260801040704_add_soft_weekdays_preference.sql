alter table public.app_preferences
  add column if not exists soft_weekdays jsonb not null default '[]'::jsonb;

comment on column public.app_preferences.soft_weekdays is 'Weekday ids (mon/tue/...) the user has opted into defaulting to Soft Day, e.g. after accepting a pattern insight suggestion. Never set automatically without explicit user approval.';
