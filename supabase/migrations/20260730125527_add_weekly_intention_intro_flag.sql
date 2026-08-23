alter table public.app_preferences
  add column if not exists weekly_intention_intro_seen boolean not null default false;
