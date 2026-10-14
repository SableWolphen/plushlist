import assert from "node:assert/strict";
import fs from "node:fs";
import { webcrypto } from "node:crypto";
import { freshGuardianState, normalizeGuardianState } from "../src/plush-guardian-model.mjs";
import { makeGuardianBackup, parseGuardianBackup, MAX_GUARDIAN_BACKUP_BYTES } from "../src/guardian-portable-backup.mjs";
import { guardianRoutineCopy, guardianTomorrowCopy } from "../src/guardian-reminders.mjs";

const owner = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const state = freshGuardianState();
state.prefs.aiConsent = true;
state.prefs.automaticReminders = true;
state.prefs.routineNudges = true;
state.prefs.tomorrowNudges = true;
state.memories = [{ id: "one", text: "Private comfort memory" }];
state.reflections = [{ id: "two", text: "Private journal", photo: "data:image/png;base64,ZmFrZQ==" }];
state.routines = [{ id: "r1", name: "My routine", steps: ["Step 1"] }];
state.rewards = [{ id: "rw", name: "Little win" }];

assert.equal(normalizeGuardianState({ prefs: { routineNudges: "true", tomorrowNudges: "true", routineReminderTime: "99:99" } }).prefs.routineNudges, false);
assert.equal(normalizeGuardianState({ prefs: { routineReminderTime: "99:99" } }).prefs.routineReminderTime, "18:30");
const exported = await makeGuardianBackup(owner, state, webcrypto.subtle);
assert.equal(exported.owner, owner);
assert.equal(exported.version, 2);
assert.ok(exported.sha256.length === 64);
const restored = await parseGuardianBackup(JSON.stringify(exported), owner, webcrypto.subtle);
assert.equal(restored.preview.reflections, 1);
assert.equal(restored.preview.routines, 1);
assert.equal(restored.restored.reflections[0].text, "Private journal");
for (const key of ["aiConsent","automaticReminders","reminders","shareTasks","shareMood","shareMemories","keepChat"]) {
  assert.equal(restored.restored.prefs[key], false, "Restored copies must not auto-enable " + key);
}
await assert.rejects(() => parseGuardianBackup(JSON.stringify(exported), other, webcrypto.subtle), /different Cozy account/);
const changed = structuredClone(exported);
changed.companion.memories[0].text = "Tampered";
await assert.rejects(() => parseGuardianBackup(JSON.stringify(changed), owner, webcrypto.subtle), /integrity check failed/);
await assert.rejects(() => parseGuardianBackup(JSON.stringify({ ...exported, version: 1 }), owner, webcrypto.subtle), /supported private PlushLife/);
await assert.rejects(() => parseGuardianBackup("x".repeat(MAX_GUARDIAN_BACKUP_BYTES + 1025), owner, webcrypto.subtle), /size limit/);
await assert.rejects(() => makeGuardianBackup("", state, webcrypto.subtle), /Sign in/);
assert.match(guardianRoutineCopy("Bedtime", "Brush teeth", "mommy").body, /Brush teeth/);
assert.match(guardianTomorrowCopy("daddy").body, /Tomorrow/);
const native = fs.readFileSync("src/native-bridge.js", "utf8");
const app = fs.readFileSync("src/app-source.jsx", "utf8");
const settings = fs.readFileSync("src/components/plush-guardian-settings.jsx", "utf8");
const core = fs.readFileSync("src/components/plush-guardian-core.jsx", "utf8");
assert(native.includes("guardian-routine") && native.includes("guardian-tomorrow"), "Extra Guardian nudges must be scheduled and cancellable");
assert(native.includes("restDates.has(window.PlushLifeCare.localDateString(new Date()))"), "Rest day must suppress special nudges");
assert(native.includes("isQuietAt(at)"), "Quiet hours must apply to special nudges");
assert(native.includes("options.discreet ?"), "Sensitive messages must respect discreet lock-screen mode");
assert(app.includes("tomorrowTasksCount,") && app.includes("routineNudges:"), "App provides real routine and next-day task context");
assert(settings.includes("<GuardianPortableBackup"), "Backup must be discoverable from companion settings");
assert(core.includes("userId={user.id}"), "Restore must be scoped to signed-in account");
for (const theme of ["mint","peach","strawberry","cloud","garden"]) {
  assert(fs.existsSync(`android/app/src/main/res/drawable/plushlife_widget_${theme}.xml`), "Missing Android widget world: " + theme);
}
const widget = fs.readFileSync("android/app/src/main/java/com/PlushLife/PlushLifeWidgetProvider.java", "utf8");
for (const theme of ["mint","peach","strawberry","cloud","garden"]) assert(widget.includes("R.drawable.plushlife_widget_" + theme));
console.log("Guardian reminder planning, verified account-bound backup, explicit restore, and Android theme widget checks passed.");
