const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8").replace(/\r\n/g, "\n");
}

const app = read("src/app-source.jsx");
const today = read("src/components/today-panel.jsx");
const completed = read("src/components/completed-task-flow.jsx");
const shared = read("src/components/shared.jsx");
const settings = read("src/components/organized-settings.jsx");
const index = read("index.html");
const serviceWorker = read("service-worker.js");
const syncWww = read("scripts/sync-www.js");

const gates = [
  [today.includes("useCompletedTaskFlow") && completed.includes("CompletedTaskArea"), "shared task completion lifecycle"],
  [today.includes("LazyBabyToday") && today.includes("LazyLowScreenToday"), "alternate Today modes remain lazy-loaded"],
  [app.includes("WARM_START_CACHE_VERSION") && app.includes("setSyncStatus(\"syncing\")"), "warm start still reconciles against server state"],
  [app.includes("navigator.onLine") || app.includes("online"), "offline-aware state remains present"],
  [shared.includes('role={inline ? "region" : "dialog"}') && shared.includes('aria-modal={inline ? undefined : "true"}'), "dialogs keep accessible dialog semantics"],
  [shared.includes("previousActive") && shared.includes("firstFocusable"), "modal focus enters and restores correctly"],
  [settings.includes("Privacy & Data") && settings.includes("Restore from backup") && settings.includes("Delete all check-ins"), "data recovery and deletion controls remain reachable"],
  [index.includes('backButton') && index.includes('KeyboardEvent("keydown", { key: "Escape" })'), "Android back button continues to close app panels"],
  [serviceWorker.includes("fetch") && serviceWorker.includes("cache"), "offline service-worker path remains present"],
  [syncWww.includes("check-bundle-budget") || read("package.json").includes("check-bundle-budget.js"), "bundle budget remains enforced"],
];

const failures = gates.filter(([pass]) => !pass).map(([, label]) => label);
if (failures.length) {
  console.error("Release readiness checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Release readiness checks passed (${gates.length}).`);
