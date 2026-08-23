select cron.alter_job(
  (select jobid from cron.job where jobname = 'sables-tracker-daily-reset'),
  command => $job$
    with reset_context as (
      select
        ((now() at time zone 'America/Chicago')::date - 1) as progress_date,
        lower(to_char((now() at time zone 'America/Chicago')::date - 1, 'Dy')) as day_prefix
    ),
    tracker_users as (
      select distinct user_id from public.tracker_progress
    ),
    snapshots as (
      select
        tracker_users.user_id,
        reset_context.progress_date,
        coalesce(
          jsonb_agg(tracker_progress.task_key order by tracker_progress.task_key)
            filter (
              where tracker_progress.completed = true
                and (
                  tracker_progress.task_key like 'daily-%'
                  or tracker_progress.task_key like reset_context.day_prefix || '-%'
                )
            ),
          '[]'::jsonb
        ) as completed_keys
      from tracker_users
      cross join reset_context
      left join public.tracker_progress
        on tracker_progress.user_id = tracker_users.user_id
      group by tracker_users.user_id, reset_context.progress_date
    )
    insert into public.daily_progress (user_id, progress_date, completed_keys, updated_at)
    select user_id, progress_date, completed_keys, now()
    from snapshots
    on conflict (user_id, progress_date)
    do update set completed_keys = excluded.completed_keys, updated_at = excluded.updated_at;

    update public.tracker_progress
    set completed = false, updated_at = now()
    where task_key like 'daily-%' and completed = true;
  $job$
);
