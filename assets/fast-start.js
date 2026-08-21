// Fast warm-start bridge for the packaged Android app.
// Supabase persists the signed-in session in localStorage. On some Android
// WebViews, auth initialization can wait on token refresh/network work before
// getSession() resolves, leaving the app on its opening shell for many seconds.
// For a still-valid persisted session, let the first render use that local
// session immediately while Supabase continues its normal verification and
// auth-state reconciliation in the background.
(function () {
  "use strict";

  var AUTH_STORAGE_KEY = "sb-pvitdhixycegmcovapyh-auth-token";
  var APPEARANCE_STORAGE_KEY = "plushlife:appearance-mode:v1";
  var MIN_VALIDITY_SECONDS = 30;

  // Apply the saved/system appearance before React mounts so a dark-mode user
  // does not get a bright opening shell while the full appearance runtime is
  // still loading.
  try {
    var requestedAppearance = window.localStorage.getItem(APPEARANCE_STORAGE_KEY) || "system";
    var useDark = requestedAppearance === "dark" || (requestedAppearance === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.plushlifeColorMode = useDark ? "dark" : "light";
    document.documentElement.dataset.plushlifeColorModePreference = requestedAppearance;
    document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", useDark ? "#17131d" : "#b75acb");
    if (useDark && !document.getElementById("plushlife-fast-dark-shell")) {
      var earlyDarkStyle = document.createElement("style");
      earlyDarkStyle.id = "plushlife-fast-dark-shell";
      earlyDarkStyle.textContent = "html[data-plushlife-color-mode=dark],html[data-plushlife-color-mode=dark] body{background:#17131d!important;color-scheme:dark!important}html[data-plushlife-color-mode=dark] #plush-boot-shell{background:#17131d!important;color:#eee7f2!important}html[data-plushlife-color-mode=dark] #plush-boot-shell .boot-card{background:#241e2b!important;border-color:#504359!important}html[data-plushlife-color-mode=dark] #plush-boot-shell .boot-status{color:#b9aabd!important}";
      document.head.appendChild(earlyDarkStyle);
    }
  } catch (_error) {}

  var originalCreateClient = window.supabase && window.supabase.createClient;
  if (typeof originalCreateClient !== "function") return;

  function readValidPersistedSession() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
      var session = parsed && parsed.currentSession ? parsed.currentSession : parsed;
      if (!session || !session.user || !session.access_token) return null;
      var expiresAt = Number(session.expires_at || 0);
      if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) + MIN_VALIDITY_SECONDS) return null;
      return session;
    } catch (_error) {
      return null;
    }
  }

  window.supabase.createClient = function () {
    var client = originalCreateClient.apply(window.supabase, arguments);
    if (!client || !client.auth || typeof client.auth.getSession !== "function") return client;

    var originalGetSession = client.auth.getSession.bind(client.auth);
    var firstSessionRead = true;

    client.auth.getSession = function () {
      if (firstSessionRead) {
        firstSessionRead = false;
        var cachedSession = readValidPersistedSession();
        if (cachedSession) {
          // Reconcile with Supabase immediately after first paint. The normal
          // onAuthStateChange listener remains the source of truth if the
          // server-side session has changed.
          Promise.resolve().then(function () {
            return originalGetSession();
          }).catch(function () {});
          return Promise.resolve({ data: { session: cachedSession }, error: null });
        }
      }
      return originalGetSession();
    };

    return client;
  };
})();
