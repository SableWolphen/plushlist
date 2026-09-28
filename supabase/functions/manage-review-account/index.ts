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

async function isAppAdmin(userId: string) {
  const { data, error } = await admin
    .schema("private")
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);
  return !error && !!data && data.length > 0;
}

async function findUserByEmail(email: string) {
  // No server-side email filter on listUsers in this client version; walk
  // pages until found. Review accounts are a handful of users, so this is
  // cheap in practice.
  let page = 1;
  const perPage = 200;
  for (let guard = 0; guard < 25; guard++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users) break;
    const match = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

// Admin-only helper for the Play Store review accounts. The app's admin
// panel calls it with { role, email, password }; it creates the auth user
// (or updates the password of an existing one) and tags the review role in
// app_metadata. Caller authorization is checked against private.app_admins
// with the service role — the same source of truth as the new
// public.is_app_admin() database guard.
Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("authorization") || "";
  const jwt = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!jwt) return json({ error: "Not signed in." }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const caller = userData?.user;
  if (userError || !caller) return json({ error: "Session is not valid." }, 401);
  if (!(await isAppAdmin(caller.id))) return json({ error: "Not authorized." }, 403);

  let body: { role?: unknown; email?: unknown; password?: unknown } = {};
  try { body = await request.json(); } catch (_e) { return json({ error: "Invalid request." }, 400); }
  const role = String(body?.role || "").trim().slice(0, 40);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!role || !email.includes("@")) return json({ error: "Enter a valid email first." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const existing = await findUserByEmail(email);
  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { ...(existing.app_metadata || {}), plushlife_review_role: role },
    });
    if (updateError) return json({ error: updateError.message }, 500);
    return json({ ok: true, status: "updated" });
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { plushlife_review_role: role },
  });
  if (createError) return json({ error: createError.message }, 500);
  return json({ ok: true, status: "created" });
});
