package com.PlushLife;

import android.graphics.Color;
import android.content.Intent;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.core.splashscreen.SplashScreen;
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

    // Must be registered before the activity reaches STARTED, so this has to
    // be a field initializer rather than something called later from
    // onCreate/onResume.
    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {});

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateListener;
    private AlertDialog updateReadyDialog;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // A task selected from Android Recents can recreate this Activity even
        // when savedInstanceState is null (for example after the process was
        // reclaimed). Applying the launch splash in that case makes a normal
        // return to PlushLife look like a full app restart. Detect both normal
        // state restoration and LAUNCHED_FROM_HISTORY before super.onCreate().
        final boolean launchedFromHistory =
            (getIntent().getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0;
        final boolean restoringExistingTask = savedInstanceState != null || launchedFromHistory;

        if (restoringExistingTask) {
            // Bypass the splash theme entirely for a warm/task restore. The
            // WebView or warm-start cache can paint the previous screen while
            // Capacitor reconnects, instead of flashing the purple launch UI.
            setTheme(R.style.AppTheme_NoActionBar);
        } else {
            SplashScreen.installSplashScreen(this);
        }

        EdgeToEdge.enable(
            this,
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationPermissionPlugin.class);
        registerPlugin(BuildInfoPlugin.class);
        // Temporarily disabled along with the FOREGROUND_SERVICE_DATA_SYNC
        // permission and <service> entry in AndroidManifest.xml.
        // registerPlugin(WatchSyncBridgePlugin.class);
        super.onCreate(savedInstanceState);

        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        if (getActionBar() != null) {
            getActionBar().hide();
        }

        // Android/Samsung may destroy an activity while PlushLife is in the
        // background even though the task remains in Recents. Capacitor then
        // builds a fresh WebView when the task is selected again. Restore any
        // state Android gave us before falling back to the app's warm cache.
        if (savedInstanceState != null && bridge != null && bridge.getWebView() != null) {
            Bundle webViewState = savedInstanceState.getBundle(WEBVIEW_STATE_KEY);
            if (webViewState != null) {
                bridge.getWebView().restoreState(webViewState);
            }
        }

        // Only start a Play update check on a genuine cold launch. Returning
        // from Recents should never start an external update flow.
        if (!restoringExistingTask) {
            checkForUpdate();
        } else {
            appUpdateManager = AppUpdateManagerFactory.create(this);
        }
    }

    private void checkForUpdate() {
        appUpdateManager = AppUpdateManagerFactory.create(this);
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;
            if (info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                appUpdateManager.startUpdateFlowForResult(
                    info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build());
            } else if (info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                installStateListener = state -> {
                    if (state.installStatus() == InstallStatus.DOWNLOADED) {
                        promptToRestartForUpdate();
                    }
                };
                appUpdateManager.registerListener(installStateListener);
                appUpdateManager.startUpdateFlowForResult(
                    info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build());
            }
        });
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
        if (appUpdateManager != null) {
            appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    promptToRestartForUpdate();
                }
            });
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (bridge != null && bridge.getWebView() != null) {
            Bundle webViewState = new Bundle();
            bridge.getWebView().saveState(webViewState);
            outState.putBundle(WEBVIEW_STATE_KEY, webViewState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("document.dispatchEvent(new CustomEvent('plushlife-widget-action'))", null));
        }
    }

    @Override
    public void onDestroy() {
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
