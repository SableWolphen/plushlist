alter table public.caregiver_links
  add column if not exists can_view_mood boolean not null default false;

comment on column public.caregiver_links.can_view_mood is 'Owner must explicitly opt in; defaults to false. Controls whether caregiver_links viewer can see mood/support_preference from daily_check_ins.';
