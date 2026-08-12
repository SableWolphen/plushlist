const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const today = read("src/components/today-panel.jsx");
const completed = read("src/components/completed-task-flow.jsx");
const baby = read("src/components/baby-today.jsx");
const progress = read("src/components/progress-panel.jsx");
const shared = read("src/components/shared.jsx");

const checks = [
  [completed.includes("COMPLETED_LINGER_MS = 2600"), "completed tasks linger before moving"],
  [completed.includes("moved to Completed Today"), "screen-reader completion announcement exists"],
  [today.includes("useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || [])"), "all Today modes use shared completion flow"],
  [today.includes("<LowScreenToday {...modeProps} />") && today.includes("<CompletedTaskArea"), "Low Screen mode exposes Completed Today"],
  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],
  [today.includes("YOUR FIRST FEW DAYS"), "new users get focused first-days guidance"],
  [progress.includes("Why PlushLife thinks this:"), "habit insights explain their evidence"],
  [shared.includes("previousActive") && shared.includes("firstFocusable"), "dialogs restore and manage keyboard focus"],
  [shared.includes("minHeight: 44"), "shared dialog action meets minimum touch target"],
  [shared.includes("Simple Layout reduces ambient theme effects"), "Simple Layout/theme interaction is explained"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Product quality regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Product quality checks passed (${checks.length}).`);
