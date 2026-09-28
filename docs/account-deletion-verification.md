# Account deletion & data-layer verification checklist

Run these against the **live** Supabase database before trusting the new
account-deletion and RLS guardrails. The migrations and edge functions in
this branch are authored but **not applied** — nothing here has touched
production data.

Prerequisites: apply the new migrations in order
(`20260928000100`, `20260928000200`, `20260928000300`) via the Supabase
dashboard SQL editor or `supabase db push`, deploy the three new edge
functions (`delete-my-account`, `notify-new-note`, `manage-review-account`)
and the updated `unsubscribe-comeback-email`, and set the `OWNER_USER_ID`
Cloudflare Worker env var (see `wrangler.jsonc`).

---

## 1. delete-my-account purges every user table

1. Create a throwaway test account in the app; generate representative rows
   (tasks, check-ins, a private note, a Guardian link + note, a chat thread,
   a reward, preferences, a watch pairing).
2. In Settings → Account → Delete account, confirm with the typed
   confirmation. The settings screen should sign you out and return to the
   landing page.
3. In the dashboard SQL editor, confirm zero rows remain for that user id
   (`<TEST_USER_UUID>`) in every table:

```sql
-- Run with the deleted user's UUID substituted for '<TEST_USER_UUID>'.
select 'tracker_profiles' as t, count(*) from public.tracker_profiles where user_id = '<TEST_USER_UUID>'
union all select 'app_preferences', count(*) from public.app_preferences where user_id = '<TEST_USER_UUID>'
union all select 'tracker_tasks', count(*) from public.tracker_tasks where user_id = '<TEST_USER_UUID>'
union all select 'tracker_schedules', count(*) from public.tracker_schedules where user_id = '<TEST_USER_UUID>'
union all select 'tracker_progress', count(*) from public.tracker_progress where user_id = '<TEST_USER_UUID>'
union all select 'daily_progress', count(*) from public.daily_progress where user_id = '<TEST_USER_UUID>'
union all select 'daily_check_ins', count(*) from public.daily_check_ins where user_id = '<TEST_USER_UUID>'
union all select 'private_notes', count(*) from public.private_notes where user_id = '<TEST_USER_UUID>'
union all select 'care_session_logs', count(*) from public.care_session_logs where user_id = '<TEST_USER_UUID>'
union all select 'plush_path_progress', count(*) from public.plush_path_progress where user_id = '<TEST_USER_UUID>'
union all select 'rest_days', count(*) from public.rest_days where user_id = '<TEST_USER_UUID>'
union all select 'schedule_exceptions', count(*) from public.schedule_exceptions where user_id = '<TEST_USER_UUID>'
union all select 'task_snoozes', count(*) from public.task_snoozes where user_id = '<TEST_USER_UUID>'
union all select 'user_achievements', count(*) from public.user_achievements where user_id = '<TEST_USER_UUID>'
union all select 'weekly_intentions', count(*) from public.weekly_intentions where user_id = '<TEST_USER_UUID>'
union all select 'weekly_intention_checkins', count(*) from public.weekly_intention_checkins where user_id = '<TEST_USER_UUID>'
union all select 'mommy_chat_threads', count(*) from public.mommy_chat_threads where user_id = '<TEST_USER_UUID>'
union all select 'push_subscriptions', count(*) from public.push_subscriptions where user_id = '<TEST_USER_UUID>'
union all select 'notification_deliveries', count(*) from public.notification_deliveries where user_id = '<TEST_USER_UUID>'
union all select 'task_suggestions', count(*) from public.task_suggestions where user_id = '<TEST_USER_UUID>'
union all select 'onboarding_events', count(*) from public.onboarding_events where user_id = '<TEST_USER_UUID>'
union all select 'app_error_logs', count(*) from public.app_error_logs where user_id = '<TEST_USER_UUID>'
union all select 'feedback_messages', count(*) from public.feedback_messages where user_id = '<TEST_USER_UUID>'
union all select 'watch_pairings', count(*) from public.watch_pairings where user_id = '<TEST_USER_UUID>'
union all select 'entitlements', count(*) from public.entitlements where user_id = '<TEST_USER_UUID>'
union all select 'glow_mcp_oauth_codes', count(*) from public.glow_mcp_oauth_codes where user_id = '<TEST_USER_UUID>'
union all select 'glow_mcp_tokens', count(*) from public.glow_mcp_tokens where user_id = '<TEST_USER_UUID>'
union all select 'calendar_connections', count(*) from public.calendar_connections where user_id = '<TEST_USER_UUID>'
union all select 'calendar_oauth_state', count(*) from public.calendar_oauth_state where user_id = '<TEST_USER_UUID>'
union all select 'calendar_sync_links', count(*) from public.calendar_sync_links where user_id = '<TEST_USER_UUID>'
union all select 'user_presence', count(*) from public.user_presence where user_id = '<TEST_USER_UUID>'
union all select 'supporter_payments', count(*) from public.supporter_payments where user_id = '<TEST_USER_UUID>'
union all select 'guardian_support_requests', count(*) from public.guardian_support_requests where owner_user_id = '<TEST_USER_UUID>'
union all select 'support_notes (as owner)', count(*) from public.support_notes where owner_user_id = '<TEST_USER_UUID>'
union all select 'support_notes (as guardian)', count(*) from public.support_notes where caregiver_user_id = '<TEST_USER_UUID>'
union all select 'caregiver_links (as owner)', count(*) from public.caregiver_links where owner_user_id = '<TEST_USER_UUID>'
union all select 'caregiver_links (as guardian)', count(*) from public.caregiver_links where caregiver_user_id = '<TEST_USER_UUID>';
```

