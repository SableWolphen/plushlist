alter table public.app_preferences
  add column if not exists is_supporter boolean not null default false;
