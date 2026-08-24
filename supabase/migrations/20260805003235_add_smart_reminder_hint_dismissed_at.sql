alter table public.app_preferences
  add column if not exists smart_reminder_hint_dismissed_at timestamptz;
