import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ENV_RESEND_API_KEY = Deno.env.get("PLUSHLIFE_RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("PLUSHLIFE_EMAIL_FROM") || "PlushLife <onboarding@resend.dev>";
const PLAY_STORE_URL = Deno.env.get("PLUSHLIFE_APP_URL") || "https://play.google.com/store/apps/details?id=com.PlushLife";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase service credentials are missing.");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function escapeHtml(value: string) {
  return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

async function getResendApiKey() {
  if (ENV_RESEND_API_KEY) return ENV_RESEND_API_KEY;
  const { data, error } = await admin.rpc("plushlife_get_resend_api_key");
  if (error) throw new Error("Unable to read email provider configuration.");
  return String(data || "");
}

// Called by the app (fire-and-forget) right after a Guardian saves an
// encouraging note into support_notes. Body: { owner_user_id,
// caregiver_name, message }. The caller must be the guardian who left the
// note: authorization is proven by the existence of a matching support_notes
// row with caregiver_user_id = caller and owner_user_id = target.
//
// The email deliberately names only the guardian — not the note's message
// body. Email copies live forever in inboxes and on mail servers; the note
// itself stays inside the app where the owner's discreet-notification
// settings apply.
Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("authorization") || "";
  const jwt = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!jwt) return json({ error: "Not signed in." }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const caller = userData?.user;
  if (userError || !caller) return json({ error: "Session is not valid." }, 401);

  let body: { owner_user_id?: unknown; caregiver_name?: unknown } = {};
  try { body = await request.json(); } catch (_e) { return json({ error: "Invalid request." }, 400); }
  const ownerUserId = String(body?.owner_user_id || "");
  const caregiverName = String(body?.caregiver_name || "Your Guardian").slice(0, 80);
  if (!ownerUserId || ownerUserId === caller.id) return json({ error: "Invalid request." }, 400);

  // Only the guardian who actually left a note for this owner may trigger
  // the notification.
  const { data: noteRows, error: noteError } = await admin
    .from("support_notes")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .eq("caregiver_user_id", caller.id)
    .limit(1);
  if (noteError || !noteRows || noteRows.length === 0) {
    return json({ error: "Not authorized." }, 403);
  }

  const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(ownerUserId);
  const ownerEmail = ownerData?.user?.email;
  if (ownerError || !ownerEmail) return json({ error: "Owner account not found." }, 404);

  let resendKey = "";
  try {
    resendKey = await getResendApiKey();
  } catch (_e) {
    return json({ ok: false, reason: "Email is not configured." }, 200);
  }
  if (!resendKey) return json({ ok: false, reason: "Email is not configured." }, 200);

  const safeName = escapeHtml(caregiverName);
  const html = `<!doctype html><html><body style="margin:0;background:#f8f4fa;font-family:Arial,Helvetica,sans-serif;color:#574b5d"><main style="max-width:520px;margin:0 auto;padding:32px 20px"><div style="background:#ffffff;border:1px solid #eadff0;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;color:#a45dbf">PLUSHLIFE</div><h1 style="font-size:22px;color:#574361">A little note is waiting for you 💛</h1><p style="line-height:1.7">${safeName} left you an encouraging note in PlushLife. Open the app whenever you feel like reading it — no rush, no pressure.</p><p><a href="${PLAY_STORE_URL}" style="display:inline-block;background:#b75acb;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Open PlushLife</a></p></div></main></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [ownerEmail],
      subject: `${caregiverName} left you an encouraging note 💛`,
      html,
    }),
  });
  if (!response.ok) return json({ ok: false, reason: "Email send failed." }, 502);
  return json({ ok: true });
});
