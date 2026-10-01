import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase service credentials are missing.");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

// Every user-owned table the app is known to write. Tables are deleted
// explicitly with the service role even where a foreign key would cascade on
// auth.users delete, because (a) dashboard-created tables have unverified FK
// coverage, and (b) app_error_logs / feedback_messages use ON DELETE SET NULL
// and would otherwise leave orphan rows. Column names for dashboard-created
// tables (marked *) come from app usage, not in-repo schema — confirm against
// the live database via docs/account-deletion-verification.md.
const PURGE_TARGETS: Array<{ table: string; column: string; note?: string }> = [
  { table: "tracker_profiles", column: "user_id" },
  { table: "app_preferences", column: "user_id" }, // * dashboard-created
  { table: "tracker_tasks", column: "user_id" },
  { table: "tracker_schedules", column: "user_id" },
  { table: "tracker_progress", column: "user_id" }, // * dashboard-created
  { table: "daily_progress", column: "user_id" },
  { table: "daily_check_ins", column: "user_id" },
  { table: "private_notes", column: "user_id" }, // * dashboard-created
  { table: "care_session_logs", column: "user_id" },
  { table: "plush_path_progress", column: "user_id" },
  { table: "rest_days", column: "user_id" },
  { table: "schedule_exceptions", column: "user_id" },
  { table: "task_snoozes", column: "user_id" },
  { table: "user_achievements", column: "user_id" },
  { table: "weekly_intentions", column: "user_id" },
  { table: "weekly_intention_checkins", column: "user_id" },
  { table: "mommy_chat_threads", column: "user_id" },
  { table: "push_subscriptions", column: "user_id" }, // * dashboard-created
  { table: "notification_deliveries", column: "user_id" }, // * dashboard-created
  { table: "task_suggestions", column: "user_id" }, // * dashboard-created
  { table: "onboarding_events", column: "user_id" },
  { table: "app_error_logs", column: "user_id" }, // ON DELETE SET NULL — must delete explicitly
  { table: "feedback_messages", column: "user_id" }, // ON DELETE SET NULL — must delete explicitly
  { table: "watch_pairings", column: "user_id" },
  { table: "entitlements", column: "user_id" },
  { table: "glow_mcp_oauth_codes", column: "user_id" },
  { table: "glow_mcp_tokens", column: "user_id" },
  { table: "calendar_connections", column: "user_id" },
  { table: "calendar_oauth_state", column: "user_id" },
  { table: "calendar_sync_links", column: "user_id" },
  { table: "user_presence", column: "user_id" },
  // Payment records: purged with everything else. Confirm this matches the
  // stated retention policy before relying on it (see verification doc).
  { table: "supporter_payments", column: "user_id" },
  { table: "guardian_support_requests", column: "owner_user_id" },
  { table: "together_item_participation", column: "user_id" },
  { table: "together_items", column: "created_by_user_id" },
];

async function purgeTable(table: string, column: string, userId: string) {
  // support_notes and caregiver_links involve the user on either side of the
  // relationship; both directions are purged.
  const query = admin.from(table).delete();
  if (table === "support_notes") {
    query.or(`owner_user_id.eq.${userId},caregiver_user_id.eq.${userId}`);
  } else if (table === "caregiver_links") {
    query.or(`owner_user_id.eq.${userId},caregiver_user_id.eq.${userId}`);
  } else if (table === "together_items") {
    query.or(`owner_user_id.eq.${userId},created_by_user_id.eq.${userId}`);
  } else {
    query.eq(column, userId);
  }
  const { error, count } = await query;
  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return { table, status: "skipped", reason: "table not present" };
    }
    return { table, status: "failed", reason: error.message };
  }
  return { table, status: "deleted", count: count ?? 0 };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("authorization") || "";
  const jwt = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!jwt) return json({ error: "Sign in to delete your account." }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json({ error: "Your session is not valid." }, 401);

  let body: { confirmation?: unknown } = {};
  try { body = await request.json(); } catch (_e) { /* fall through to confirmation check */ }
  if (body?.confirmation !== true) {
    return json({ error: "Account deletion requires explicit confirmation." }, 400);
  }

  const results = [];
  for (const target of PURGE_TARGETS) {
    results.push(await purgeTable(target.table, target.column, user.id));
  }
  const failures = results.filter((r) => r.status === "failed");
  if (failures.length > 0) {
    // Do not delete the auth user on a partial purge; the client can retry
    // and the per-table results show what still needs attention.
    return json({ error: "Some data could not be deleted.", failures, results }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: "Your data was deleted but the account itself could not be removed.", results }, 500);

  return json({ ok: true, results });
});