All counts must be `0`, and the user must be gone from
Authentication → Users. If the function returned a 500 with `failures`,
those tables need attention (the auth user is intentionally **not**
deleted on a partial purge so the run can be retried).

---

## 2. RLS is enabled on every owner-scoped table, including dashboard-created ones

```sql
-- Every row returned here is a table that MUST have RLS enabled.
select t.relname as table_without_rls
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relkind = 'r'
  and t.relname in (
    'app_error_logs','app_preferences','calendar_connections','calendar_oauth_state',
    'calendar_sync_links','care_session_logs','caregiver_links','daily_check_ins',
    'daily_progress','entitlements','feedback_messages','glow_mcp_oauth_codes',
    'glow_mcp_tokens','guardian_support_requests','mommy_chat_threads',
    'notification_deliveries','onboarding_events','plush_path_progress',
    'private_notes','push_subscriptions','rest_days','schedule_exceptions',
    'support_notes','supporter_payments','task_snoozes','task_suggestions',
    'tracker_profiles','tracker_progress','tracker_schedules','tracker_tasks',
    'user_achievements','user_presence','watch_pairings',
    'weekly_intention_checkins','weekly_intentions'
  )
  and not t.relrowsecurity;
```

Expected: zero rows. Pay special attention to the dashboard-created tables
(`private_notes`, `push_subscriptions`, `notification_deliveries`,
`task_suggestions`, `tracker_progress`, `user_achievements`,
`support_notes`, `caregiver_links`, `app_preferences`) — these have no
in-repo `CREATE TABLE`, so this query is the only in-repo proof they are
protected. (The `20260928000300` migration now fails deploys if any of
these lack RLS, so this check should stay green going forward.)

Also confirm each of those tables has an owner-scoped policy, not just the
RLS flag:

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('private_notes','push_subscriptions','notification_deliveries',
                    'task_suggestions','tracker_progress','user_achievements',
                    'support_notes','caregiver_links','app_preferences')
