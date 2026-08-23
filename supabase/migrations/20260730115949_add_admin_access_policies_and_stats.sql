-- Let the two admin accounts read feedback and error logs (previously write-only for everyone)
create policy "Admins read feedback" on public.feedback_messages
  for select to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));

create policy "Admins read error logs" on public.app_error_logs
  for select to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));

-- Admins can also mark feedback/errors as read/resolved
alter table public.feedback_messages add column if not exists resolved boolean not null default false;
create policy "Admins update feedback" on public.feedback_messages
  for update to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'))
  with check (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));

-- Aggregate, privacy-safe site stats (counts only, no personal data), admin-only
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  result jsonb;
begin
  if caller_email not in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com') then
    raise exception 'not authorized';
  end if;
  select jsonb_build_object(
    'total_accounts', (select count(*) from public.tracker_profiles),
    'total_tasks', (select count(*) from public.tracker_tasks),
    'total_guardian_links', (select count(*) from public.caregiver_links where active),
    'total_feedback', (select count(*) from public.feedback_messages),
    'unresolved_feedback', (select count(*) from public.feedback_messages where not resolved),
    'total_errors_24h', (select count(*) from public.app_error_logs where created_at > now() - interval '24 hours'),
    'total_daily_progress_rows', (select count(*) from public.daily_progress)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;