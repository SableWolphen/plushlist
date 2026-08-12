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
const anchor = read("src/components/compact-anchor.jsx");
const background = read("src/components/habit-background-engine.jsx");

const checks = [
  [completed.includes("COMPLETED_LINGER_MS = 2600"), "completed tasks linger before moving"],
  [completed.includes("moved to Completed Today"), "screen-reader completion announcement exists"],
  [today.includes("useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || [])"), "all Today modes use shared completion flow"],
  [today.includes("<LowScreenToday {...modeProps} />") && today.includes("<CompletedTaskArea"), "Low Screen mode exposes Completed Today"],
  [today.includes("LowScreenJustCompleted") && today.includes("JUST COMPLETED"), "Low Screen keeps a completed task crossed off during the linger period"],
  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],
  [today.includes("YOUR FIRST FEW DAYS"), "new users get focused first-days guidance"],
  [today.includes("<CompactAnchor {...modeProps} />"), "Today uses the compact anchor instead of the full habit toolbox"],
  [!today.includes("HabitRetentionTools") && !today.includes("HabitResilienceSuite"), "advanced habit tool suites stay off Today"],
  [anchor.includes("TODAY'S ANCHOR") && !anchor.includes("HABIT ASSIST") && !anchor.includes("HABIT RESILIENCE"), "compact anchor stays focused"],
  [today.includes("<HabitBackgroundEngine {...modeProps} />"), "quiet habit engine runs behind every Today mode"],
  [background.includes("dominantMissReason") && background.includes("preferredHour") && background.includes("stability"), "background engine learns friction, timing and stability"],
  [background.includes("suggestedRamp") && background.includes("suggestedVisibleCount"), "background engine learns recovery and daily load"],
  [background.includes("crossPatterns") && background.includes("experimentResults"), "background engine evaluates cross-patterns and experiments"],
  [background.includes("maintenanceDue") && background.includes("MAX_EVENTS") && background.includes("450"), "background engine prunes, maintains and throttles work"],
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
