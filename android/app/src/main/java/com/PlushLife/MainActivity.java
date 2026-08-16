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
        SplashScreen.installSplashScreen(this);
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
        // builds a fresh WebView when the task is selected again, which looks
        // like a random app restart and resets transient UI. Preserve the
        // WebView navigation/scroll state so an activity recreation resumes
        // where the user left off instead of visibly starting from scratch.
        if (savedInstanceState != null && bridge != null && bridge.getWebView() != null) {
            Bundle webViewState = savedInstanceState.getBundle(WEBVIEW_STATE_KEY);
            if (webViewState != null) {
                bridge.getWebView().restoreState(webViewState);
            }
        }

        // Only start a new Play update check on a genuine cold launch. An
        // Android activity recreation should be a transparent resume, not an
        // opportunity to start another external flow that can make the app
        // appear to relaunch again.
        if (savedInstanceState == null) {
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
