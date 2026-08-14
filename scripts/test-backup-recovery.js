const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n"); }
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${message}`);
}

const backup = read("src/device-backup.js");
const app = read("src/app-source.jsx");
const settings = read("src/components/organized-settings.jsx");
const focus = read("src/components/compact-anchor.jsx");
const today = read("src/components/today-panel-core.jsx");

assert(backup.includes("MAX_DEVICE_SNAPSHOTS = 3") && backup.includes("snapshots"), "keeps multiple on-device recovery snapshots");
assert(backup.includes("SHA-256") && backup.includes("verifyDeviceBackup"), "verifies the latest device backup with an integrity checksum");
assert(backup.includes("BACKUP_STALE_AFTER_MS") && backup.includes("stale"), "flags stale backups without deleting them");
assert(backup.includes("cloudDataDeleted: false"), "device backup policy cannot silently delete cloud data");
assert(app.includes("createDeviceBackup(supabase, user)") && app.includes("Safety copy") && app.includes("before restoring"), "restore requires a fresh safety snapshot first");
assert(app.includes("Restore preview") && app.includes("categorySummary"), "restore shows a category/count preview before changing data");
assert(app.includes('supabase.from("feedback_messages").insert({\n      user_id: user?.id || null,\n      message:'), "feedback no longer duplicates the signed-in email address");
assert(settings.includes("Verify backup") && settings.includes("Recovery snapshots") && settings.includes("Backup needs refreshing"), "Privacy & Data exposes verification, retention, and freshness state");
assert(focus.includes("minHeight: 44") && focus.includes('margin: "-7px 0"'), "compact Focus Habit controls keep 44px touch targets without growing the card");
assert(today.includes("plushlife-compact-hit-target"), "compact Today controls use enlarged mobile hit targets");

if (process.exitCode) process.exit(process.exitCode);
console.log("Backup/recovery regression checks passed.");
