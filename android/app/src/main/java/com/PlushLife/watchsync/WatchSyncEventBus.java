package com.PlushLife.watchsync;

import android.os.Handler;
import android.os.Looper;
import java.util.concurrent.CopyOnWriteArrayList;

// WatchSyncServer#serve() runs on NanoHTTPD's own request-handling threads,
// not the main thread, and Capacitor plugin listener callbacks must fire on
// the main thread. This is the (small, in-process only) hop between them.
public class WatchSyncEventBus {
    public interface Listener {
        void onTaskUpdated(String taskKey, boolean completed, String date);
    }

    private static final WatchSyncEventBus INSTANCE = new WatchSyncEventBus();
    private final CopyOnWriteArrayList<Listener> listeners = new CopyOnWriteArrayList<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static WatchSyncEventBus get() {
        return INSTANCE;
    }

    public void addListener(Listener listener) {
        listeners.add(listener);
    }

    public void removeListener(Listener listener) {
        listeners.remove(listener);
    }

    public void notifyTaskUpdated(String taskKey, boolean completed, String date) {
        mainHandler.post(() -> {
            for (Listener listener : listeners) listener.onTaskUpdated(taskKey, completed, date);
        });
    }
}
