const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const index = read("index.html");
const gentleUi = read("assets/gentle-discovery-ui.js");

const checks = [
  [index.includes('at.setHours(parts[0], parts[1], 0, 0)'), "daily reminders are built from the phone's local wall-clock hour"],
  [index.includes('date.setHours(Math.floor(taskAtMinutes / 60), taskAtMinutes % 60, 0, 0)'), "task reminders are built from the phone's local wall-clock hour"],
  [gentleUi.includes('Intl.DateTimeFormat().resolvedOptions().timeZone'), "reminder guard reads the phone IANA timezone"],
  [gentleUi.includes('new Date().getTimezoneOffset()'), "reminder guard tracks the phone UTC offset for DST changes"],
  [gentleUi.includes('plushlife:notification-phone-timezone:v1'), "phone timezone signature is persisted locally"],
  [gentleUi.includes('native.syncDailyReminders = async (options)'), "latest reminder recipe is captured for safe rescheduling"],
  [gentleUi.includes('window.Capacitor.Plugins.App.addListener("appStateChange"'), "native app resume checks for a phone timezone change"],
  [gentleUi.includes('document.addEventListener("visibilitychange"'), "foreground web/native visibility checks for timezone changes"],
  [gentleUi.includes('await native.syncDailyReminders(cloneReminderOptions(options))'), "timezone changes rebuild pending reminders using current phone time"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Phone-time notification regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Phone-time notification checks passed (${checks.length}).`);
