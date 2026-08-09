package com.PlushLife.watchsync;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import com.PlushLife.R;

// Android reclaims background sockets aggressively; a foreground service
// with a persistent (minimum-priority, silent) notification is what keeps
// WatchSyncServer actually listening while the app isn't in the foreground.
// Users on aggressive-battery-management OEMs (Xiaomi/OnePlus/Huawei/etc.)
// may still need to exempt PlushLife from battery optimization for this to
// stay reliable long-term — that's an OS setting outside this app's control.
public class WatchSyncService extends Service {
    private static final int PORT = 8787;
    private static final int NOTIFICATION_ID = 42;
    private static final String CHANNEL_ID = "watch_sync";

    private WatchSyncServer server;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PlushLife watch sync")
            .setContentText("Ready for instant updates from your watch")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification.build());
        }

        server = new WatchSyncServer(this, PORT, (taskKey, completed, date) ->
            WatchSyncEventBus.get().notifyTaskUpdated(taskKey, completed, date));
        try {
            server.start(fi.iki.elonen.NanoHTTPD.SOCKET_READ_TIMEOUT, false);
        } catch (java.io.IOException e) {
            // Port already bound (e.g. a second app-process start) — stop cleanly
            // rather than crash; the existing server instance keeps serving.
            stopSelf();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "Watch sync", NotificationManager.IMPORTANCE_MIN);
        channel.setShowBadge(false);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (server != null) server.stop();
        super.onDestroy();
    }
}
