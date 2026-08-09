package com.PlushLife.watchsync;

import android.content.Context;
import android.content.SharedPreferences;
import fi.iki.elonen.NanoHTTPD;
import org.json.JSONObject;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

// Loopback-only local HTTP server. Bound to 127.0.0.1 — never 0.0.0.0 — so
// nothing outside this phone can ever reach it. A raw TCP port on 127.0.0.1
// is still reachable by any other app on the same device with INTERNET
// permission, which is why /complete requires a per-watch secret whose hash
// is the only thing ever stored (see WatchSyncDbHelper). This server never
// talks to the network itself; it only ever updates the local cache.
// Reconciling that cache up to Supabase is the web app's job (see
// WatchSyncBridgePlugin.getPendingChanges()), using the same authenticated
// Supabase session it already has — this native layer doesn't hold or need
// any Supabase credentials at all.
//
// Deliberately scoped to /register + /complete only. The watch's task list
// (grouping, pagination, "which section is relevant right now") still comes
// from the existing cloud watch-sync Edge Function unchanged — that logic
// is real server-side business logic, not something worth re-implementing
// and risking drift from. Only the "tap to mark done" write, which is what
// actually needs to be instant, is local-first.
public class WatchSyncServer extends NanoHTTPD {
    private static final String PREFS = "watch_sync_prefs";
    private static final String KEY_PAIRING_UNTIL = "pairing_until";
    private static final String KEY_SIGNED_IN_USER = "signed_in_user";
    private static final long PAIRING_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

    public interface Listener {
        void onTaskUpdated(String taskKey, boolean completed, String date);
    }

    private final Context context;
    private final WatchSyncDbHelper db;
    private final Listener listener;

    public WatchSyncServer(Context context, int port, Listener listener) {
        super("127.0.0.1", port);
        this.context = context.getApplicationContext();
        this.db = new WatchSyncDbHelper(this.context);
        this.listener = listener;
    }

    private SharedPreferences prefs() {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void beginPairingMode(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(KEY_PAIRING_UNTIL, System.currentTimeMillis() + PAIRING_WINDOW_MS)
            .apply();
    }

    public static void setSignedInUser(Context context, String userId) {
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        if (userId == null || userId.isEmpty()) editor.remove(KEY_SIGNED_IN_USER);
        else editor.putString(KEY_SIGNED_IN_USER, userId);
        editor.apply();
    }

    private boolean pairingModeActive() {
        return System.currentTimeMillis() < prefs().getLong(KEY_PAIRING_UNTIL, 0);
    }

    private boolean hasSignedInUser() {
        return prefs().getString(KEY_SIGNED_IN_USER, null) != null;
    }

    @Override
    public Response serve(IHTTPSession session) {
        try {
            if (session.getMethod() != Method.POST) {
                return json(Response.Status.METHOD_NOT_ALLOWED, err("POST required"));
            }
            String uri = session.getUri();
            Map<String, Object> body = readJsonBody(session);
            if ("/register".equals(uri)) return register();
            if ("/complete".equals(uri)) return complete(body);
            return json(Response.Status.NOT_FOUND, err("Unknown route"));
        } catch (Exception e) {
            return json(Response.Status.INTERNAL_ERROR, err("Local sync is temporarily unavailable"));
        }
    }

    private Response register() {
        if (!hasSignedInUser()) return json(Response.Status.FORBIDDEN, err("Sign in to PlushLife first"));
        if (!pairingModeActive()) {
            return json(Response.Status.FORBIDDEN,
                err("Open PlushLife > Settings > Connect Watch and tap \"Enable instant local sync\" first"));
        }
        String rawSecret = db.registerNewSecret("Watch");
        // One registration consumes the pairing window so a second nearby
        // app can't also slip in during the same 2 minutes.
        prefs().edit().putLong(KEY_PAIRING_UNTIL, 0).apply();
        Map<String, Object> result = new HashMap<>();
        result.put("connected", true);
        result.put("device_secret", rawSecret);
        return json(Response.Status.OK, result);
    }

    private Response complete(Map<String, Object> body) {
        String secret = (String) body.get("device_secret");
        if (!db.isValidSecret(secret)) return unauthorized();
        String taskKey = (String) body.get("task_key");
        Object completedObj = body.get("completed");
        String date = (String) body.get("date");
        if (taskKey == null || date == null || !(completedObj instanceof Boolean)) {
            return json(Response.Status.BAD_REQUEST, err("Invalid task update"));
        }
        boolean completed = (Boolean) completedObj;
        db.recordChange(taskKey, completed, date);
        if (listener != null) listener.onTaskUpdated(taskKey, completed, date);

        Map<String, Object> result = new HashMap<>();
        result.put("connected", true);
        result.put("task_key", taskKey);
        result.put("completed", completed);
        return json(Response.Status.OK, result);
    }

    private Response unauthorized() {
        return json(Response.Status.UNAUTHORIZED, err("Watch is not connected"));
    }

    private Map<String, Object> err(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("error", message);
        return result;
    }

    private Response json(Response.Status status, Map<String, Object> body) {
        Response response = newFixedLengthResponse(status, "application/json", new JSONObject(body).toString());
        response.addHeader("Cache-Control", "no-store");
        return response;
    }

    private Map<String, Object> readJsonBody(IHTTPSession session) throws IOException, ResponseException {
        Map<String, String> files = new HashMap<>();
        session.parseBody(files);
        String raw = files.get("postData");
        Map<String, Object> result = new HashMap<>();
        if (raw == null || raw.isEmpty()) return result;
        try {
            JSONObject obj = new JSONObject(raw);
            java.util.Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                result.put(key, obj.get(key));
            }
        } catch (Exception ignored) {
            // Malformed body — handlers treat missing fields as invalid input.
        }
        return result;
    }
}
