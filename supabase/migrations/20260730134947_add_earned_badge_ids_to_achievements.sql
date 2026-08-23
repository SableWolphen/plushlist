alter table public.user_achievements
  add column if not exists earned_badge_ids text[] not null default '{}';
