import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { newestUpdates } from "../_shared/whats-new.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("PLUSHLIFE_EMAIL_FROM") || "";
const EMAIL_REPLY_TO = Deno.env.get("PLUSHLIFE_EMAIL_REPLY_TO") || "plushlife.app@gmail.com";
const APP_URL = Deno.env.get("PLUSHLIFE_APP_URL") || "https://sablewolphen.github.io/plushlist/";
const CRON_SECRET = Deno.env.get("COMEBACK_EMAIL_CRON_SECRET") || "";
const UNSUBSCRIBE_SECRET = Deno.env.get("COMEBACK_UNSUBSCRIBE_SECRET") || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase service credentials are missing.");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signUnsubscribe(userId: string) {
  if (!UNSUBSCRIBE_SECRET) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(UNSUBSCRIBE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  return toBase64Url(new Uint8Array(signature));
}

async function latestActivity(user: any) {
  const candidates = [user.last_sign_in_at, user.updated_at, user.created_at]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  const [progress, checkIn] = await Promise.all([
    admin.from("daily_progress").select("updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("daily_check_ins").select("updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (progress.data?.updated_at) candidates.push(new Date(progress.data.updated_at).getTime());
  if (checkIn.data?.updated_at) candidates.push(new Date(checkIn.data.updated_at).getTime());
  return new Date(Math.max(...candidates)).toISOString();
}

function pickStage(daysAway: number) {
  if (daysAway >= 10) return "10d";
  if (daysAway >= 3) return "3d";
  return null;
}

function subjectFor(stage: string) {
  return stage === "10d"
    ? "You don't have to restart your routine 💜"
    : "PlushLife got a little softer while you were away 💜";
}

function introFor(stage: string) {
  return stage === "10d"
    ? "Been away for a bit? That is exactly what PlushLife is built for. There is no backlog to clear and no streak to repair."
    : "No need to catch up. We have been making PlushLife better for the days when your energy does not cooperate.";
}

function ctaFor(stage: string) {
  return stage === "10d" ? "Come back Tiny" : "Check in today";
}

function renderEmail(stage: string, unsubscribeUrl: string) {
  const updates = newestUpdates(3);
  const cards = updates.map((update) => `
    <div style="margin:12px 0;padding:14px 16px;border:1px solid #eadff0;border-radius:14px;background:#fffafd">
      <div style="font-weight:800;color:#6d4a7c">${escapeHtml(update.title)}</div>
      <div style="margin-top:5px;color:#6f6276;line-height:1.55">${escapeHtml(update.summary)}</div>
    </div>`).join("");

  return `<!doctype html>
  <html><body style="margin:0;background:#f8f4fa;font-family:Arial,Helvetica,sans-serif;color:#574b5d">
    <div style="max-width:600px;margin:0 auto;padding:28px 18px">
      <div style="background:#ffffff;border:1px solid #eadff0;border-radius:20px;padding:26px;box-shadow:0 10px 30px rgba(67,45,76,.06)">
        <div style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#a45dbf">PLUSHLIFE</div>
        <h1 style="margin:8px 0 10px;font-size:24px;line-height:1.2;color:#4f3f57">A gentle way back is waiting.</h1>
        <p style="font-size:15px;line-height:1.65;margin:0 0 18px">${escapeHtml(introFor(stage))}</p>
        <div style="font-size:13px;font-weight:800;color:#8c5ca0;margin-bottom:4px">What got better</div>
        ${cards}
        <p style="font-size:15px;line-height:1.65">Your comeback can be one small thing. Full, Soft, Tiny, or just opening the app all count as showing up.</p>
        <a href="${escapeHtml(APP_URL)}" style="display:inline-block;margin-top:4px;padding:13px 18px;border-radius:12px;background:#9d5db8;color:#fff;text-decoration:none;font-weight:800">${escapeHtml(ctaFor(stage))} →</a>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#7d7083">Your plan is still there. You do not have to restart anything.</p>
        <hr style="border:0;border-top:1px solid #eee4f2;margin:24px 0 14px">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#9a8ca0">You received this because you created a PlushLife account. ${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a5a9d">Stop comeback emails</a>.` : ""}</p>
      </div>
    </div>
  </body></html>`;
}

async function sendViaResend(to: string, stage: string, unsubscribeUrl: string) {
  if (!RESEND_API_KEY || !EMAIL_FROM) throw new Error("RESEND_API_KEY or PLUSHLIFE_EMAIL_FROM is missing.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      reply_to: EMAIL_REPLY_TO,
      subject: subjectFor(stage),
      html: renderEmail(stage, unsubscribeUrl),
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  return await response.json();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "POST required" }, 405);
  if (!CRON_SECRET || request.headers.get("x-cron-secret") !== CRON_SECRET) return json({ error: "Unauthorized" }, 401);

  const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";
  const now = Date.now();
  const results: any[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return json({ error: error.message }, 500);
    const users = data?.users || [];
    if (!users.length) break;

    for (const user of users) {
      try {
        if (!user.email || !user.email_confirmed_at) continue;
        if (user.app_metadata?.comeback_email_opt_out === true) continue;

        const activeAt = await latestActivity(user);
        const daysAway = Math.floor((now - new Date(activeAt).getTime()) / DAY_MS);
        const stage = pickStage(daysAway);
        if (!stage) continue;

        const state = user.app_metadata?.comeback_email_state || {};
        const activityKey = activeAt.slice(0, 19);
        const alreadySent = state?.activity_key === activityKey && state?.[`sent_${stage}`];
        if (alreadySent) continue;

        const sig = await signUnsubscribe(user.id);
        const unsubscribeUrl = sig
          ? `${SUPABASE_URL}/functions/v1/unsubscribe-comeback-email?uid=${encodeURIComponent(user.id)}&sig=${encodeURIComponent(sig)}`
          : "";

        if (!dryRun) {
          const sent = await sendViaResend(user.email, stage, unsubscribeUrl);
          const nextState = {
            ...(state || {}),
            activity_key: activityKey,
            [`sent_${stage}`]: new Date().toISOString(),
            last_message_id: sent?.id || null,
          };
          await admin.auth.admin.updateUserById(user.id, {
            app_metadata: { ...(user.app_metadata || {}), comeback_email_state: nextState },
          });
        }

        results.push({ user_id: user.id, stage, days_away: daysAway, dry_run: dryRun });
      } catch (error) {
        results.push({ user_id: user.id, error: String(error?.message || error) });
      }
    }

    if (users.length < 100) break;
    page += 1;
  }

  return json({ ok: true, dry_run: dryRun, processed: results.length, results });
});
