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
import androidx.appcompat.app.AlertDialog;
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
    private AlertDialog updateReadyDialog;
    private AlertDialog updateAvailableDialog;
    private final Handler updateHandler = new Handler(Looper.getMainLooper());
    private boolean updateCheckScheduled = false;
    private boolean updateCheckedThisSession = false;

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
        if (updateCheckedThisSession || isFinishing() || isDestroyed()) return;
        updateCheckedThisSession = true;

        try {
            appUpdateManager = AppUpdateManagerFactory.create(this);
            appUpdateManager.getAppUpdateInfo()
                .addOnSuccessListener(info -> {
                    // Play only reports UPDATE_AVAILABLE when the installed
                    // versionCode is older than a version available to this
                    // user on Google Play. Current-version users see nothing.
                    if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;
                    showUpdateAvailableDialog(info);
                })
                .addOnFailureListener(error -> {
                    // Update checks are nonessential. Never let Play services
                    // availability or an OEM issue affect normal app startup.
                    appUpdateManager = null;
                });
        } catch (Throwable ignored) {
            appUpdateManager = null;
        }
    }

    private void showUpdateAvailableDialog(com.google.android.play.core.appupdate.AppUpdateInfo info) {
        if (isFinishing() || isDestroyed()) return;
        if (updateAvailableDialog != null && updateAvailableDialog.isShowing()) return;

        final boolean immediateAllowed = info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE);
        final boolean flexibleAllowed = info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE);
        if (!immediateAllowed && !flexibleAllowed) return;

        updateAvailableDialog = new AlertDialog.Builder(this)
            .setTitle("PlushLife update available")
            .setMessage("A newer version of PlushLife is ready. Update now to get the latest fixes and improvements.")
            .setPositiveButton("Update now", (dialog, which) -> {
                try {
                    if (immediateAllowed) {
                        appUpdateManager.startUpdateFlowForResult(
                            info,
                            updateLauncher,
                            AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build());
                    } else {
                        installStateListener = state -> {
                            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                                promptToRestartForUpdate();
                            }
                        };
                        appUpdateManager.registerListener(installStateListener);
                        appUpdateManager.startUpdateFlowForResult(
                            info,
                            updateLauncher,
                            AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build());
                    }
                } catch (Throwable ignored) {
                    // If Play cannot launch its UI, leave the app usable.
                }
            })
            .setNegativeButton("Later", null)
            .setCancelable(true)
            .create();
        updateAvailableDialog.setOnDismissListener(dialog -> updateAvailableDialog = null);
        updateAvailableDialog.show();
    }

    private void promptToRestartForUpdate() {
        if (isFinishing() || isDestroyed()) return;
        if (updateReadyDialog != null && updateReadyDialog.isShowing()) return;

        updateReadyDialog = new AlertDialog.Builder(this)
            .setTitle("Update ready")
            .setMessage("A newer version of PlushLife has finished downloading.")
            .setPositiveButton("Restart now", (dialog, which) -> appUpdateManager.completeUpdate())
            .setNegativeButton("Later", null)
            .setCancelable(true)
            .create();
        updateReadyDialog.setOnDismissListener(dialog -> updateReadyDialog = null);
        updateReadyDialog.show();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!updateCheckScheduled && !updateCheckedThisSession) {
            updateCheckScheduled = true;
            updateHandler.postDelayed(() -> {
                updateCheckScheduled = false;
                checkForUpdate();
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
        if (updateAvailableDialog != null) {
            updateAvailableDialog.dismiss();
            updateAvailableDialog = null;
        }
        if (updateReadyDialog != null) {
            updateReadyDialog.dismiss();
            updateReadyDialog = null;
        }
        if (appUpdateManager != null && installStateListener != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.onDestroy();
    }
}
