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
  var MIN_VALIDITY_SECONDS = 30;
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
