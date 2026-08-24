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
    marker: "JSONObject.quote(data.toString())",
    edits: [
      {
        find: "import org.apache.cordova.PluginManager;\n\n/**",
        replace: "import org.apache.cordova.PluginManager;\nimport org.json.JSONObject;\n\n/**",
      },
      {
        find: '        } catch (Exception ex) {\n            Logger.error("Post message error:", ex);\n        }',
        replace:
          "        } catch (Exception ex) {\n" +
          "            // Don't log the exception message/stack trace here: postData can\n" +
          "            // contain values that originated from web content, and Android\n" +
          "            // log output isn't a safe place for that (CWE-209).\n" +
          '            Logger.error("Post message error");\n' +
          "        }",
      },
      {
        find: '        } catch (Exception ex) {\n            Logger.error("sendResponseMessage: error: " + ex);\n        }',
        replace:
          "        } catch (Exception ex) {\n" +
          "            // Same reasoning as postMessage(): avoid echoing exception\n" +
          "            // content (which can carry plugin-result data) into the log.\n" +
          '            Logger.error("sendResponseMessage error");\n' +
          "        }",
      },
      {
        find:
          '        final String runScript = "window.Capacitor.fromNative(" + data.toString() + ")";',
        replace:
          "        // Embed the payload as a properly-escaped JSON string literal (via\n" +
          "        // org.json's quote(), which escapes quotes, backslashes, control\n" +
          "        // characters and U+2028/U+2029) and reconstruct it with JSON.parse\n" +
          "        // on the JS side, instead of splicing the raw JSON object text\n" +
          "        // straight into the script we hand to evaluateJavascript(). This\n" +
          "        // keeps a plugin result's data from ever being interpreted as JS\n" +
          "        // source (CWE-79-style script injection).\n" +
          '        final String runScript = "window.Capacitor.fromNative(JSON.parse(" + JSONObject.quote(data.toString()) + "))";',
      },
    ],
  }
);

if (hadMismatch) {
  console.warn(
    "[apply-security-patches] one or more expected edits were skipped -- see warnings above."
  );
}
