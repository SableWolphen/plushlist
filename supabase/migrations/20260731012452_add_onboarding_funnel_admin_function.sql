create or replace function public.admin_onboarding_funnel()
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
    'started', (select count(distinct user_id) from public.onboarding_events where event = 'step_viewed'),
    'completed', (select count(distinct user_id) from public.onboarding_events where event = 'completed'),
    'by_step', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select step, count(distinct user_id) as reached
        from public.onboarding_events
        where event = 'step_viewed'
        group by step
        order by step
      ) t
    )
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_onboarding_funnel() from anon, public;
grant execute on function public.admin_onboarding_funnel() to authenticated;