order by tablename, policyname;
```

Every policy's `USING`/`WITH CHECK` expression must reference the row owner
(`auth.uid() = user_id`, or the guardian email match for guardian-side
policies) — no `USING (true)`.

---

## 3. caregiver_links INSERT policy is owner-only

No `CREATE POLICY ... FOR INSERT` on `caregiver_links` exists in the repo
(the table was dashboard-created), so verify on the live database that only
the owner can create links:

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'caregiver_links' and cmd = 'INSERT';
```

Expected: exactly one INSERT policy whose `with_check` is equivalent to
`auth.uid() = owner_user_id`. If there is no INSERT policy at all, inserts
are denied by default under RLS (safe, but then confirm the app creates
links through a definer RPC instead). If any broader INSERT policy exists,
tighten it before relying on invite-only guardian linking.

---

## 4. supporter_payments retention vs. stated policy

`delete-my-account` now purges `supporter_payments` rows for the deleted
user. Confirm this matches the retention promise in `legal.html#privacy`:
payment records are often kept for refund/tax lookups. If the policy
requires retaining them, remove `supporter_payments` from `PURGE_TARGETS`
in `supabase/functions/delete-my-account/index.ts` (the table has
`ON DELETE CASCADE` on `user_id`, so dropping it from the explicit list
still deletes the rows with the auth user — instead, break the cascade
expectation deliberately: keep the explicit purge only if the policy
allows deletion).

---

## 5. Admin model cutover

1. Seed the owner row: in the dashboard, look up the owner's real
   auth user id (Authentication → Users), uncomment and fill in the
   `insert into private.app_admins` statement at the top of migration
   `20260928000100_admin_model_app_admins.sql`, and run it:

```sql
insert into private.app_admins (user_id) values ('<owner auth user uuid>')
on conflict (user_id) do nothing;
```

2. As the owner, call `public.admin_dashboard_stats()` and
   `public.admin_onboarding_funnel()` — both must succeed.
3. As a non-admin test account, call both — both must raise
   `not authorized`, and the admin RLS policies must hide
   `feedback_messages` / `app_error_logs` / `user_presence` /
   `supporter_payments` / `onboarding_events` rows.
4. Confirm no remaining email-allowlist checks:

```sql
select * from pg_policies
where schemaname = 'public'
  and (qual ilike '%plushlisttest%' or with_check ilike '%plushlisttest%');
```

Expected: zero rows.

---

## 6. Guardian column protection

As a guardian test account with an open `guardian_support_requests` row,
attempt `update ... set message = 'forged', status = 'resolved'`. Expected:
`status` becomes `resolved`, `message` is unchanged. Then update as the
owner: all columns must remain writable.

---

## Known gaps this branch does not close

- **`send-winback-notifications` is still missing.** The pg_cron job
  `plushlist-winback-notifications`
  (`20260731074602_add_winback_notification_cron.sql`) POSTs daily to
  `functions/v1/send-winback-notifications`, which does not exist in
  `supabase/functions/`. Every run currently fails. Either author the
  function (contract would need owner input: who qualifies, what copy,
  quiet-hour rules) or drop the cron schedule.
- **`notify-new-note` / `manage-review-account` were reconstructed from
  their call sites in `src/app-source.jsx`** (no originals in the repo).
  `notify-new-note` sends the owner a Resend email naming the guardian but
  not the note body — a deliberate privacy choice; confirm the owner wants
  email at all here versus relying on in-app/push delivery. The Resend key
  must be configured (`PLUSHLIFE_RESEND_API_KEY` or the
  `plushlife_get_resend_api_key` vault RPC) or the function no-ops.
- **Dashboard-created tables are not in any migration.** Their column
  names in `delete-my-account`'s `PURGE_TARGETS` come from app usage; if
  the section-1 counts show leftovers, fix the column names there.
- **Device-backup encryption key rotation** is not implemented: if a
  device is compromised, old snapshots stay decryptable with the stored
  key. Documented as out of scope in the threat-model comment in
  `src/device-backup.js`.
