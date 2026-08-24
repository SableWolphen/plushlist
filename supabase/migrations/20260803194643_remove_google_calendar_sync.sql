-- Rolling back the Google Calendar two-way sync groundwork — feature was
-- scrapped before any Edge Functions or client UI were built on top of it.
drop trigger if exists set_tracker_tasks_updated_at on public.tracker_tasks;
drop trigger if exists set_tracker_schedules_updated_at on public.tracker_schedules;
drop function if exists public.set_updated_at();
alter table public.tracker_tasks drop column if exists updated_at;

drop function if exists public.start_calendar_oauth();
drop table if exists public.calendar_oauth_state;

drop function if exists public.disconnect_calendar_sync();
drop function if exists public.get_calendar_connection_status();
drop table if exists public.calendar_sync_links;
drop table if exists public.calendar_connections;
