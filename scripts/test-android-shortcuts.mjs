import assert from "node:assert/strict";
import fs from "node:fs";
const xml=fs.readFileSync("android/app/src/main/res/xml/plushlife_shortcuts.xml","utf8");
const manifest=fs.readFileSync("android/app/src/main/AndroidManifest.xml","utf8");
const strings=fs.readFileSync("android/app/src/main/res/values/strings.xml","utf8");
const bridge=fs.readFileSync("src/native-bridge.js","utf8");
const app=fs.readFileSync("src/app-source.jsx","utf8");
const tasks=fs.readFileSync("src/components/tasks-panel.jsx","utf8");
const focus=fs.readFileSync("src/components/cozy-day-experience.jsx","utf8");
assert.ok(manifest.includes('android:name="android.app.shortcuts"'));
for (const [id,verb] of [["plushlife_add","add"],["plushlife_focus","focus"]]) {
  assert.ok(xml.includes('android:shortcutId="'+id+'"'));
  assert.ok(xml.includes('android:data="plushlife://shortcut/'+verb+'"'));
}
assert.ok(strings.includes('name="shortcut_add_task"'));
assert.ok(strings.includes('name="shortcut_focus"'));
assert.ok(bridge.includes('parsed.protocol !== "plushlife:" || parsed.hostname !== "shortcut"'),
  "Never allow arbitrary redirect URLs to control internal navigation");
assert.ok(bridge.includes('action !== "add" && action !== "focus"'));
assert.ok(bridge.includes('Plugins.App.getLaunchUrl()'));
assert.ok(app.includes('plushlife:pending-shortcut:v1'));
assert.ok(tasks.includes('plushlife:open-quick-add'));
assert.ok(focus.includes('plushlife:focus-one-step'));
assert.ok(!manifest.includes("android.permission.READ_CONTACTS"),"Shortcuts should not demand contact access");
console.log("Android launcher shortcut wiring passed: Add, Focus, allowlisted deep links and no new permissions.");
