(function (root) {
  // Supabase restores the same persisted session that is already stored on
  // this device. On some Android WebViews that restore can spend several
  // seconds waiting on the auth initialization lock before getSession()
  // resolves, leaving the user on the opening skeleton even though a valid
  // unexpired session is already available locally.
  //
  // Give the first getSession() call a cache-first fast path when (and only
  // when) that persisted access token is still valid. Supabase still runs
  // its normal initialization in the background and onAuthStateChange in the
  // app remains the source of truth, so refreshes/sign-outs still reconcile.
  if (!root || !root.supabase || typeof root.supabase.createClient !== "function") return;
  const authStorageKey = "sb-pvitdhixycegmcovapyh-auth-token";
  const originalCreateClient = root.supabase.createClient.bind(root.supabase);

  root.supabase.createClient = function createClientWithWarmSession(url, key, options) {
    const client = originalCreateClient(url, key, options);
    const originalGetSession = client?.auth?.getSession?.bind(client.auth);
    if (!originalGetSession) return client;

    let usedWarmSession = false;
    client.auth.getSession = function getSessionWithWarmStart() {
      if (usedWarmSession) return originalGetSession();
      usedWarmSession = true;

      let cachedSession = null;
      try {
        const parsed = JSON.parse(root.localStorage.getItem(authStorageKey) || "null");
        const expiresAt = Number(parsed?.expires_at || 0);
        const tokenStillValid = Boolean(parsed?.access_token && parsed?.user?.id && expiresAt * 1000 > Date.now() + 30000);
        if (tokenStillValid) cachedSession = parsed;
      } catch (_error) {}

      if (!cachedSession) return originalGetSession();

      // Start the normal Supabase restore immediately too. The app's existing
      // auth-state listener will reconcile the authoritative session once it
      // completes; this promise is intentionally not awaited by first paint.
      Promise.resolve().then(() => originalGetSession()).catch(() => {});
      return Promise.resolve({ data: { session: cachedSession }, error: null });
    };

    return client;
  };
})(typeof window !== "undefined" ? window : globalThis);

(function (root, factory) {
  const plushContent = typeof module === "object" && module.exports
    ? require("./plush-content.js")
    : (root && root.PlushLifeContent) || {};
  const api = factory(plushContent);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeHelpers = api;
})(typeof window !== "undefined" ? window : globalThis, function (plushContent) {
  // Small pure helpers with no JSX and no dependency on component state,
  // moved out of the main app-source script alongside assets/plush-content.js
  // (module split phase 2 — see docs/module-split-plan.md).

  const MOTHERLY_NICKNAMES = ["baby", "little one", "sweetheart", "angel", "bunny", "pumpkin", "darling"];
  const OPTIONAL_SECTION_MARKERS = ["bonus", "little space", "reward", "fun"];

  function formatRelativeTime(isoString) {
    if (!isoString) return "Never yet";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
    return new Date(isoString).toLocaleDateString();
  }

  function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
  }

  function mascotGrowthStageForDays(activityDays) {
    const stages = plushContent.MASCOT_GROWTH_STAGES;
    return stages.find((stage) => activityDays >= stage.minDays) || stages[stages.length - 1];
  }

  return {
    MOTHERLY_NICKNAMES,
    OPTIONAL_SECTION_MARKERS,
    formatRelativeTime,
    urlBase64ToUint8Array,
    mascotGrowthStageForDays,
  };
});
