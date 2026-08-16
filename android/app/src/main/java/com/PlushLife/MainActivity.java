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

        if (savedInstanceState != null && bridge != null && bridge.getWebView() != null) {
            Bundle webViewState = savedInstanceState.getBundle(WEBVIEW_STATE_KEY);
            if (webViewState != null) {
                bridge.getWebView().restoreState(webViewState);
            }
        }

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
