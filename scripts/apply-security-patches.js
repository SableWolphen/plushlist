#!/usr/bin/env node
// Applies small, targeted source fixes to vendored Capacitor native code in
// node_modules after every `npm install`/`npm ci`, since the Android build
// (`npm run android:sync` -> Gradle) reads plugin/platform Java source
// straight out of node_modules rather than a copy.
//
// This exists instead of a `.patch` file + patch-package because these are
// exact, tiny, well-understood string replacements -- doing them with plain
// string matching avoids adding patch-package and its dependency tree to
// package-lock.json for the sake of two files, and fails soft (warns, does
// not throw) if a future version bump changes the vendored source shape
// underneath us, so a mismatch here never breaks `npm ci` for unrelated
// work.
//
// See: CodeQL alerts #12 (LocalNotificationRestoreReceiver, CWE-925),
// #11 and #10 (MessageHandler.java, XSS + CWE-209).

const fs = require("fs");
const path = require("path");

let hadMismatch = false;

function patchFile(relPath, replacements) {
  const filePath = path.join(__dirname, "..", relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[apply-security-patches] skip (not found): ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const markerPresent = content.includes(replacements.marker);
  if (markerPresent) {
    // Already patched (e.g. re-running postinstall without a fresh install).
    return;
  }

  let changed = false;
  for (const { find, replace } of replacements.edits) {
    if (content.includes(find)) {
      content = content.replace(find, replace);
      changed = true;
    } else {
      console.warn(
        `[apply-security-patches] expected text not found in ${relPath} -- ` +
          "this file's vendored source may have changed shape. Skipping " +
          "this edit rather than risk corrupting the file; the underlying " +
          "CodeQL alert may need a fresh look."
      );
      hadMismatch = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[apply-security-patches] patched ${relPath}`);
  }
}

// --- Alert #12: verify the intent action before doing any work ---
patchFile(
  "node_modules/@capacitor/local-notifications/android/src/main/java/com/capacitorjs/plugins/localnotifications/LocalNotificationRestoreReceiver.java",
  {
    marker: "ALLOWED_ACTIONS",
    edits: [
      {
        find: "import java.util.ArrayList;\nimport java.util.Date;\nimport java.util.List;",
        replace:
          "import java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.Date;\nimport java.util.HashSet;\nimport java.util.List;\nimport java.util.Set;",
      },
      {
        find:
          "public class LocalNotificationRestoreReceiver extends BroadcastReceiver {\n\n    @Override\n    public void onReceive(Context context, Intent intent) {\n        UserManager um = context.getSystemService(UserManager.class);",
        replace:
          "public class LocalNotificationRestoreReceiver extends BroadcastReceiver {\n\n" +
          "    // Defense-in-depth: this receiver is registered exported=\"false\" with an\n" +
          "    // intent-filter limited to the boot/quickboot actions below, so it is not\n" +
          "    // reachable by other apps in practice. We still verify the action\n" +
          "    // explicitly before doing any work, in case onReceive is ever invoked\n" +
          "    // through another path (e.g. a future manifest change, or test tooling).\n" +
          "    private static final Set<String> ALLOWED_ACTIONS = new HashSet<>(\n" +
          '        Arrays.asList(Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_LOCKED_BOOT_COMPLETED, "android.intent.action.QUICKBOOT_POWERON")\n' +
          "    );\n\n" +
          "    @Override\n" +
          "    public void onReceive(Context context, Intent intent) {\n" +
          "        String action = intent.getAction();\n" +
          "        if (action == null || !ALLOWED_ACTIONS.contains(action)) {\n" +
          "            return;\n" +
          "        }\n\n" +
          "        UserManager um = context.getSystemService(UserManager.class);",
      },
    ],
  }
);

// --- Alerts #11 (XSS) and #10 (info exposure) ---
patchFile(
  "node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/MessageHandler.java",
  {
    marker: "__capacitorPayloadBridge",
    edits: [
      {
        find: "import org.apache.cordova.PluginManager;\n\n/**",
        replace:
          "import org.apache.cordova.PluginManager;\n" +
          "import java.util.concurrent.ConcurrentLinkedQueue;\n\n/**",
      },
      {
        find:
          "    private JavaScriptReplyProxy javaScriptReplyProxy;\n\n" +
          "    public MessageHandler(Bridge bridge, WebView webView, PluginManager cordovaPluginManager) {",
        replace:
          "    private JavaScriptReplyProxy javaScriptReplyProxy;\n" +
          "    private final ConcurrentLinkedQueue<String> legacyPayloadQueue = new ConcurrentLinkedQueue<>();\n\n" +
          "    private final class LegacyPayloadBridge {\n" +
          "        @JavascriptInterface\n" +
          "        public String take() {\n" +
          "            String payload = legacyPayloadQueue.poll();\n" +
          "            return payload == null ? \"{}\" : payload;\n" +
          "        }\n" +
          "    }\n\n" +
          "    public MessageHandler(Bridge bridge, WebView webView, PluginManager cordovaPluginManager) {",
      },
      {
        find:
          "        this.bridge = bridge;\n" +
          "        this.webView = webView;\n" +
          "        this.cordovaPluginManager = cordovaPluginManager;\n\n" +
          "        if (WebViewFeature.isFeatureSupported",
        replace:
          "        this.bridge = bridge;\n" +
          "        this.webView = webView;\n" +
          "        this.cordovaPluginManager = cordovaPluginManager;\n" +
          "        // Keep plugin response data out of dynamically-generated JavaScript.\n" +
          "        // The constant script below pulls one queued JSON payload through this\n" +
          "        // private bridge and parses it as data, so untrusted values never become\n" +
          "        // JavaScript source text.\n" +
          "        webView.addJavascriptInterface(new LegacyPayloadBridge(), \"__capacitorPayloadBridge\");\n\n" +
          "        if (WebViewFeature.isFeatureSupported",
      },
      {
        find: '                Logger.error("JavaScript Error: " + jsonStr);',
        replace: '                Logger.error("JavaScript error received from WebView");',
      },
      {
        find:
          '                Logger.verbose(\n' +
          '                    Logger.tags("Plugin"),\n' +
          '                    "To native (Cordova plugin): callbackId: " +\n' +
          '                        callbackId +\n' +
          '                        ", service: " +\n' +
          '                        service +\n' +
          '                        ", action: " +\n' +
          '                        action +\n' +
          '                        ", actionArgs: " +\n' +
          '                        actionArgs\n' +
          '                );',
        replace:
          '                Logger.verbose(Logger.tags("Plugin"), "To native (Cordova plugin): request received");',
      },
      {
        find: '        } catch (Exception ex) {\n            Logger.error("Post message error:", ex);\n        }',
        replace:
          "        } catch (Exception ex) {\n" +
          "            Logger.error(\"Post message error\");\n" +
          "        }",
      },
      {
        find: '                Logger.debug("Sending plugin error: " + data.toString());',
        replace: '                Logger.debug("Sending plugin error");',
      },
      {
        find: '        } catch (Exception ex) {\n            Logger.error("sendResponseMessage: error: " + ex);\n        }',
        replace:
          "        } catch (Exception ex) {\n" +
          "            Logger.error(\"sendResponseMessage error\");\n" +
          "        }",
      },
      {
        find:
          '    private void legacySendResponseMessage(PluginResult data) {\n' +
          '        final String runScript = "window.Capacitor.fromNative(" + data.toString() + ")";\n' +
          '        final WebView webView = this.webView;\n' +
          '        webView.post(() -> webView.evaluateJavascript(runScript, null));\n' +
          '    }',
        replace:
          "    private void legacySendResponseMessage(PluginResult data) {\n" +
          "        legacyPayloadQueue.add(data.toString());\n" +
          "        final WebView webView = this.webView;\n" +
          "        webView.post(() -> webView.evaluateJavascript(\n" +
          "            \"window.Capacitor.fromNative(JSON.parse(window.__capacitorPayloadBridge.take()))\",\n" +
          "            null\n" +
          "        ));\n" +
          "    }",
      },
    ],
  }
);

if (hadMismatch) {
  console.error(
    "[apply-security-patches] SECURITY PATCH MISMATCH: refusing to continue with unpatched vendored native code."
  );
  process.exit(1);
}
