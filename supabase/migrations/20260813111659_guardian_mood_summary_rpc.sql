create or replace function public.guardian_daily_checkin_summary(p_owner_user_id uuid, p_date date)
returns table(mood text, energy text, capacity text, day_type text, support_preference text)
language sql
security definer
set search_path = public
as $$
  select c.mood, c.energy, c.capacity, c.day_type, c.support_preference
  from public.daily_check_ins c
  where c.user_id = p_owner_user_id
    and c.check_date = p_date
    and exists (
      select 1 from public.caregiver_links link
      where link.owner_user_id = p_owner_user_id
        and link.active
        and link.accepted_at is not null
        and link.can_view_mood
        and lower(link.caregiver_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  limit 1;
$$;
revoke all on function public.guardian_daily_checkin_summary(uuid,date) from public, anon;
grant execute on function public.guardian_daily_checkin_summary(uuid,date) to authenticated;
