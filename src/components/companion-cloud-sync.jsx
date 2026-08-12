const AUTH_KEY = "sb-pvitdhixycegmcovapyh-auth-token";
const SUPABASE_URL = "https://pvitdhixycegmcovapyh.supabase.co";
const SUPABASE_KEY = "sb_publishable_SScDCEHovc68ITiEUu6lCg_mHPe2oaI";
const FIRST_SEEN_KEY = "plushlife:companion:first-seen:v1";
const HISTORY_KEY = "plushlife:companion:history:v1";
const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const SYNCED_DAYS = 45;

function safeJson(value, fallback = null) {
  try { return JSON.parse(value); } catch (_error) { return fallback; }
}

function storageJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : safeJson(value, fallback);
  } catch (_error) {
    return fallback;
  }
}

function storageHas(key) {
  try { return localStorage.getItem(key) !== null; } catch (_error) { return false; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_error) {}
}

function findAccessToken(value, depth = 0) {
  if (!value || depth > 4) return "";
  if (typeof value === "string") {
    if (value.split(".").length === 3) return value;
    const parsed = safeJson(value, null);
    return parsed ? findAccessToken(parsed, depth + 1) : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findAccessToken(item, depth + 1);
      if (token) return token;
    }
    return "";
  }
  if (typeof value === "object") {
    if (typeof value.access_token === "string") return value.access_token;
    for (const item of Object.values(value)) {
      const token = findAccessToken(item, depth + 1);
      if (token) return token;
    }
  }
  return "";
}

function currentAccessToken() {
  try { return findAccessToken(localStorage.getItem(AUTH_KEY)); } catch (_error) { return ""; }
}

function userIdFromToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    return safeJson(atob(padded), {})?.sub || "";
  } catch (_error) {
    return "";
  }
}

function isoDateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function localCompanionState() {
  const days = {};
  for (let offset = -(SYNCED_DAYS - 1); offset <= 1; offset += 1) {
    const date = isoDateOffset(offset);
    const gentleKey = `plushlife:gentle-day:${date}`;
    const windDownKey = `plushlife:wind-down:${date}`;
    const supportKey = `plushlife:support-need:${date}`;
    const day = {};
    if (storageHas(gentleKey)) day.gentle_done = storageJson(gentleKey, {});
    if (storageHas(windDownKey)) day.wind_down = storageJson(windDownKey, {});
    if (storageHas(supportKey)) day.support_need = storageJson(supportKey, "");
    if (Object.keys(day).length) days[date] = day;
  }
  return {
    version: 2,
    first_seen: storageJson(FIRST_SEEN_KEY, "") || "",
    history: storageJson(HISTORY_KEY, []).slice(0, SYNCED_DAYS),
    days,
    habit_coach: storageJson(HABIT_STATE_KEY, {}),
    updated_at: new Date().toISOString(),
  };
}

function mergeHistory(cloud = [], local = []) {
  const byDate = new Map();
  for (const item of cloud) if (item?.date) byDate.set(item.date, item);
  for (const item of local) if (item?.date) byDate.set(item.date, { ...(byDate.get(item.date) || {}), ...item });
  return [...byDate.values()].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, SYNCED_DAYS);
}

function mergeHabitHistory(cloud = {}, local = {}) {
  const merged = { ...cloud };
  for (const [date, localDay] of Object.entries(local || {})) merged[date] = { ...(cloud?.[date] || {}), ...(localDay || {}) };
  return merged;
}

function mergeHabitCoach(cloud = {}, local = {}) {
  const cloudExperiments = Array.isArray(cloud?.experiments) ? cloud.experiments : [];
  const localExperiments = Array.isArray(local?.experiments) ? local.experiments : [];
  const experiments = new Map();
  for (const item of cloudExperiments) if (item?.id) experiments.set(item.id, item);
  for (const item of localExperiments) if (item?.id) experiments.set(item.id, { ...(experiments.get(item.id) || {}), ...item });
  const cloudPaths = cloud?.paths && typeof cloud.paths === "object" ? cloud.paths : {};
  const localPaths = local?.paths && typeof local.paths === "object" ? local.paths : {};
  const active = localPaths.active || cloudPaths.active || null;
  const completed = [...new Set([...(cloudPaths.completed || []), ...(localPaths.completed || [])])];
  return {
    version: 1,
    anchors: { ...(cloud?.anchors || {}), ...(local?.anchors || {}) },
    goals: { ...(cloud?.goals || {}), ...(local?.goals || {}) },
    meta: { ...(cloud?.meta || {}), ...(local?.meta || {}) },
    experiments: [...experiments.values()].slice(-40),
    paths: { ...cloudPaths, ...localPaths, active, completed },
    reviews: { ...(cloud?.reviews || {}), ...(local?.reviews || {}) },
    history: mergeHabitHistory(cloud?.history || {}, local?.history || {}),
    recovery: { ...(cloud?.recovery || {}), ...(local?.recovery || {}) },
    updated_at: new Date().toISOString(),
  };
}

