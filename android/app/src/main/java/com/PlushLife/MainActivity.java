package com.PlushLife;

import android.graphics.Color;
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
    // Must be registered before the activity reaches STARTED, so this has to
    // be a field initializer rather than something called later from
    // onCreate/onResume.
    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {});

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateListener;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate() — this is what tells the system
        // to actually dismiss the splash screen once the first frame draws,
        // instead of leaving it (and the permanently-applied splash theme)
        // in an undefined state.
        SplashScreen.installSplashScreen(this);
        // The no-arg EdgeToEdge.enable(this) defaults both bars to
        // SystemBarStyle.auto(...), whose nightMode is MODE_NIGHT_AUTO — and
        // androidx's own EdgeToEdge implementation reads that to set
        // window.isNavigationBarContrastEnforced = true, opting the app into
        // Android's own non-customizable translucent scrim over the
        // navigation bar. That's a platform-drawn overlay sitting on top of
        // everything, which is why no theme, windowBackground, or WebView
        // CSS change ever touched it. This app has no native dark chrome
        // (colors.xml is deliberately day/night-agnostic), so pinning both
        // bars to an explicit light style — not auto — keeps nightMode off
        // MODE_NIGHT_AUTO and turns that enforced scrim off for good.
        EdgeToEdge.enable(
            this,
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationPermissionPlugin.class);
        registerPlugin(BuildInfoPlugin.class);
        // Temporarily disabled along with the FOREGROUND_SERVICE_DATA_SYNC
        // permission and <service> entry in AndroidManifest.xml — Google
        // Play requires a policy declaration (description + demo video)
        // for that permission that hasn't been submitted yet. The web app's
        // own watch-sync code already checks for this plugin's presence
        // before calling it, so leaving it unregistered safely turns the
        // whole feature off without touching any other code.
        // registerPlugin(WatchSyncBridgePlugin.class);
        super.onCreate(savedInstanceState);
        // Belt-and-suspenders: confirmed via a real device screenshot that a
        // native black title bar (showing title_activity_main, "PlushLife")
        // does persist, so the theme-level fix and postSplashScreenTheme
        // handoff (see styles.xml) might still not be the whole story.
        // getSupportActionBar() only covers an AppCompat-managed action bar;
        // getActionBar() covers the plain framework one in case this turns
        // out to be that instead. Both are no-ops if genuinely absent.
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        if (getActionBar() != null) {
            getActionBar().hide();
        }
        checkForUpdate();
    }

    // Play's own background auto-update job can lag well behind a new
    // release actually going live, leaving a device on a stale build
    // indefinitely. Asking Play Store directly on every launch closes that
    // gap. IMMEDIATE (a full-screen forced update) is tried first, but Play
    // doesn't always allow it — depends on the release track and how the
    // update was rolled out — and when it doesn't, silently doing nothing
    // is exactly the "it never tells me to update" symptom. FLEXIBLE (a
    // background download followed by a restart prompt) is the fallback.
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
        new AlertDialog.Builder(this)
            .setTitle("Update ready")
            .setMessage("A newer version of PlushLife has finished downloading.")
            .setPositiveButton("Restart now", (dialog, which) -> appUpdateManager.completeUpdate())
            .setNegativeButton("Later", null)
            .setCancelable(true)
            .show();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Covers the case where a FLEXIBLE download already finished while
        // the app was backgrounded — the listener above only fires on the
        // transition into DOWNLOADED, not on an already-downloaded state.
        if (appUpdateManager != null) {
            appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    promptToRestartForUpdate();
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        if (appUpdateManager != null && installStateListener != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.onDestroy();
    }
}
