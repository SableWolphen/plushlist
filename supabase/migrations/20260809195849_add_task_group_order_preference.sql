alter table public.app_preferences
  add column if not exists task_group_order text[] not null default '{}';
