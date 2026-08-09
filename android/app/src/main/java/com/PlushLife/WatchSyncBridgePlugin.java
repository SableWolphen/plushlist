package com.PlushLife;

import android.content.Intent;
import android.os.Build;
import com.PlushLife.watchsync.WatchSyncDbHelper;
import com.PlushLife.watchsync.WatchSyncEventBus;
import com.PlushLife.watchsync.WatchSyncServer;
import com.PlushLife.watchsync.WatchSyncService;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

// Bridges the web app (which already owns the authenticated Supabase
// session and today's task data) to the native local HTTP server that talks
// to the watch. This plugin never touches Supabase itself — it only ever
// reads/writes the on-device cache in WatchSyncDbHelper, and relays a live
// "a watch tap just happened" event so the open app can update instantly.
@CapacitorPlugin(name = "WatchSyncBridge")
public class WatchSyncBridgePlugin extends Plugin implements WatchSyncEventBus.Listener {
    private static final String PREFS = "watch_sync_prefs";
    private static final String KEY_ENABLED = "local_sync_enabled";

    private WatchSyncDbHelper db;

    @Override
    public void load() {
        db = new WatchSyncDbHelper(getContext());
        WatchSyncEventBus.get().addListener(this);
        if (isEnabled()) startServiceIfNeeded();
    }

    @Override
    protected void handleOnDestroy() {
        WatchSyncEventBus.get().removeListener(this);
        super.handleOnDestroy();
    }

    private boolean isEnabled() {
        return getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
            .getBoolean(KEY_ENABLED, false);
    }

    private void startServiceIfNeeded() {
        Intent intent = new Intent(getContext(), WatchSyncService.class);
        // Context#startForegroundService only exists from API 26 (minSdkVersion
        // here is 24); on 24/25 a plain startService is enough since the
        // service promotes itself via Service#startForeground in its own
        // onCreate regardless of which start method launched it.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    // Called once when the user taps "Enable instant local sync" in Settings.
    // Opens a 2-minute window during which the watch's next /register call
    // succeeds, and remembers that local sync is on so the service restarts
    // automatically on future app launches without asking again.
    @PluginMethod
    public void startPairingMode(PluginCall call) {
        getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_ENABLED, true).apply();
        startServiceIfNeeded();
        WatchSyncServer.beginPairingMode(getContext());
        call.resolve();
    }

    // Called whenever the web app's own auth state changes (sign-in/out),
    // so the local server knows whether there's currently an account to
    // attach a new watch pairing to. Never receives a password or token —
    // just the user id, mirroring the existing cloud pairing's own "the
    // watch never sees your PlushLife credentials" guarantee.
    @PluginMethod
    public void setSignedInUser(PluginCall call) {
        String userId = call.getString("userId");
        WatchSyncServer.setSignedInUser(getContext(), userId);
        call.resolve();
    }

    // Returns everything the watch has recorded locally that Supabase
    // hasn't seen yet, so the web app can apply each one through its own
    // existing Supabase write path (same shape as watch-sync's cloud path).
    @PluginMethod
    public void getPendingChanges(PluginCall call) {
        JSArray changes = new JSArray();
        for (WatchSyncDbHelper.PendingChange change : db.unsyncedChanges()) {
            JSObject item = new JSObject();
            item.put("id", change.id);
            item.put("taskKey", change.taskKey);
            item.put("completed", change.completed);
            item.put("date", change.changeDate);
            changes.put(item);
        }
        JSObject result = new JSObject();
        result.put("changes", changes);
        call.resolve(result);
    }

    @PluginMethod
    public void markSynced(PluginCall call) {
        JSArray idsArray = call.getArray("ids");
        if (idsArray == null) {
            call.reject("ids is required");
            return;
        }
        List<Long> ids = new ArrayList<>();
        try {
            for (int i = 0; i < idsArray.length(); i++) ids.add(idsArray.getLong(i));
            db.markSynced(ids);
            call.resolve();
        } catch (Exception e) {
            call.reject("Invalid ids");
        }
    }

    @Override
    public void onTaskUpdated(String taskKey, boolean completed, String date) {
        JSObject data = new JSObject();
        data.put("taskKey", taskKey);
        data.put("completed", completed);
        data.put("date", date);
        notifyListeners("watchTaskUpdated", data);
    }
}
