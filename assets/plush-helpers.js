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

(function (root) {
  if (!root?.document?.head) return;
  const style = root.document.createElement("style");
  style.id = "plushlife-nursery-appearance";
  style.textContent = `
    .baby-mode {
      --nursery-page:#fff6fb;--nursery-surface:rgba(255,255,255,.82);--nursery-surface-strong:#fffafd;--nursery-surface-soft:#fbf2ff;
      --nursery-border:#e6cdea;--nursery-divider:#f0e4f2;--nursery-text:#5f4b68;--nursery-muted:#8c7796;--nursery-accent:#a85ac0;
      --nursery-shadow:0 10px 28px rgba(135,82,151,.10);
      background: #FFF5FB !important;
      background-image:
        radial-gradient(circle at 12% 8%, rgba(255,190,226,.42) 0%, transparent 30%),
        radial-gradient(circle at 90% 10%, rgba(190,235,255,.42) 0%, transparent 31%),
        linear-gradient(180deg, #FFF4FA 0%, #FBF5FF 46%, #F5FAFF 100%) !important;
      background-attachment: fixed !important;
    }
    .baby-mode .baby-shell {
      background: rgba(255,255,255,.14) !important;
      box-shadow: 0 14px 40px rgba(166,93,193,.08) !important;
    }
    .baby-mode .baby-today-simple,
    .baby-mode .baby-today-simple > * {
      min-width: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    .baby-mode .baby-today-simple section[aria-label="Little jobs"] > div:last-child > button {
      box-sizing: border-box !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    .baby-mode .nursery-panel,.baby-mode .nursery-tabs,.baby-mode .nursery-week,.baby-mode .nursery-jobs,.baby-mode .nursery-schedule {
      background:var(--nursery-surface) !important;border-color:var(--nursery-border) !important;box-shadow:var(--nursery-shadow) !important;
    }
    .baby-mode .nursery-panel { background:linear-gradient(135deg,var(--nursery-surface-soft),var(--nursery-surface-strong)) !important; }
    .baby-mode .nursery-task-row { background:rgba(255,255,255,.68) !important;color:var(--nursery-text) !important;border-color:var(--nursery-divider) !important; }
    .baby-mode .nursery-section-row { background:var(--nursery-surface-strong) !important;color:var(--nursery-accent) !important; }
    .baby-mode section[aria-label="Weekly intention"] { background:linear-gradient(135deg,var(--nursery-surface-soft),var(--nursery-surface-strong)) !important;border-color:var(--nursery-border) !important;box-shadow:var(--nursery-shadow) !important; }
    .baby-mode [aria-label="Baby Mode view"],.baby-mode [aria-label="Little jobs week"],.baby-mode section[aria-label="Little jobs"],.baby-mode section[aria-label$="gentle schedule"] { background:var(--nursery-surface) !important;border-color:var(--nursery-border) !important;box-shadow:var(--nursery-shadow) !important; }
    .baby-mode section[aria-label="Little jobs"] > div:last-child > button { background:rgba(255,255,255,.68) !important;color:var(--nursery-text) !important;border-color:var(--nursery-divider) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode {
      --nursery-page:#241a35;--nursery-surface:rgba(57,43,78,.91);--nursery-surface-strong:#433255;--nursery-surface-soft:#352746;
      --nursery-border:#745f8d;--nursery-divider:#554367;--nursery-text:#f8eef9;--nursery-muted:#cdbbd4;--nursery-accent:#ef9ee8;
      --nursery-shadow:0 12px 32px rgba(8,5,18,.28);
      background:#241a35 !important;
      background-image:radial-gradient(circle at 9% 6%,rgba(207,107,190,.28) 0%,transparent 30%),radial-gradient(circle at 92% 8%,rgba(83,154,207,.26) 0%,transparent 31%),radial-gradient(circle at 80% 82%,rgba(117,91,174,.18) 0%,transparent 31%),linear-gradient(180deg,#281c3a 0%,#211a34 48%,#19172b 100%) !important;
      color:var(--nursery-text) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .baby-shell { background:rgba(44,32,61,.34) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-nook { background:linear-gradient(135deg,#4a3156 0%,#352c55 52%,#263d59 100%) !important;border-color:#806795 !important;box-shadow:inset 0 0 0 3px rgba(255,255,255,.06),var(--nursery-shadow) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-nook::before { opacity:.24 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-nook-label,html[data-plushlife-color-mode="dark"] .baby-mode .nursery-nook-caption,html[data-plushlife-color-mode="dark"] .baby-mode h1 { color:#f2b0ec !important;text-shadow:0 3px 14px rgba(239,158,232,.22) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-task-row { background:#382b49 !important;color:var(--nursery-text) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-section-row { background:#30243f !important;color:#e9a9e7 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode section[aria-label="Little jobs"] > div:last-child > button { background:#382b49 !important;color:var(--nursery-text) !important;border-color:var(--nursery-divider) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode button:not([aria-selected="true"]),html[data-plushlife-color-mode="dark"] .baby-mode input,html[data-plushlife-color-mode="dark"] .baby-mode textarea,html[data-plushlife-color-mode="dark"] .baby-mode select { background-color:#403051 !important;color:var(--nursery-text) !important;border-color:#715b87 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode [style*="#5B4B6B"],html[data-plushlife-color-mode="dark"] .baby-mode [style*="#76558A"],html[data-plushlife-color-mode="dark"] .baby-mode [style*="#806B8D"] { color:var(--nursery-text) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode [style*="#9A85A5"] { color:var(--nursery-muted) !important; }
  `;
  root.document.head.appendChild(style);
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
