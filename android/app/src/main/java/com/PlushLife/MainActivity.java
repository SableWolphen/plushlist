package com.PlushLife;

import android.graphics.Color;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    private static final String WEBVIEW_STATE_KEY = "plushlife_webview_state";

    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {});

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateListener;
    private final Handler updateHandler = new Handler(Looper.getMainLooper());
    private static final long UPDATE_CHECK_INTERVAL_MS = 4L * 60L * 60L * 1000L;
    private boolean updateCheckScheduled = false;
    private long lastUpdateCheckAt = 0L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        final boolean launchedFromHistory =
            (getIntent().getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0;
        final boolean restoringExistingTask = savedInstanceState != null || launchedFromHistory;

        // MainActivity deliberately uses the normal no-action-bar theme in
        // AndroidManifest.xml. A native splash starting window is created
        // before onCreate(), so trying to suppress it here during a Recents
        // restore is too late. PlushLife's web boot shell handles cold-start
        // loading instead, which avoids a fake purple relaunch on warm return.
        // Keep native startup defensive. A nonessential plugin or edge-to-edge
        // failure must never take down the whole app on launch.
        try { registerPlugin(WidgetBridgePlugin.class); } catch (Throwable ignored) {}
        try { registerPlugin(NotificationPermissionPlugin.class); } catch (Throwable ignored) {}
        try { registerPlugin(BuildInfoPlugin.class); } catch (Throwable ignored) {}
        // Temporarily disabled along with the FOREGROUND_SERVICE_DATA_SYNC
        // permission and <service> entry in AndroidManifest.xml.
        // registerPlugin(WatchSyncBridgePlugin.class);

        super.onCreate(savedInstanceState);

        try {
            EdgeToEdge.enable(
                this,
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        } catch (Throwable ignored) {}

        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        if (getActionBar() != null) {
            getActionBar().hide();
        }

        if (savedInstanceState != null && bridge != null && bridge.getWebView() != null) {
            try {
                Bundle webViewState = savedInstanceState.getBundle(WEBVIEW_STATE_KEY);
                if (webViewState != null) {
                    bridge.getWebView().restoreState(webViewState);
                }
            } catch (Throwable ignored) {
                // A stale/corrupt OEM WebView snapshot should fall back to a
                // clean web load instead of crashing the native process.
            }
        }

        // Keep Play update work out of the fragile Activity startup path.
        // A delayed check runs from onResume after Capacitor/WebView startup
        // has had time to settle, preserving the launch-crash hardening.
        appUpdateManager = null;
    }

    private void checkForUpdate() {
        if (isFinishing() || isDestroyed()) return;
        final long now = System.currentTimeMillis();
        if (now - lastUpdateCheckAt < UPDATE_CHECK_INTERVAL_MS) return;
        lastUpdateCheckAt = now;

        try {
            if (appUpdateManager == null) appUpdateManager = AppUpdateManagerFactory.create(this);
            appUpdateManager.getAppUpdateInfo()
                .addOnSuccessListener(info -> {
                    if (info.installStatus() == InstallStatus.DOWNLOADED) {
                        updateHandler.postDelayed(() -> {
                            try { appUpdateManager.completeUpdate(); } catch (Throwable ignored) {}
                        }, 500);
                        return;
                    }
                    if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
                        && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                        launchPlayUpdate(info, AppUpdateType.IMMEDIATE);
                        return;
                    }
                    if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;

                    if (info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                        launchPlayUpdate(info, AppUpdateType.FLEXIBLE);
                    } else if (info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                        launchPlayUpdate(info, AppUpdateType.IMMEDIATE);
                    }
                })
                .addOnFailureListener(error -> appUpdateManager = null);
        } catch (Throwable ignored) {
            appUpdateManager = null;
        }
    }

    private void launchPlayUpdate(com.google.android.play.core.appupdate.AppUpdateInfo info, int updateType) {
        if (isFinishing() || isDestroyed() || appUpdateManager == null) return;
        try {
            if (updateType == AppUpdateType.FLEXIBLE && installStateListener == null) {
                installStateListener = state -> {
                    if (state.installStatus() == InstallStatus.DOWNLOADED) {
                        updateHandler.postDelayed(() -> {
                            try { appUpdateManager.completeUpdate(); } catch (Throwable ignored) {}
                        }, 500);
                    }
                };
                appUpdateManager.registerListener(installStateListener);
            }
            appUpdateManager.startUpdateFlowForResult(
                info,
                updateLauncher,
                AppUpdateOptions.newBuilder(updateType).build());
        } catch (Throwable ignored) {
            // Google Play owns the confirmation UI; update failure must never block startup.
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!updateCheckScheduled) {
            updateCheckScheduled = true;
            updateHandler.postDelayed(() -> {
                updateCheckScheduled = false;
                if (lastUpdateCheckAt == 0L || System.currentTimeMillis() - lastUpdateCheckAt >= UPDATE_CHECK_INTERVAL_MS) {
                    checkForUpdate();
                } else if (appUpdateManager != null) {
                    appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                        if (info.installStatus() == InstallStatus.DOWNLOADED) {
                            try { appUpdateManager.completeUpdate(); } catch (Throwable ignored) {}
                        } else if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
                            && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                            launchPlayUpdate(info, AppUpdateType.IMMEDIATE);
                        }
                    });
                }
            }, 2500);
        }
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        if (bridge != null && bridge.getWebView() != null) {
            Bundle webViewState = new Bundle();
            bridge.getWebView().saveState(webViewState);
            outState.putBundle(WEBVIEW_STATE_KEY, webViewState);
        }
        super.onSaveInstanceState(outState);
    }

    private boolean isWidgetTaskIntent(Intent intent) {
        if (intent == null) return false;
        if (intent.hasExtra("plushlifeTaskKey") || intent.hasExtra("plushlifeTaskAction")) return true;
        String action = intent.getAction();
        return action != null && action.startsWith("com.PlushLife.WIDGET_DONE_");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // singleTask means tapping the launcher while PlushLife is already
        // alive arrives here too. Only notify the web app for an actual
        // widget task action; ordinary launcher/home-screen taps should just
        // bring the existing activity forward without re-running app logic.
        if (isWidgetTaskIntent(intent) && bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("document.dispatchEvent(new CustomEvent('plushlife-widget-action'))", null));
        }
    }

    @Override
    public void onDestroy() {
        updateHandler.removeCallbacksAndMessages(null);
        if (appUpdateManager != null && installStateListener != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.onDestroy();
    }
}
