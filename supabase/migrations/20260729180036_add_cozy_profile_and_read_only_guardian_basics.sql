alter table public.tracker_profiles
  add column if not exists comfort_item_name text not null default '',
  add column if not exists guardian_read_only boolean not null default true;

alter table public.tracker_profiles
  add constraint tracker_profiles_comfort_item_name_length
  check (char_length(comfort_item_name) <= 80) not valid;

alter table public.tracker_profiles
  validate constraint tracker_profiles_comfort_item_name_length;

alter table public.caregiver_links
  alter column can_send_notes set default false,
  alter column can_add_rewards set default false,
  alter column can_suggest_tasks set default false;

update public.caregiver_links
set can_send_notes = false,
    can_add_rewards = false,
    can_suggest_tasks = false
where can_send_notes or can_add_rewards or can_suggest_tasks;

drop policy if exists "Permitted caretakers add their own notes" on public.support_notes;
drop policy if exists "Owners and caretakers delete relevant notes" on public.support_notes;
drop policy if exists "Permitted caretakers add rewards" on public.support_rewards;
drop policy if exists "Permitted caretakers update rewards" on public.support_rewards;
drop policy if exists "Permitted caretakers claim rewards" on public.support_rewards;
drop policy if exists "Permitted caretakers add task suggestions" on public.task_suggestions;

create schema if not exists private;

create table if not exists private.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

revoke all on table private.app_admins from anon, authenticated;
