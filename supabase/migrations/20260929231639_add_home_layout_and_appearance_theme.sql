-- Stored on the existing owner-scoped preferences row; no new public table.
alter table public.app_preferences
  add column if not exists home_layout jsonb not null default '{"order":["tiny","tasks","habits","schedule","shortcuts","noticed"],"hidden":[]}'::jsonb,
  add column if not exists appearance_theme text;

alter table public.app_preferences
  add constraint app_preferences_home_layout_object check (
    jsonb_typeof(home_layout) = 'object'
    and jsonb_typeof(home_layout->'order') = 'array'
    and jsonb_typeof(home_layout->'hidden') = 'array'
  );

comment on column public.app_preferences.home_layout is 'User-selected Home card order and visibility. Tasks, habits and schedules are not changed.';
comment on column public.app_preferences.appearance_theme is 'Saved ambient world shared by web and Android. Null retains the existing device preference until a world is selected.';
