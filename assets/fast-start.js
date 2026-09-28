// Fast warm-start bridge for the packaged Android app.
// Supabase persists the signed-in session in localStorage. On some Android
// WebViews, auth initialization can wait on token refresh/network work before
// getSession() resolves, leaving the app on its opening shell for many seconds.
// For a still-valid persisted session, let the first render use that local
// session immediately while Supabase continues its normal verification and
// auth-state reconciliation in the background.
(function () {
  "use strict";

  var LEGACY_AUTH_STORAGE_KEY = "sb-pvitdhixycegmcovapyh-auth-token";
  var APPEARANCE_STORAGE_KEY = "plushlife:appearance-mode:v1";
  var MIN_VALIDITY_SECONDS = 30;

  // Derive the gotrue storage key from the Supabase project URL passed to
  // createClient, instead of hardcoding the project ref. The warm-start read
  // keeps working if the Supabase project ever changes.
  function authStorageKeyFor(supabaseUrl) {
    try {
      var match = String(supabaseUrl || "").match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
      if (match && match[1]) return "sb-" + match[1].toLowerCase() + "-auth-token";
    } catch (_error) {}
    return LEGACY_AUTH_STORAGE_KEY;
  }

  // PlushLife now uses light theme palettes only. Apply light before React
  // mounts so there is never a system-dark flash during startup.
  try {
    window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    document.documentElement.dataset.plushlifeColorMode = "light";
    document.documentElement.dataset.plushlifeColorModePreference = "light";
    document.documentElement.style.colorScheme = "light";
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", "#b75acb");
  } catch (_error) {}

  var originalCreateClient = window.supabase && window.supabase.createClient;
  if (typeof originalCreateClient !== "function") return;

  function readValidPersistedSession(authStorageKey) {
    try {
      // Read the derived key first, then the legacy hardcoded key, so a
      // project move does not strand an existing signed-in session.
      var raw = window.localStorage.getItem(authStorageKey);
      if (!raw && authStorageKey !== LEGACY_AUTH_STORAGE_KEY) {
        raw = window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      }
      var parsed = JSON.parse(raw || "null");
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

    var authStorageKey = authStorageKeyFor(arguments[0]);
    var originalGetSession = client.auth.getSession.bind(client.auth);
    var firstSessionRead = true;

    client.auth.getSession = function () {
      if (firstSessionRead) {
        firstSessionRead = false;
        var cachedSession = readValidPersistedSession(authStorageKey);
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