function mergeState(cloud = {}, local = {}) {
  const cloudDays = cloud?.days && typeof cloud.days === "object" ? cloud.days : {};
  const localDays = local?.days && typeof local.days === "object" ? local.days : {};
  const days = { ...cloudDays };
  for (const [date, localDay] of Object.entries(localDays)) {
    days[date] = { ...(cloudDays[date] || {}), ...localDay };
  }
  const candidates = [cloud?.first_seen, local?.first_seen].filter(Boolean).sort();
  return {
    version: 2,
    first_seen: candidates[0] || "",
    history: mergeHistory(cloud?.history || [], local?.history || []),
    days,
    habit_coach: mergeHabitCoach(cloud?.habit_coach || {}, local?.habit_coach || {}),
    updated_at: new Date().toISOString(),
  };
}

function hydrateLocal(state) {
  if (!state || typeof state !== "object") return;
  if (state.first_seen) storageSet(FIRST_SEEN_KEY, state.first_seen);
  if (Array.isArray(state.history)) storageSet(HISTORY_KEY, state.history.slice(0, SYNCED_DAYS));
  for (const [date, day] of Object.entries(state.days || {})) {
    if (day && Object.prototype.hasOwnProperty.call(day, "gentle_done")) storageSet(`plushlife:gentle-day:${date}`, day.gentle_done || {});
    if (day && Object.prototype.hasOwnProperty.call(day, "wind_down")) storageSet(`plushlife:wind-down:${date}`, day.wind_down || {});
    if (day && Object.prototype.hasOwnProperty.call(day, "support_need")) storageSet(`plushlife:support-need:${date}`, day.support_need || "");
  }
  if (state.habit_coach && typeof state.habit_coach === "object") {
    storageSet(HABIT_STATE_KEY, state.habit_coach);
    try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-hydrated")); } catch (_error) {}
  }
}

async function request(path, token, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function readCloud(token, userId) {
  const response = await request(`app_preferences?select=companion_state&user_id=eq.${encodeURIComponent(userId)}&limit=1`, token);
  if (!response.ok) throw new Error(`read ${response.status}`);
  const rows = await response.json();
  return rows?.[0]?.companion_state || {};
}

async function writeCloud(token, userId, state, keepalive = false) {
  const response = await request("app_preferences?on_conflict=user_id", token, {
    method: "POST",
    keepalive,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, companion_state: state, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`write ${response.status}`);
}

export function useCompanionCloudSync(active) {
  const [ready, setReady] = React.useState(false);
  const [status, setStatus] = React.useState("local");

  React.useEffect(() => {
    let cancelled = false;
    let timer = null;
    let hydratedState = null;

    const sync = async (initial = false, keepalive = false) => {
      const token = currentAccessToken();
      const userId = userIdFromToken(token);
      if (!token || !userId || !navigator.onLine) {
        if (!cancelled) {
          setStatus(token ? "offline" : "local");
          if (initial) setReady(true);
        }
        return;
      }
      try {
        if (initial) {
          const cloud = await readCloud(token, userId);
          const merged = mergeState(cloud, localCompanionState());
          hydrateLocal(merged);
          hydratedState = merged;
          await writeCloud(token, userId, merged);
        } else {
          const local = localCompanionState();
          const merged = mergeState(hydratedState || {}, local);
          hydratedState = merged;
          await writeCloud(token, userId, merged, keepalive);
        }
        if (!cancelled) setStatus("synced");
      } catch (_error) {
        if (!cancelled) setStatus("local");
      } finally {
        if (initial && !cancelled) setReady(true);
      }
    };

    if (!active) {
      setReady(false);
      return () => {};
    }

    sync(true);
    timer = window.setInterval(() => sync(false), 12000);
    const onOnline = () => sync(false);
    const onPageHide = () => sync(false, true);
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active]);

  return { ready, status };
}