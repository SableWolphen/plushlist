import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UNSUBSCRIBE_SECRET = Deno.env.get("COMEBACK_UNSUBSCRIBE_SECRET") || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase service credentials are missing.");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signatureFor(userId: string) {
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

function page(title: string, body: string, status = 200) {
  return new Response(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#f8f4fa;font-family:Arial,Helvetica,sans-serif;color:#574b5d"><main style="max-width:520px;margin:64px auto;padding:22px"><div style="background:white;border:1px solid #eadff0;border-radius:18px;padding:24px"><div style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#a45dbf">PLUSHLIFE</div><h1 style="font-size:24px">${title}</h1><p style="line-height:1.6">${body}</p></div></main></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (request) => {
  if (!UNSUBSCRIBE_SECRET) return page("Not available", "Comeback email preferences are not configured yet.", 503);
  const url = new URL(request.url);
  const userId = url.searchParams.get("uid") || "";
  const sig = url.searchParams.get("sig") || "";
  if (!userId || !sig) return page("Invalid link", "This unsubscribe link is incomplete.", 400);

  const expected = await signatureFor(userId);
  if (sig !== expected) return page("Invalid link", "This unsubscribe link is no longer valid.", 403);

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return page("Account not found", "We could not find that PlushLife account.", 404);

  const user = data.user;
  const update = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(user.app_metadata || {}),
      comeback_email_opt_out: true,
      comeback_email_opted_out_at: new Date().toISOString(),
    },
  });
  if (update.error) return page("Something went wrong", "We could not update this preference right now. Please try again later.", 500);

  return page("You're unsubscribed 💜", "PlushLife will stop sending comeback emails. This does not affect account or security emails.");
});
