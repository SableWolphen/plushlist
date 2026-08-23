alter table public.app_preferences
  add column if not exists baby_voice text not null default 'motherly'
  check (baby_voice in ('motherly', 'fatherly'));
