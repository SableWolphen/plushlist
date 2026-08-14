#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const layoutPath = path.join(ROOT, "android/app/src/main/res/layout/plushlife_widget.xml");
const infoPath = path.join(ROOT, "android/app/src/main/res/xml/plushlife_widget_info.xml");
const manifestPath = path.join(ROOT, "android/app/src/main/AndroidManifest.xml");
const providerPath = path.join(ROOT, "android/app/src/main/java/com/PlushLife/PlushLifeWidgetProvider.java");
const bridgePath = path.join(ROOT, "android/app/src/main/java/com/PlushLife/WidgetBridgePlugin.java");

const failures = [];
for (const required of [layoutPath, infoPath, manifestPath, providerPath, bridgePath]) {
  if (!fs.existsSync(required)) failures.push(`Missing Android widget file: ${path.relative(ROOT, required)}`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function stripXmlComments(source) {
  let output = "";
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf("<!--", cursor);
    if (start === -1) {
      output += source.slice(cursor);
      break;
    }
    output += source.slice(cursor, start);
    const end = source.indexOf("-->", start + 4);
    if (end === -1) {
      throw new Error("Widget layout contains an unterminated XML comment.");
    }
    output += " ".repeat(end + 3 - start);
    cursor = end + 3;
  }
  return output;
}

if (fs.existsSync(layoutPath)) {
  const layout = read(layoutPath);
  let layoutWithoutComments = layout;
  try {
    layoutWithoutComments = stripXmlComments(layout);
  } catch (error) {
    failures.push(error.message);
  }
  const tags = [...layoutWithoutComments.matchAll(/<\/?([A-Za-z0-9_.]+)(?:\s|>|\/)/g)].map((match) => match[1]);
  const allowed = new Set([
    "LinearLayout", "RelativeLayout", "FrameLayout", "GridLayout", "TextView", "Button",
    "ImageView", "ImageButton", "ProgressBar", "Chronometer", "AnalogClock", "ViewFlipper",
    "ListView", "GridView", "StackView", "AdapterViewFlipper",
  ]);
  const unsupported = [...new Set(tags.filter((tag) => !allowed.has(tag) && !tag.startsWith("android.widget.")))];
  if (unsupported.length) failures.push(`Unsupported RemoteViews widget tags: ${unsupported.join(", ")}`);
  if (!layout.includes('android:id="@+id/widget_root"')) failures.push("Widget root id is missing.");
}

if (fs.existsSync(infoPath)) {
  const info = read(infoPath);
  if (!info.includes('android:initialLayout="@layout/plushlife_widget"')) failures.push("Widget initialLayout is incorrect.");
  if (!info.includes('android:previewLayout="@layout/plushlife_widget"')) failures.push("Samsung-compatible widget previewLayout is missing.");
  if (!info.includes('android:widgetCategory="home_screen"')) failures.push("Widget is not registered for the home screen.");
}

if (fs.existsSync(manifestPath)) {
  const manifest = read(manifestPath);
  if (!manifest.includes('android:name=".PlushLifeWidgetProvider"')) failures.push("Widget provider receiver is missing from AndroidManifest.xml.");
  if (!manifest.includes("android.appwidget.action.APPWIDGET_UPDATE")) failures.push("APPWIDGET_UPDATE intent filter is missing.");
  if (!manifest.includes("android.intent.action.MY_PACKAGE_REPLACED")) failures.push("Widget will not refresh after app updates.");
}

if (fs.existsSync(providerPath)) {
  const provider = read(providerPath);
  for (const requiredId of ["widget_root", "widget_day_type", "widget_progress", "widget_weekly_progress"]) {
    if (!provider.includes(`R.id.${requiredId}`)) failures.push(`Widget provider no longer references ${requiredId}.`);
  }
  for (const lifecycle of ["onEnabled", "onUpdate", "onAppWidgetOptionsChanged", "onRestored"]) {
    if (!provider.includes(`${lifecycle}(`)) failures.push(`Widget provider is missing ${lifecycle}.`);
  }
  if (!provider.includes("refreshAll(context)")) failures.push("Widget provider does not refresh all widget instances.");
  if (!provider.includes("plushlifeTaskAction")) failures.push("Widget task rows no longer expose the quick Done action.");
}

if (fs.existsSync(bridgePath)) {
  const bridge = read(bridgePath);
  for (const marker of [
    "window.__plushlifeWidgetSyncInstalled",
    "document.addEventListener('change'",
    "setInterval(sync,30000)",
    "plugin.updateWidget",
    "consumeWidgetAction",
    "getBridge().getWebView().evaluateJavascript",
  ]) {
    if (!bridge.includes(marker)) failures.push(`Widget bridge integration marker is missing: ${marker}`);
  }
}

if (failures.length) {
  console.error("Android widget validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Android widget validation passed.");
