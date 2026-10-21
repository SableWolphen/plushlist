package com.PlushLife;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebView;
import android.graphics.Insets;
import android.view.WindowInsets;
import android.os.Bundle;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** Real optimized WebView + production CSS; no login, backend writes or test hooks in the app. */
public class EdgeToEdgeInstrumentation extends Instrumentation {
    private final Instrumentation instrumentation = this;

    @Override public void onCreate(Bundle arguments) { super.onCreate(arguments); start(); }
    @Override public void onStart() {
        Bundle result = new Bundle();
        try {
            portraitLandscapeDialogAndKeyboardRespectInsets();
            result.putString("stream", "OK (1 test)");
            finish(Activity.RESULT_OK, result);
        } catch (Throwable error) {
            result.putString("stream", android.util.Log.getStackTraceString(error));
            finish(Activity.RESULT_CANCELED, result);
        }
    }
    private static void assertTrue(String message, boolean value) { if (!value) throw new AssertionError(message); }
    private static void assertNotNull(String message, Object value) { assertTrue(message, value != null); }
    private static void assertEquals(String message, Object expected, Object actual) { assertTrue(message + ": expected=" + expected + " actual=" + actual, expected.equals(actual)); }
    private static void fail(String message) { throw new AssertionError(message); }
    private Activity activity;
    private WebView web;

    private WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private String evaluate(String script) throws Exception {
        AtomicReference<String> result = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        instrumentation.runOnMainSync(() -> web.evaluateJavascript(script, value -> {
            result.set(value);
            latch.countDown();
        }));
        assertTrue("WebView JavaScript callback", latch.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private void waitFor(String script, String message) throws Exception {
        long deadline = SystemClock.uptimeMillis() + 15000;
        do {
            if ("true".equals(evaluate(script))) return;
            SystemClock.sleep(150);
        } while (SystemClock.uptimeMillis() < deadline);
        fail(message);
    }

    private WindowInsets insets() {
        AtomicReference<WindowInsets> value = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> value.set(activity.getWindow().getDecorView().getRootWindowInsets()));
        assertNotNull("Window insets delivered", value.get());
        return value.get();
    }

    private Insets safeInsets() {
        WindowInsets windowInsets = insets();
        if (Build.VERSION.SDK_INT >= 30) return windowInsets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
        android.view.DisplayCutout cutout = windowInsets.getDisplayCutout();
        return Insets.of(
            Math.max(windowInsets.getStableInsetLeft(), cutout == null ? 0 : cutout.getSafeInsetLeft()),
            Math.max(windowInsets.getStableInsetTop(), cutout == null ? 0 : cutout.getSafeInsetTop()),
            Math.max(windowInsets.getStableInsetRight(), cutout == null ? 0 : cutout.getSafeInsetRight()),
            Math.max(windowInsets.getStableInsetBottom(), cutout == null ? 0 : cutout.getSafeInsetBottom()));
    }
    private boolean keyboardVisible() {
        WindowInsets windowInsets = insets();
        if (Build.VERSION.SDK_INT >= 30) return windowInsets.isVisible(WindowInsets.Type.ime());
        if (windowInsets.getSystemWindowInsetBottom() > windowInsets.getStableInsetBottom() + 100) return true;
        // Before Android 11, a full-window layout may report zero system-window
        // IME insets. Check the actual occluded display frame as well.
        AtomicReference<Boolean> occluded = new AtomicReference<>(false);
        instrumentation.runOnMainSync(() -> {
            View decor = activity.getWindow().getDecorView();
            android.graphics.Rect frame = new android.graphics.Rect();
            int[] location = new int[2]; decor.getLocationOnScreen(location);
            decor.getWindowVisibleDisplayFrame(frame);
            occluded.set(location[1] + decor.getHeight() - frame.bottom > Math.max(100, decor.getHeight() / 6));
        });
        return occluded.get();
    }

    private void assertSafeLayout(String label) throws Exception {
        SystemClock.sleep(700); // Allow the native inset listener and CSS update to settle.
        JSONObject rect = new JSONObject(evaluate("(() => {const n=document.querySelector('.pl-app-bottom-nav').getBoundingClientRect(),m=document.querySelector('#main-content'),s=getComputedStyle(m);return {w:innerWidth,h:innerHeight,left:n.left,right:n.right,top:n.top,bottom:n.bottom,contentTop:parseFloat(s.paddingTop),contentLeft:parseFloat(s.paddingLeft),contentRight:parseFloat(s.paddingRight)};})()"));
        AtomicReference<int[]> bounds = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> {
            int[] location = new int[2]; web.getLocationOnScreen(location);
            View decor = activity.getWindow().getDecorView();
            bounds.set(new int[]{location[0], location[1], web.getWidth(), decor.getWidth(), decor.getHeight()});
            if (Build.VERSION.SDK_INT >= 30) {
                assertEquals("Cutout drawing mode", WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS,
                    activity.getWindow().getAttributes().layoutInDisplayCutoutMode);
            }
        });
        int[] b = bounds.get();
        double scale = b[2] / rect.getDouble("w");
        Insets safe = safeInsets();
        assertTrue(label + " content below status bar/cutout: " + rect, b[1] + rect.getDouble("contentTop") * scale >= safe.top - 2);
        assertTrue(label + " content left safe", b[0] + rect.getDouble("contentLeft") * scale >= safe.left - 2);
        assertTrue(label + " content right safe", b[0] + (rect.getDouble("w") - rect.getDouble("contentRight")) * scale <= b[3] - safe.right + 2);
        assertTrue(label + " navigation left safe: " + rect, b[0] + rect.getDouble("left") * scale >= safe.left - 2);
        assertTrue(label + " navigation right safe: " + rect, b[0] + rect.getDouble("right") * scale <= b[3] - safe.right + 2);
        assertTrue(label + " navigation below status bar", b[1] + rect.getDouble("top") * scale >= safe.top - 2);
        assertTrue(label + " navigation above system bar: " + rect, b[1] + rect.getDouble("bottom") * scale <= b[4] - safe.bottom + 2);
        android.util.Log.i("PlushLifeEdgeTest", label + " safe=" + safe + " layout=" + rect);
    }

