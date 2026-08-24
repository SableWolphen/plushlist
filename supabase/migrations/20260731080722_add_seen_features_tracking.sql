alter table public.app_preferences add column if not exists seen_features text[] not null default '{}';