    public void portraitLandscapeDialogAndKeyboardRespectInsets() throws Exception {
        Intent intent = new Intent().setClassName("com.PlushLife", "com.PlushLife.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity = instrumentation.startActivitySync(intent);
        try {
            instrumentation.runOnMainSync(() -> web = findWebView(activity.getWindow().getDecorView()));
            assertNotNull("Capacitor WebView created", web);
            android.content.pm.PackageInfo webPackage = WebView.getCurrentWebViewPackage();
            android.util.Log.i("PlushLifeEdgeTest", "API=" + Build.VERSION.SDK_INT + " WebView=" + (webPackage == null ? "unknown" : webPackage.versionName));
            String css = "";
            for (String asset : new String[]{"figma-design.css", "final-mobile-ui.css"}) {
                try (java.io.InputStream stream = activity.getAssets().open("public/assets/" + asset)) {
                    java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
                    byte[] buffer = new byte[8192];
                    for (int count; (count = stream.read(buffer)) != -1;) bytes.write(buffer, 0, count);
                    css += new String(bytes.toByteArray(), StandardCharsets.UTF_8);
                }
            }
            String html = "<meta name='viewport' content='width=device-width,initial-scale=1,viewport-fit=cover'><style>" + css
                + "body{margin:0}#main-content{box-sizing:border-box;min-height:100dvh}.pl-tool-backdrop{position:fixed;inset:0;display:grid;place-items:center}.pl-tool-panel{width:760px;height:1500px;overflow:auto}.pl-app-bottom-nav{transform:translateX(-50%)}input{font-size:16px;width:180px;height:44px}</style>"
                + "<main id='main-content' data-pl-world='home'><input id='edge-input' aria-label='Inset test input'><nav class='pl-app-bottom-nav'><button>Home</button><button>Plan</button></nav></main>"
                + "<div class='pl-tool-backdrop' hidden style='display:none'><div class='pl-tool-panel'>Dialog</div></div>";
            final String fixture = html;
            instrumentation.runOnMainSync(() -> web.loadDataWithBaseURL("https://localhost/", fixture, "text/html", "UTF-8", null));
            waitFor("document.querySelector('#edge-input')!==null && document.readyState==='complete'", "Local layout fixture loaded");
            instrumentation.runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
            waitFor("innerHeight>innerWidth", "Portrait layout");
            assertSafeLayout("portrait");
            instrumentation.runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            waitFor("innerWidth>innerHeight", "Landscape layout");
            assertSafeLayout("landscape");
            evaluate("document.querySelector('.pl-tool-backdrop').style.display='grid'");
            SystemClock.sleep(300);
            android.util.Log.i("PlushLifeEdgeTest", "dialog=" + evaluate("(() => {const r=document.querySelector('.pl-tool-panel').getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};})()"));
            assertEquals("Dialog fits the padded backdrop in landscape", "true", evaluate("(() => {const p=document.querySelector('.pl-tool-panel').getBoundingClientRect(),b=document.querySelector('.pl-tool-backdrop'),s=getComputedStyle(b);return p.top>=parseFloat(s.paddingTop)-1&&p.left>=parseFloat(s.paddingLeft)-1&&p.right<=innerWidth-parseFloat(s.paddingRight)+1&&p.bottom<=innerHeight-parseFloat(s.paddingBottom)+1;})()"));
            evaluate("document.querySelector('.pl-tool-backdrop').style.display='none'");
            instrumentation.runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
            waitFor("innerHeight>innerWidth", "Return to portrait");
            assertSafeLayout("portrait restored");
            double oldHeight = Double.parseDouble(evaluate("innerHeight"));
            JSONObject input = new JSONObject(evaluate("(() => {const r=document.querySelector('#edge-input').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:innerWidth};})()"));
            AtomicReference<float[]> tap = new AtomicReference<>();
            instrumentation.runOnMainSync(() -> {
                int[] location = new int[2]; web.getLocationOnScreen(location);
                float scale = (float)(web.getWidth() / input.optDouble("w"));
                tap.set(new float[]{location[0] + (float)input.optDouble("x") * scale, location[1] + (float)input.optDouble("y") * scale});
            });
            long time = SystemClock.uptimeMillis();
            instrumentation.sendPointerSync(MotionEvent.obtain(time,time,MotionEvent.ACTION_DOWN,tap.get()[0],tap.get()[1],0));
            instrumentation.sendPointerSync(MotionEvent.obtain(time,time+60,MotionEvent.ACTION_UP,tap.get()[0],tap.get()[1],0));
            long deadline = SystemClock.uptimeMillis() + 10000;
            while (!keyboardVisible() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(150);
            assertTrue("Real keyboard visible", keyboardVisible());
            waitFor("innerHeight<" + (oldHeight - 50), "WebView resized above keyboard");
            assertEquals("Navigation stays inside resized viewport", "true", evaluate("innerHeight>100 && document.querySelector('#edge-input').getBoundingClientRect().bottom<=innerHeight+1 && document.querySelector('.pl-app-bottom-nav').getBoundingClientRect().top>=-1 && document.querySelector('.pl-app-bottom-nav').getBoundingClientRect().bottom<=innerHeight+1"));
            instrumentation.sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);
            waitFor("innerHeight>=" + (oldHeight - 2), "Viewport restored after keyboard closes");
            assertSafeLayout("keyboard dismissed");
        } finally {
            instrumentation.runOnMainSync(() -> activity.finish());
        }
    }
}
